import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import ApiError from '../lib/ApiError';
import { asyncHandler } from '../lib/asyncHandler';
import { z } from 'zod';

const CreateWorkspaceSchema = z.object({
  name: z.string().min(2).max(50),
});

export const createWorkspace = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const result = CreateWorkspaceSchema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(result.error.issues[0].message, 400);
    }

    const { name } = result.data;

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const existingSlug = await prisma.workspace.findUnique({
      where: { slug },
    });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    // Create workspace + make user the owner
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug: finalSlug,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
    });

    res.status(201).json({
      message: 'Workspace created successfully',
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.plan,
      },
    });
  }
);