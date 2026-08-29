import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';
  let isHealthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err: any) {
    logger.error({ err: err?.message || err }, 'Health check database query failed');
    dbStatus = 'error';
    isHealthy = false;
  }

  try {
    if (redis && typeof redis.ping === 'function') {
      const pong = await redis.ping();
      redisStatus = pong === 'PONG' ? 'connected' : redis.status || 'unknown';
    }
  } catch (err: any) {
    logger.error({ err: err?.message || err }, 'Health check redis ping failed');
    redisStatus = 'error';
    // Redis optional degradation if needed, but report state
  }

  const payload = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
    version: process.env.npm_package_version || '1.0.0',
  };

  res.status(isHealthy ? 200 : 503).json(payload);
});

export default router;
