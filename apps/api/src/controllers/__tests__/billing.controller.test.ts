import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { stripe } from '../../lib/stripe';
import { generateAccessToken } from '../../lib/jwt';

process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.STRIPE_PRICE_ID = 'price_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    workspace: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    processedWebhook: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../../lib/stripe', () => ({
  stripe: {
    customers: {
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn(),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}));

describe('Billing Controller & Stripe Webhooks', () => {
  const testUserId = 'owner_user_1';
  const ownerToken = generateAccessToken({ userId: testUserId, email: 'owner@example.com' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/billing/checkout', () => {
    it('returns 400 if workspaceId is missing', async () => {
      const res = await request(app)
        .post('/api/v1/billing/checkout')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/workspaceId is required/i);
    });

    it('returns 403 if requester is not the OWNER of the workspace', async () => {
      (prisma.workspace.findUnique as jest.Mock).mockResolvedValue({
        id: 'ws_1',
        plan: 'FREE',
        members: [{ role: 'MEMBER', userId: testUserId }],
      });

      const res = await request(app)
        .post('/api/v1/billing/checkout')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ workspaceId: 'ws_1' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/only workspace owners/i);
    });

    it('returns 400 if workspace is already on PRO plan', async () => {
      (prisma.workspace.findUnique as jest.Mock).mockResolvedValue({
        id: 'ws_1',
        plan: 'PRO',
        members: [{ role: 'OWNER', userId: testUserId }],
      });

      const res = await request(app)
        .post('/api/v1/billing/checkout')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ workspaceId: 'ws_1' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already on pro plan/i);
    });

    it('creates customer (if needed) and returns checkout session url for PRO upgrade', async () => {
      (prisma.workspace.findUnique as jest.Mock).mockResolvedValue({
        id: 'ws_1',
        plan: 'FREE',
        stripeCustomerId: null,
        members: [{ role: 'OWNER', userId: testUserId }],
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        email: 'owner@example.com',
        name: 'Workspace Owner',
      });
      (stripe.customers.create as jest.Mock).mockResolvedValue({ id: 'cus_stripe_123' });
      (prisma.workspace.update as jest.Mock).mockResolvedValue({ id: 'ws_1', stripeCustomerId: 'cus_stripe_123' });
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
        id: 'cs_test_999',
        url: 'https://checkout.stripe.com/pay/cs_test_999',
      });

      const res = await request(app)
        .post('/api/v1/billing/checkout')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ workspaceId: 'ws_1' });

      expect(res.status).toBe(200);
      expect(res.body.url).toBe('https://checkout.stripe.com/pay/cs_test_999');
      expect(stripe.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'owner@example.com' })
      );
    });
  });

  describe('POST /api/v1/billing/portal', () => {
    it('returns billing portal session url for managing subscription', async () => {
      (prisma.workspace.findUnique as jest.Mock).mockResolvedValue({
        id: 'ws_1',
        stripeCustomerId: 'cus_stripe_123',
        members: [{ role: 'OWNER', userId: testUserId }],
      });
      (stripe.billingPortal.sessions.create as jest.Mock).mockResolvedValue({
        url: 'https://billing.stripe.com/p/session_test',
      });

      const res = await request(app)
        .post('/api/v1/billing/portal')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ workspaceId: 'ws_1' });

      expect(res.status).toBe(200);
      expect(res.body.url).toBe('https://billing.stripe.com/p/session_test');
    });
  });

  describe('POST /api/v1/billing/webhook', () => {
    it('returns 400 if stripe-signature header is missing', async () => {
      const res = await request(app)
        .post('/api/v1/billing/webhook')
        .send({ id: 'evt_1' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('No signature');
    });

    it('returns 200 and skips processing when webhook event was already processed (idempotency)', async () => {
      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
        id: 'evt_duplicate_123',
        type: 'checkout.session.completed',
        data: { object: {} },
      });
      (prisma.processedWebhook.findUnique as jest.Mock).mockResolvedValue({
        id: 'evt_duplicate_123',
        type: 'checkout.session.completed',
      });

      const res = await request(app)
        .post('/api/v1/billing/webhook')
        .set('stripe-signature', 'valid_sig_test')
        .send(JSON.stringify({ id: 'evt_duplicate_123' }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true, duplicate: true });
      expect(prisma.workspace.updateMany).not.toHaveBeenCalled();
    });

    it('processes checkout.session.completed, upgrades workspace to PRO and records event in processed_webhooks', async () => {
      const mockEvent = {
        id: 'evt_new_checkout_456',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { workspaceId: 'ws_1' },
            customer: 'cus_123',
            subscription: 'sub_stripe_abc',
          },
        },
      };

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (prisma.processedWebhook.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.workspace.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.processedWebhook.create as jest.Mock).mockResolvedValue({ id: 'evt_new_checkout_456' });

      const res = await request(app)
        .post('/api/v1/billing/webhook')
        .set('stripe-signature', 'valid_sig_test')
        .send(JSON.stringify(mockEvent));

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);
      expect(prisma.workspace.updateMany).toHaveBeenCalledWith({
        where: { id: 'ws_1' },
        data: {
          plan: 'PRO',
          stripeSubscriptionId: 'sub_stripe_abc',
        },
      });
      expect(prisma.processedWebhook.create).toHaveBeenCalledWith({
        data: {
          id: 'evt_new_checkout_456',
          type: 'checkout.session.completed',
        },
      });
    });

    it('processes customer.subscription.deleted and downgrades workspace to FREE', async () => {
      const mockEvent = {
        id: 'evt_sub_deleted_789',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_stripe_abc',
          },
        },
      };

      (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent);
      (prisma.processedWebhook.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue({ id: 'ws_1' });
      (prisma.workspace.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.processedWebhook.create as jest.Mock).mockResolvedValue({ id: 'evt_sub_deleted_789' });

      const res = await request(app)
        .post('/api/v1/billing/webhook')
        .set('stripe-signature', 'valid_sig_test')
        .send(JSON.stringify(mockEvent));

      expect(res.status).toBe(200);
      expect(prisma.workspace.updateMany).toHaveBeenCalledWith({
        where: { id: 'ws_1' },
        data: {
          plan: 'FREE',
          stripeSubscriptionId: null,
        },
      });
    });
  });
});
