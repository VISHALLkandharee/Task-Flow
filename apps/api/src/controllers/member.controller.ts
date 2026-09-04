import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import  ApiError  from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';


// ─────────────────────────────────────────
// GET /members?workspaceId=xxx
// ─────────────────────────────────────────
export const getMembers = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const workspaceId = req.query.workspaceId as string;

    if (!workspaceId) throw new ApiError('workspaceId required', 400);

    // Verify requester is a member
    const requester = await prisma.member.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!requester) throw new ApiError('Access denied', 403);

    const members = await prisma.member.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    res.json({ members });
  }
);

// ─────────────────────────────────────────
// PATCH /members/:id — update role
// ─────────────────────────────────────────
export const updateMemberRole = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const memberId = req.params.id as string;

    const { role } = req.body;
    if (!['ADMIN', 'MEMBER'].includes(role)) {
      throw new ApiError('Invalid role', 400);
    }

    const targetMember = await prisma.member.findUnique({
      where: { id: memberId },
    });
    if (!targetMember) throw new ApiError('Member not found', 404);

    // Verify requester is OWNER
    const requester = await prisma.member.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: targetMember.workspaceId,
        },
      },
    });

    if (requester?.role !== 'OWNER') {
      throw new ApiError('Only owners can change roles', 403);
    }

    // Can't change OWNER's role
    if (targetMember.role === 'OWNER') {
      throw new ApiError("Cannot change owner's role", 403);
    }

    const updated = await prisma.member.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({ message: 'Role updated', member: updated });
  }
);

// ─────────────────────────────────────────
// DELETE /members/:id — remove member
// ─────────────────────────────────────────
export const removeMember = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const memberId = req.params.id as string;

    const targetMember = await prisma.member.findUnique({
      where: { id: memberId },
    });
    if (!targetMember) throw new ApiError('Member not found', 404);

    // Verify requester is OWNER
    const requester = await prisma.member.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: targetMember.workspaceId,
        },
      },
    });

    if (requester?.role !== 'OWNER') {
      throw new ApiError('Only owners can remove members', 403);
    }

    // Can't remove OWNER
    if (targetMember.role === 'OWNER') {
      throw new ApiError('Cannot remove the workspace owner', 403);
    }

    await prisma.member.delete({ where: { id: memberId } });

    res.json({ message: 'Member removed successfully' });
  }
);