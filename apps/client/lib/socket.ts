import { io, Socket } from 'socket.io-client';
import api from './axios';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
        'http://localhost:5000',
      {
        withCredentials: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,      // ← increased
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,    // ← max 5 seconds between retries
        timeout: 20000,                // ← 20 second timeout
      }
    );

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      // Auto reconnect on all disconnect reasons
      if (reason === 'io server disconnect') {
        socket?.connect();
      }
    });

    socket.on('connect_error', async (err) => {
      console.error('❌ Socket error:', err.message);
      
      // If the backend rejected us because the token is expired/missing:
      if (err.message.includes('Unauthorized')) {
        try {
          // Attempt to refresh the cookie via our axios instance
          await api.post('/auth/refresh');
          
          // If successful, tell socket to try connecting again
          // (It will now automatically include the new cookie)
          socket?.connect();
        } catch {
          console.error('Socket token refresh failed, logging out...');
          // Axios interceptor will have handled the redirect to /login
        }
      }
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};