import Redis from 'ioredis';

const getRedisConfig = () => {
  // Production — Upstash uses full URL
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // Local — Docker Redis
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
  });
};

export const redis = getRedisConfig();

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});