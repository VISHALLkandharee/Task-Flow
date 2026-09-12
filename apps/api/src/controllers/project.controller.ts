import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import ApiError from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';
import { z } from 'zod';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Validation Schemas
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CreateProjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Helper â€” verify user is member of workspace
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function verifyMember(userId: string, workspaceId: string) {
  const member = await prisma.member.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId },
    },
  });
  if (!member) throw new ApiError('Access denied', 403);
  return member;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /projects?workspaceId=xxx
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getProjects = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { workspaceId } = req.query;

    if (!workspaceId) throw new ApiError('workspaceId is required', 400);

    // Verify user belongs to workspace
    await verifyMember(userId, workspaceId as string);

    const projects = await prisma.project.findMany({
      where: {
        workspaceId: workspaceId as string,
        deletedAt: null, // exclude soft deleted
      },
      include: {
        _count: {
          select: {
            tasks: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ projects });
  }
);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /projects/:id
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getProject = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: id as string, deletedAt: null },
      include: {
        workspace: true,
        _count: {
          select: { tasks: { where: { deletedAt: null } } },
        },
      },
    });

    if (!project) throw new ApiError('Project not found', 404);

    // Verify user belongs to this workspace
    await verifyMember(userId, project.workspaceId);

    res.json({ project });
  }
);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /projects
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const createProject = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { workspaceId } = req.body;

    if (!workspaceId) throw new ApiError('workspaceId is required', 400);

    // Validate input
    const result = CreateProjectSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(result.error.issues[0].message, 400);
    }

    // Verify user is member
    await verifyMember(userId, workspaceId);

    // Check free plan limit (max 3 projects)
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: {
          select: {
            projects: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (
      workspace?.plan === 'FREE' &&
      workspace._count.projects >= 3
    ) {
      throw new ApiError(
        'Free plan is limited to 3 projects. Upgrade to Pro.',
        403
      );
    }

    const project = await prisma.project.create({
      data: {
        name: result.data.name,
        description: result.data.description,
        color: result.data.color || '#6366f1',
        workspaceId,
      },
    });

    res.status(201).json({
      message: 'Project created successfully',
      project,
    });
  }
);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PATCH /projects/:id
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const updateProject = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id:id as string, deletedAt: null },
    });
    if (!project) throw new ApiError('Project not found', 404);

    // Verify member
    await verifyMember(userId, project.workspaceId);

    // Validate input
    const result = UpdateProjectSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(result.error.issues[0].message, 400);
    }

    const updated = await prisma.project.update({
      where: { id:id as string },
      data: result.data,
    });

    res.json({ message: 'Project updated', project: updated });
  }
);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DELETE /projects/:id (soft delete)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const deleteProject = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id : id as string, deletedAt: null },
    });
    if (!project) throw new ApiError('Project not found', 404);

    // Only OWNER or ADMIN can delete
    const member = await verifyMember(userId, project.workspaceId);
    if (!['OWNER', 'ADMIN'].includes(member.role)) {
      throw new ApiError('Only owners and admins can delete projects', 403);
    }

    // Soft delete â€” just set deletedAt
    await prisma.project.update({
      where: { id : id as string },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Project deleted successfully' });
  }
);
