import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { stripe } from '../lib/stripe';
import ApiError from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';
import { logger } from '../lib/logger';

// ─────────────────────────────────────────
// Helper — get userId from request
// Handles both (req as any).userId and (req as any).user.userId
// ─────────────────────────────────────────
function getUserId(req: Request): string {
  return (req as any).userId || (req as any).user?.userId;
}

// ─────────────────────────────────────────
// POST /billing/checkout
// ─────────────────────────────────────────
export const createCheckoutSession = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const { workspaceId } = req.body;

    if (!workspaceId) throw new ApiError('workspaceId is required', 400);

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: { where: { userId } },
      },
    });

    if (!workspace) throw new ApiError('Workspace not found', 404);

    const member = workspace.members[0];
    if (!member || member.role !== 'OWNER') {
      throw new ApiError('Only workspace owners can manage billing', 403);
    }

    if (workspace.plan === 'PRO') {
      throw new ApiError('Workspace is already on Pro plan', 400);
    }

    // Get or create Stripe customer
    let customerId = workspace.stripeCustomerId;

    if (!customerId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      const customer = await stripe.customers.create({
        email: user!.email,
        name: user!.name,
        metadata: {
          workspaceId: workspace.id,
          userId,
        },
      });

      customerId = customer.id;

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session with metadata
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      metadata: {
        workspaceId: workspace.id,
      },
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/billing?success=true`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/billing?canceled=true`,
      subscription_data: {
        metadata: {
          workspaceId: workspace.id,
        },
      },
    });

    logger.info({ workspaceId, customerId, sessionId: session.id }, 'Stripe checkout session created');
    res.json({ url: session.url });
  }
);

// ─────────────────────────────────────────
// POST /billing/portal
// ─────────────────────────────────────────
export const createPortalSession = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const { workspaceId } = req.body;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: { where: { userId } },
      },
    });

    if (!workspace) throw new ApiError('Workspace not found', 404);

    const member = workspace.members[0];
    if (!member || member.role !== 'OWNER') {
      throw new ApiError('Only owners can manage billing', 403);
    }

    if (!workspace.stripeCustomerId) {
      throw new ApiError('No billing account found', 400);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/billing`,
    });

    logger.info({ workspaceId, customerId: workspace.stripeCustomerId }, 'Stripe billing portal session created');
    res.json({ url: session.url });
  }
);

// ─────────────────────────────────────────
// GET /billing/status
// ─────────────────────────────────────────
export const getBillingStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const workspaceId = req.query.workspaceId as string;

    if (!workspaceId) throw new ApiError('workspaceId is required', 400);

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: { where: { userId } },
        _count: {
          select: {
            projects: { where: { deletedAt: null } },
            members: true,
          },
        },
      },
    });

    if (!workspace) throw new ApiError('Workspace not found', 404);
    if (!workspace.members[0]) throw new ApiError('Access denied', 403);

    res.json({
      plan: workspace.plan,
      stripeCustomerId: workspace.stripeCustomerId,
      stripeSubscriptionId: workspace.stripeSubscriptionId,
      usage: {
        projects: workspace._count.projects,
        members: workspace._count.members,
        projectLimit: workspace.plan === 'PRO' ? 'Unlimited' : '3',
        memberLimit: workspace.plan === 'PRO' ? 'Unlimited' : '5',
      },
    });
  }
);

// ─────────────────────────────────────────
// POST /billing/webhook
// ─────────────────────────────────────────
export const handleWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    res.status(400).json({ error: 'No signature' });
    return;
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Idempotency Check: Prevent duplicate webhooks from Stripe
    const existingWebhook = await prisma.processedWebhook.findUnique({
      where: { id: event.id },
    });

    if (existingWebhook) {
      logger.info({ eventId: event.id, type: event.type }, 'Stripe webhook event already processed. Skipping duplicate.');
      res.json({ received: true, duplicate: true });
      return;
    }
  } catch (err: any) {
    logger.error({ err: err.message }, 'Stripe webhook signature verification failed');
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;

        const workspaceId = session.metadata?.workspaceId;
        const customerStr = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionIdStr = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

        if (!workspaceId) {
          logger.warn({ eventId: event.id }, 'workspaceId missing from checkout session metadata, attempting customer fallback');

          // Fallback — find workspace by stripeCustomerId
          if (customerStr) {
            const workspace = await prisma.workspace.findFirst({
              where: { stripeCustomerId: customerStr },
            });

            if (workspace) {
              await prisma.workspace.updateMany({
                where: { id: workspace.id },
                data: {
                  plan: 'PRO',
                  stripeSubscriptionId: subscriptionIdStr || null,
                },
              });
              logger.info({ workspaceId: workspace.id }, 'Workspace upgraded to PRO via customer fallback');
            } else {
              logger.error({ customer: customerStr }, 'Could not find workspace by customer fallback');
            }
          }
          break;
        }

        await prisma.workspace.updateMany({
          where: { id: workspaceId },
          data: {
            plan: 'PRO',
            stripeSubscriptionId: subscriptionIdStr || null,
          },
        });

        logger.info({ workspaceId }, 'Workspace upgraded to PRO successfully');
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        if (!subscriptionId) break;

        const workspace = await prisma.workspace.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });

        if (workspace) {
          await prisma.workspace.updateMany({
            where: { id: workspace.id },
            data: { plan: 'PRO' },
          });
          logger.info({ workspaceId: workspace.id }, 'Subscription renewed: Workspace retained PRO plan');
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        if (!subscriptionId) break;

        const workspace = await prisma.workspace.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });
        if (workspace) {
          await prisma.workspace.updateMany({
            where: { id: workspace.id },
            data: { plan: 'FREE' },
          });
          logger.warn({ workspaceId: workspace.id }, 'Invoice payment failed: Downgraded workspace to FREE plan');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const workspace = await prisma.workspace.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (workspace) {
          await prisma.workspace.updateMany({
            where: { id: workspace.id },
            data: { plan: 'FREE', stripeSubscriptionId: null },
          });
          logger.info({ workspaceId: workspace.id }, 'Subscription cancelled: Reset workspace plan to FREE');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const workspace = await prisma.workspace.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (workspace) {
          const isPro = ['active', 'trialing'].includes(subscription.status);
          await prisma.workspace.updateMany({
            where: { id: workspace.id },
            data: { plan: isPro ? 'PRO' : 'FREE' },
          });
          logger.info({ workspaceId: workspace.id, isPro, status: subscription.status }, 'Subscription updated');
        }
        break;
      }

      default:
        logger.debug({ eventType: event.type }, 'Unhandled stripe webhook event received');
        break;
    }

    // Mark webhook as processed for idempotency
    await prisma.processedWebhook.create({
      data: {
        id: event.id,
        type: event.type,
      },
    });
  } catch (err: any) {
    logger.error({ err: err.message, stack: err.stack }, 'Stripe webhook processing error');
    res.status(500).json({ error: 'Processing failed' });
    return;
  }

  res.json({ received: true });
};