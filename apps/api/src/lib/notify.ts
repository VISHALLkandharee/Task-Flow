import { prisma } from './prisma';
import { emitToUser } from './socket';

interface CreateNotificationInput {
  userId: string;
  message: string;
  link?: string;
}

// ─────────────────────────────────────────
// Creates notification in DB + emits via socket
// Call this anywhere you need to notify a user
// ─────────────────────────────────────────
export const notify = async ({
  userId,
  message,
  link,
}: CreateNotificationInput) => {
  try {
    // 1. Save to database
    const notification = await prisma.notification.create({
      data: {
        userId,
        message,
        link,
        read: false,
      },
    });

    // 2. Emit to user's socket room instantly
    emitToUser(userId, 'notification:new', {
      id: notification.id,
      message: notification.message,
      link: notification.link,
      read: notification.read,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (err) {
    console.error('❌ Failed to create notification:', err);
  }
};