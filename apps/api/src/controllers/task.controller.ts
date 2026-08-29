import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import ApiError from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';
import { notify } from '../lib/notify';
import { sendTaskAssignedEmail } from '../jobs/emailQueue';
import { logger } from '../lib/logger';
import { z } from 'zod';

// ─────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────
const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  projectId: z.string().min(1, 'projectId is required'),
});

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  position: z.number().optional(),
});

// ─────────────────────────────────────────
// Helper — verify user can access project
// ─────────────────────────────────────────
export async function verifyProjectAccess(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
    include: { workspace: true },
  });

  if (!project) throw new ApiError('Project not found', 404);

  const member = await prisma.member.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: project.workspaceId,
      },
    },
  });

  if (!member) throw new ApiError('Access denied', 403);

  return { project, member };
}

// ─────────────────────────────────────────
// GET /tasks?projectId=xxx
// ─────────────────────────────────────────
export const getTasks = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || (req as any).userId;
    const projectId = req.query.projectId as string;

    if (!projectId) throw new ApiError('projectId is required', 400);

    // Verify access
    await verifyProjectAccess(userId, projectId);

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    res.json({ tasks });
  }
);

// ─────────────────────────────────────────
// POST /tasks
// ─────────────────────────────────────────
export const createTask = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || (req as any).userId;

    // Validate
    const result = CreateTaskSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(result.error.issues[0].message, 400);
    }

    const {
      projectId,
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeId,
    } = result.data;

    // Verify access
    const { project } = await verifyProjectAccess(userId, projectId);

    // Get highest position in the column
    const lastTask = await prisma.task.findFirst({
      where: {
        projectId,
        status: status || 'TODO',
        deletedAt: null,
      },
      orderBy: { position: 'desc' },
    });

    const position = lastTask ? lastTask.position + 1000 : 1000;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        position,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        projectId,
        creatorId: userId,
        assigneeId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    logger.info({ taskId: task.id, projectId, title }, 'Task created successfully');

    if (task.assigneeId && task.assigneeId !== userId) {
      const creator = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      await notify({
        userId: task.assigneeId,
        message: `${creator?.name || 'Someone'} assigned you "${task.title}"`,
        link: `/projects/${task.projectId}`,
      });

      if (task.assignee?.email && task.assignee?.name) {
        await sendTaskAssignedEmail({
          to: task.assignee.email,
          assigneeName: task.assignee.name,
          assignerName: creator?.name || 'Someone',
          taskTitle: task.title,
          projectName: project.name,
          workspaceName: project.workspace.name,
          taskUrl: `/projects/${task.projectId}`,
        });
      }
    }

    res.status(201).json({
      message: 'Task created successfully',
      task,
    });
  }
);

// ─────────────────────────────────────────
// PATCH /tasks/:id
// ─────────────────────────────────────────
export const updateTask = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || (req as any).userId;
    const id = req.params.id as string;

    const task = await prisma.task.findUnique({
      where: { id, deletedAt: null },
    });
    if (!task) throw new ApiError('Task not found', 404);

    // Verify access
    const { project } = await verifyProjectAccess(userId, task.projectId);

    // Validate
    const result = UpdateTaskSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(result.error.issues[0].message, 400);
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...result.data,
        dueDate: result.data.dueDate
          ? new Date(result.data.dueDate)
          : undefined,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    logger.info({ taskId: id, updates: Object.keys(result.data) }, 'Task updated successfully');

    if (
      result.data.assigneeId &&
      result.data.assigneeId !== task.assigneeId &&
      result.data.assigneeId !== userId
    ) {
      const updater = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      await notify({
        userId: result.data.assigneeId,
        message: `${updater?.name || 'Someone'} assigned you "${updated.title}"`,
        link: `/projects/${updated.projectId}`,
      });

      if (updated.assignee?.email && updated.assignee?.name) {
        await sendTaskAssignedEmail({
          to: updated.assignee.email,
          assigneeName: updated.assignee.name,
          assignerName: updater?.name || 'Someone',
          taskTitle: updated.title,
          projectName: project.name,
          workspaceName: project.workspace.name,
          taskUrl: `/projects/${updated.projectId}`,
        });
      }
    }

    res.json({ message: 'Task updated', task: updated });
  }
);

// ─────────────────────────────────────────
// PATCH /tasks/:id/move
// Move task to new column + reorder
// ─────────────────────────────────────────
export const moveTask = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || (req as any).userId;
    const id = req.params.id as string;

    const { status, position } = req.body;

    if (!status) throw new ApiError('status is required', 400);

    const task = await prisma.task.findUnique({
      where: { id, deletedAt: null },
    });
    if (!task) throw new ApiError('Task not found', 404);

    await verifyProjectAccess(userId, task.projectId);

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status,
        position: position ?? task.position,
      },
    });

    logger.info({ taskId: id, status, position }, 'Task moved');
    res.json({ message: 'Task moved', task: updated });
  }
);

// ─────────────────────────────────────────
// DELETE /tasks/:id (soft delete)
// ─────────────────────────────────────────
export const deleteTask = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || (req as any).userId;
    const id = req.params.id as string;

    const task = await prisma.task.findUnique({
      where: { id, deletedAt: null },
    });
    if (!task) throw new ApiError('Task not found', 404);

    await verifyProjectAccess(userId, task.projectId);

    // Soft delete
    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    logger.info({ taskId: id }, 'Task deleted (soft-delete)');
    res.json({ message: 'Task deleted successfully' });
  }
);

// ─────────────────────────────────────────
// GET /tasks/my-tasks
// Get all tasks assigned to current user
// across all projects and workspaces
// ─────────────────────────────────────────
export const getMyTasks = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId || (req as any).userId;
    const workspaceId = req.query.workspaceId as string | undefined;

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        deletedAt: null,
        ...(workspaceId ? { project: { workspaceId } } : {}),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            workspace: {
              select: { name: true },
            },
          },
        },
        creator: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Group by status on server side
    const grouped = {
      TODO: tasks.filter((t) => t.status === 'TODO'),
      IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
      IN_REVIEW: tasks.filter((t) => t.status === 'IN_REVIEW'),
      DONE: tasks.filter((t) => t.status === 'DONE'),
    };

    res.json({ tasks, grouped });
  }
);