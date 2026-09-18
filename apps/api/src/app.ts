import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { handleWebhook } from './controllers/billing.controller';

import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import projectRoutes from './routes/project.route';
import taskRoutes from './routes/task.route';
import inviteRoutes from './routes/invite.routes';
import memberRoutes from './routes/member.routes';
import billingRoutes from './routes/billing.routes';
import notificationRoutes from './routes/notification.routes';
import settingsRoutes from './routes/setting.routes';
import commentRoutes from './routes/comment.routes';
import healthRoutes from './routes/health.routes';
import { rateLimiter } from './middlewares/Rate_Limiter';
import ErrorHandlerMiddleware from './middlewares/Error_Handler';

// Initialize background jobs only in non-test environments
if (process.env.NODE_ENV !== 'test') {
  require('./jobs/emailWorker');
  require('./jobs/cronQueue');
  require('./jobs/cronWorker');
}

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// ⚠️ WEBHOOK — must be app.post() not app.use()
// raw body middleware + handler together
app.post(
  '/api/v1/billing/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

// Body parsers for everything else
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Apply rate limiting to all requests (except in tests / Webhook)
if (process.env.NODE_ENV !== 'test') {
  app.use(rateLimiter);
}

// Health check endpoints
app.use('/health', healthRoutes);
app.use('/api/v1/health', healthRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'TaskFlow API is running!', docs: '/api/v1' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/invites', inviteRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/comments', commentRoutes);

// Centralized error handler
app.use(ErrorHandlerMiddleware);

export default app;