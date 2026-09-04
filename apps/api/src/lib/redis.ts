import Redis from 'ioredis';
import { logger } from './logger';

const getRedisConfig = () => {
  // Production — Upstash uses full URL
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      tls: {
        rejectUnauthorized: false,
      },
      lazyConnect: process.env.NODE_ENV === 'test',
    });
  }

  // Local — Docker Redis
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
    lazyConnect: process.env.NODE_ENV === 'test',
  });
};

export const redis = getRedisConfig();

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (err) => {
  logger.error({ err: err.message }, 'Redis error occurred');
});