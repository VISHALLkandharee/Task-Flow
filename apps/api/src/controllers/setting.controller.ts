import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import ApiError from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { stripe } from '../lib/stripe';

// ─────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────
const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address').toLowerCase(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }
);

const UpdateWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  workspaceId: z.string().min(1),
});

const DeleteWorkspaceSchema = z.object({
  workspaceId: z.string().min(1),
  confirmName: z.string().min(1),
});

// ─────────────────────────────────────────
// PATCH /settings/profile
// Update name and email
// ─────────────────────────────────────────
export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const result = UpdateProfileSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(result.error.issues[0].message, 400);
    }

    const { name, email } = result.data;

    // Check email not taken by another user
    if (email) {
      const existing = await prisma.user.findUnique({
        where: { email },
      });
      if (existing && existing.id !== userId) {
        throw new ApiError('Email already in use', 409);
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  }
);

// ─────────────────────────────────────────
// PATCH /settings/password
// Change password
// ─────────────────────────────────────────
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const result = ChangePasswordSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(result.error.issues[0].message, 400);
    }

    const { currentPassword, newPassword } = result.data;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new ApiError('User not found', 404);

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new ApiError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    res.json({ message: 'Password changed successfully' });
  }
);

// ─────────────────────────────────────────
// PATCH /settings/workspace
// Update workspace name
// ─────────────────────────────────────────
export const updateWorkspace = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const result = UpdateWorkspaceSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(result.error.issues[0].message, 400);
    }

    const { name, workspaceId } = result.data;

    // Verify user is OWNER
    const member = await prisma.member.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });

    if (!member) throw new ApiError('Access denied', 403);
    if (member.role !== 'OWNER') {
      throw new ApiError('Only owners can update workspace settings', 403);
    }

    // Generate new slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { name, slug },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
      },
    });

    res.json({
      message: 'Workspace updated successfully',
      workspace,
    });
  }
);

// ─────────────────────────────────────────
// DELETE /settings/workspace
// Delete workspace — owner only
// ─────────────────────────────────────────
export const deleteWorkspace = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const result = DeleteWorkspaceSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(result.error.issues[0].message, 400);
    }

    const { workspaceId, confirmName } = result.data;

    // Verify user is OWNER
    const member = await prisma.member.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
      include: { workspace: true },
    });

    if (!member) throw new ApiError('Access denied', 403);
    if (member.role !== 'OWNER') {
      throw new ApiError('Only owners can delete workspaces', 403);
    }

    // Verify confirmation name matches
    if (confirmName !== member.workspace.name) {
      throw new ApiError('Workspace name does not match', 400);
    }

    // 1. Cancel Stripe subscription if it exists to stop billing immediately
    if (member.workspace.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(member.workspace.stripeSubscriptionId);
        if (sub.status !== 'canceled') {
          await stripe.subscriptions.cancel(member.workspace.stripeSubscriptionId);
        }
      } catch (err: any) {
        // Only ignore 404s (subscription already gone). For any other error, block deletion
        // so we don't orphan an active subscription!
        if (err.statusCode !== 404) {
          console.error('[Stripe] Failed to cancel sub:', err.message);
          throw new ApiError(
            'Failed to cancel billing subscription. Please try again later or contact support.',
            500
          );
        }
      }
    }

    // 2. Delete workspace from database — cascades to projects, tasks, members
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    res.json({ message: 'Workspace deleted successfully' });
  }
);