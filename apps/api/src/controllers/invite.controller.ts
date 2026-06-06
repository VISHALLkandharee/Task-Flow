import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import ApiError from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';
import { sendInviteEmail } from '../jobs/emailQueue';
import { z } from 'zod';

const InviteSchema = z.object({
  email: z.string().email('Invalid email'),
  workspaceId: z.string().min(1),
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
});

// ─────────────────────────────────────────
// POST /invites — send an invite
// ─────────────────────────────────────────
export const sendInvite = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    // Validate input
    const result = InviteSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(result.error.issues[0].message, 400);
    }

    const { email, workspaceId, role } = result.data;

    // Check current user's role — only OWNER/ADMIN can invite
    const currentMember = await prisma.member.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
      include: {
        workspace: true,
        user: true,
      },
    });

    if (!currentMember) {
      throw new ApiError('Access denied', 403);
    }

    if (!['OWNER', 'ADMIN'].includes(currentMember.role)) {
      throw new ApiError('Only owners and admins can invite members', 403);
    }

    // Check free plan member limit
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (workspace?.plan === 'FREE' && (workspace._count.members || 0) >= 5) {
      throw new ApiError(
        'Free plan is limited to 5 members. Upgrade to Pro for unlimited members.',
        403,
      );
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const alreadyMember = await prisma.member.findUnique({
        where: {
          userId_workspaceId: {
            userId: existingUser.id,
            workspaceId,
          },
        },
      });
      if (alreadyMember) {
        throw new ApiError('User is already a member', 409);
      }
    }

    // Check for existing pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: {
        email,
        workspaceId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new ApiError('An invite has already been sent to this email', 409);
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create invite in DB
    const invite = await prisma.invite.create({
      data: {
        email,
        token,
        role: role || 'MEMBER',
        status: 'PENDING',
        expiresAt,
        workspaceId,
        invitedById: userId,
      },
    });

    // Queue email — non-blocking, instant response
    await sendInviteEmail({
      to: email,
      inviterName: currentMember.user.name,
      workspaceName: currentMember.workspace.name,
      inviteToken: token,
    });

    res.status(201).json({
      message: `Invite sent to ${email}`,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    });
  }
);

// ─────────────────────────────────────────
// GET /invites/:token — get invite details
// (used on the accept invite page)
// ─────────────────────────────────────────
export const getInvite = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.params.token as string;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
        invitedBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (!invite) throw new ApiError('Invite not found', 404);

    if (invite.status !== 'PENDING') {
      throw new ApiError('This invite has already been used', 400);
    }

    if (invite.expiresAt < new Date()) {
      // Mark as expired
      await prisma.invite.update({
        where: { token },
        data: { status: 'EXPIRED' },
      });
      throw new ApiError('This invite has expired', 400);
    }

    res.json({ invite });
  }
);

// ─────────────────────────────────────────
// POST /invites/:token/accept — accept invite
// ─────────────────────────────────────────
export const acceptInvite = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const token = req.params.token as string;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { 
        workspace: {
          include: {
            _count: { select: { members: true } }
          }
        } 
      },
    });

    if (!invite) throw new ApiError('Invite not found', 404);
    if (invite.status !== 'PENDING') {
      throw new ApiError('Invite already used', 400);
    }
    if (invite.expiresAt < new Date()) {
      throw new ApiError('Invite has expired', 400);
    }

    // Check free plan member limit before accepting
    if (invite.workspace.plan === 'FREE' && invite.workspace._count.members >= 5) {
      throw new ApiError('This workspace has reached its member limit on the Free plan.', 403);
    }

    // Check user not already a member
    const alreadyMember = await prisma.member.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: invite.workspaceId,
        },
      },
    });

    if (alreadyMember) {
      throw new ApiError('You are already a member of this workspace', 409);
    }

    // Transaction: create member + update invite status
    await prisma.$transaction([
      prisma.member.create({
        data: {
          userId,
          workspaceId: invite.workspaceId,
          role: invite.role,
        },
      }),
      prisma.invite.update({
        where: { token },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    res.json({
      message: `Successfully joined ${invite.workspace.name}!`,
      workspace: {
        id: invite.workspace.id,
        name: invite.workspace.name,
        slug: invite.workspace.slug,
      },
    });
  }
);

// ─────────────────────────────────────────
// GET /invites?workspaceId=xxx
// List all invites for a workspace
// ─────────────────────────────────────────
export const getWorkspaceInvites = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const workspaceId = req.query.workspaceId as string;

    if (!workspaceId) throw new ApiError('workspaceId required', 400);

    // Verify member
    const member = await prisma.member.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });
    if (!member) throw new ApiError('Access denied', 403);

    const invites = await prisma.invite.findMany({
      where: { workspaceId, status: 'PENDING' },
      include: {
        invitedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ invites });
  }
);