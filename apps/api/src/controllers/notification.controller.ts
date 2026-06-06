import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import ApiError from '../lib/ApiError';

// ─────────────────────────────────────────
// GET /notifications
// Get all notifications for current user
// ─────────────────────────────────────────
export const getNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20, // last 20 notifications
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    res.json({ notifications, unreadCount });
  }
);

// ─────────────────────────────────────────
// PATCH /notifications/read-all
// Mark all notifications as read
// ─────────────────────────────────────────
export const markAllRead = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.json({ message: 'All notifications marked as read' });
  }
);

// ─────────────────────────────────────────
// PATCH /notifications/:id/read
// Mark single notification as read
// ─────────────────────────────────────────
export const markOneRead = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const id = req.params.id as string;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) throw new ApiError('Notification not found', 404);
    if (notification.userId !== userId) throw new ApiError('Access denied', 403);

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.json({ message: 'Notification marked as read' });
  }
);

// ─────────────────────────────────────────
// DELETE /notifications
// Clear all notifications
// ─────────────────────────────────────────
export const clearAll = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    await prisma.notification.deleteMany({
      where: { userId },
    });

    res.json({ message: 'All notifications cleared' });
  }
);