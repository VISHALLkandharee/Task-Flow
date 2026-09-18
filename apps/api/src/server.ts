import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import { initSocket } from './lib/socket';
import { logger } from './lib/logger';

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

// ─────────────────────────────────────────
// Start server — use httpServer not app.listen
// So Socket.io and Express share same port
// ─────────────────────────────────────────
httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, `Server running on port ${PORT}`);
  logger.info({ port: PORT }, `Socket.io ready on port ${PORT}`);
  logger.info({ webhookUrl: `http://localhost:${PORT}/api/v1/billing/webhook` }, 'Stripe webhook listening endpoint ready');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received: shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed cleanly');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
});