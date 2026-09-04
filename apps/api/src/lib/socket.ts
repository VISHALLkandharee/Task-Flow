import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from './jwt';
import { logger } from './logger';

// ─────────────────────────────────────────
// Store io instance globally
// So we can emit from anywhere in the app
// ─────────────────────────────────────────
let io: SocketServer;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // ─────────────────────────────────────────
  // Auth middleware — runs on every connection
  // Verifies JWT before allowing connection
  // ─────────────────────────────────────────
  io.use((socket: Socket, next) => {
    try {
      // Get token from cookie or handshake auth
      const token =
        socket.handshake.headers.cookie
          ?.split(';')
          .find((c) => c.trim().startsWith('access_token='))
          ?.split('=')[1] ||
        socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Unauthorized — no token'));
      }

      const payload = verifyAccessToken(token);
      if (!payload) {
        return next(new Error('Unauthorized — invalid token'));
      }

      // Attach userId to socket for later use
      socket.data.userId = (payload as any).userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  // ─────────────────────────────────────────
  // Connection handler
  // ─────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    logger.info({ socketId: socket.id, userId }, 'Socket connected');

    // Join personal room — user:clx123
    socket.join(`user:${userId}`);
    logger.debug({ socketId: socket.id, userId }, 'User joined socket room');

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'Socket disconnected');
    });

    // Handle client marking notifications as read
    socket.on('notifications:read', async () => {
      const { prisma } = await import('./prisma');
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      // Confirm back to client
      socket.emit('notifications:cleared');
    });
  });

  logger.info('Socket.io server initialized');
  return io;
};

// ─────────────────────────────────────────
// Get io instance from anywhere in the app
// ─────────────────────────────────────────
export const getIO = (): SocketServer => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};

// ─────────────────────────────────────────
// Helper — emit notification to specific user
// Use this everywhere you need to notify someone
// ─────────────────────────────────────────
export const emitToUser = (
  userId: string,
  event: string,
  data: any
) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
  logger.debug({ event, userId }, 'Emitted socket event to user');
};