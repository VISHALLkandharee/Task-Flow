import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';
import ApiError from '../lib/ApiError';

// Config: Default to 100 requests per 60 seconds (1 minute) per IP
const WINDOW_SIZE_IN_SECONDS = 60;
const MAX_LIMIT = 100;

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Identify the IP address safely, resolving headers if behind a proxy/load balancer
    let ip = 'unknown';
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (typeof xForwardedFor === 'string') {
      ip = xForwardedFor.split(',')[0].trim();
    } else if (Array.isArray(xForwardedFor)) {
      ip = xForwardedFor[0] || 'unknown';
    } else if (req.ip) {
      ip = req.ip;
    } else if (req.socket.remoteAddress) {
      ip = req.socket.remoteAddress;
    }

    const key = `rate-limit:${ip}`;
    const now = Date.now();
    const clearBefore = now - WINDOW_SIZE_IN_SECONDS * 1000;

    // 2. Perform atomic Redis commands using multi
    const multi = redis.multi();
    // Clear elements outside our sliding window
    multi.zremrangebyscore(key, 0, clearBefore);
    // Count active items in the set
    multi.zcard(key);
    // Add current request timestamp to set (value must be unique, so we append random component)
    multi.zadd(key, now, `${now}-${Math.random()}`);
    // Refresh TTL on the key so it cleans itself up if idle
    multi.expire(key, WINDOW_SIZE_IN_SECONDS);

    const results = await multi.exec();
    
    // In case execution fails, fail-open to not block users
    if (!results) {
      return next();
    }

    // Results is an array of [error, result] pairs.
    // results[1] is the output of the second command (zcard).
    const zcardResult = results[1];
    const requestCount = zcardResult && typeof zcardResult[1] === 'number' ? zcardResult[1] : 0;

    // 3. Set headers for transparency and client consumption
    res.setHeader('X-RateLimit-Limit', MAX_LIMIT);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_LIMIT - requestCount));

    // 4. Block if over limit
    if (requestCount >= MAX_LIMIT) {
      res.setHeader('Retry-After', WINDOW_SIZE_IN_SECONDS);
      return next(new ApiError('Too many requests. Please try again later.', 429));
    }

    next();
  } catch (err) {
    console.error('⚠️ Rate limiter error:', err);
    // Fail-open strategy: continue processing in case Redis has issues
    next();
  }
};
