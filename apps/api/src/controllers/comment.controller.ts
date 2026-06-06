import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import ApiError from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';
import { notify } from '../lib/notify';
import { z } from 'zod';

const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(500),
  taskId: z.string().min(1),
});

// ─────────────────────────────────────────
// GET /comments?taskId=xxx
// ─────────────────────────────────────────
export const getComments = asyncHandler(
  async (req: Request, res: Response) => {
    const taskId = req.query.taskId as string;
    if (!taskId) throw new ApiError('taskId is required', 400);

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ comments });
  }
);

// ─────────────────────────────────────────
// POST /comments
// ─────────────────────────────────────────
export const createComment = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const result = CreateCommentSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(result.error.issues[0].message, 400);
    }

    const { content, taskId } = result.data;

    // Get task with assignee and creator
    const task = await prisma.task.findUnique({
      where: { id: taskId, deletedAt: null },
      include: {
        project: {
          include: { workspace: true },
        },
      },
    });

    if (!task) throw new ApiError('Task not found', 404);

    // Verify user is member of workspace
    const member = await prisma.member.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: task.project.workspaceId,
        },
      },
    });
    if (!member) throw new ApiError('Access denied', 403);

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Notify task assignee if different from commenter
    if (task.assigneeId && task.assigneeId !== userId) {
      const author = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      await notify({
        userId: task.assigneeId,
        message: `${author?.name} commented on "${task.title}"`,
        link: `/projects/${task.projectId}`,
      });
    }

    // Notify task creator if different from commenter and assignee
    if (
      task.creatorId !== userId &&
      task.creatorId !== task.assigneeId
    ) {
      const author = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      await notify({
        userId: task.creatorId,
        message: `${author?.name} commented on "${task.title}"`,
        link: `/projects/${task.projectId}`,
      });
    }

    res.status(201).json({ comment });
  }
);

// ─────────────────────────────────────────
// DELETE /comments/:id
// ─────────────────────────────────────────
export const deleteComment = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const id = req.params.id as string;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) throw new ApiError('Comment not found', 404);

    // Only author can delete their comment
    if (comment.authorId !== userId) {
      throw new ApiError('You can only delete your own comments', 403);
    }

    await prisma.comment.delete({ where: { id } });

    res.json({ message: 'Comment deleted' });
  }
);