import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

// Mock dependencies for isolated unit/integration tests
jest.mock('../lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

jest.mock('../lib/redis', () => ({
  redis: {
    ping: jest.fn(),
    status: 'ready',
    on: jest.fn(),
  },
}));

describe('Health Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /health returns 200 and healthy payload when DB and Redis are up', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
    (redis.ping as jest.Mock).mockResolvedValue('PONG');

    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'healthy',
      services: {
        database: 'connected',
        redis: 'connected',
      },
    });
    expect(res.body.timestamp).toBeDefined();
    expect(typeof res.body.uptime).toBe('number');
  });

  it('GET /api/v1/health also returns 200', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
    (redis.ping as jest.Mock).mockResolvedValue('PONG');

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('GET /health returns 503 degraded status when database query fails', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB connection refused'));
    (redis.ping as jest.Mock).mockResolvedValue('PONG');

    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.services.database).toBe('error');
  });
});
