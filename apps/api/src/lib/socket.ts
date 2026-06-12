import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from './jwt';

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

    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  // ─────────────────────────────────────────
  // Connection handler
  // ─────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`🔌 Socket connected: ${socket.id} (user: ${userId})`);

    // Join personal room — user:clx123
    // All notifications for this user go here
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} joined room user:${userId}`);

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
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

  console.log('🚀 Socket.io server initialized');
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
  console.log(`📡 Emitted '${event}' to user:${userId}`);
};