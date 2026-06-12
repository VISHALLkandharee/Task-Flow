import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';
import ApiError from '../lib/ApiError';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 100;

const resolveIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0] || req.ip || 'unknown';
  return req.ip || req.socket.remoteAddress || 'unknown';
};

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip = resolveIp(req);
    const key = `rl:${ip}`;
    const now = Date.now();
    const windowStart = now - WINDOW_SECONDS * 1000;

    const pipeline = redis.multi();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.expire(key, WINDOW_SECONDS);

    const results = await pipeline.exec();
    if (!results) return next();

    const count = typeof results[1]?.[1] === 'number' ? results[1][1] : 0;

    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - count));

    if (count >= MAX_REQUESTS) {
      res.setHeader('Retry-After', WINDOW_SECONDS);
      return next(new ApiError('Too many requests. Please try again later.', 429));
    }

    next();
  } catch {
    next();
  }
};
