import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { initSocket } from './lib/socket';
import ErrorHandlerMiddleware from './middlewares/Error_Handler';

const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────
// Create HTTP server from Express app
// We need this to attach Socket.io
// ─────────────────────────────────────────
const httpServer = http.createServer(app);

// ─────────────────────────────────────────
// Initialize Socket.io on the HTTP server
// Must happen before app.listen
// ─────────────────────────────────────────
initSocket(httpServer);

// Error handler
app.use(ErrorHandlerMiddleware);

// ─────────────────────────────────────────
// Start server — use httpServer not app.listen
// So Socket.io and Express share same port
// ─────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔌 Socket.io ready on port ${PORT}`);
  console.log(`🎯 Webhook: http://localhost:${PORT}/api/v1/billing/webhook`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM: shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
});