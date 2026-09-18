import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { generateRefreshToken } from '../../lib/jwt';

process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-12345';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    workspace: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../jobs/emailQueue', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendInviteEmail: jest.fn().mockResolvedValue(undefined),
  sendTaskAssignedEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('Auth Controller Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('returns 409 if user email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user_1', email: 'existing@example.com' });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'existing@example.com',
          password: 'Password123',
          workspaceName: 'Acme Corp',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already in use/i);
    });

    it('creates user and workspace and sets cookies on successful registration', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.workspace.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockResolvedValue({
        user: {
          id: 'new_user_1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          avatarUrl: null,
        },
        workspace: {
          id: 'ws_1',
          name: 'Acme Corp',
          slug: 'acme-corp',
          plan: 'FREE',
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123',
          workspaceName: 'Acme Corp',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('jane@example.com');
      expect(res.body.workspace.name).toBe('Acme Corp');
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns 404 on non-existent email', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'Password123',
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/incorrect email or password/i);
    });

    it('returns 401 on incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123', 10);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user_login_1',
        email: 'dev@example.com',
        name: 'Dev User',
        password: hashedPassword,
        members: [],
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'dev@example.com',
          password: 'WrongPassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/incorrect email or password/i);
    });

    it('returns user details and sets auth cookies on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123', 10);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user_login_1',
        email: 'dev@example.com',
        name: 'Dev User',
        password: hashedPassword,
        members: [
          {
            role: 'OWNER',
            workspace: {
              id: 'ws_dev',
              name: 'Dev Team',
              slug: 'dev-team',
              plan: 'PRO',
            },
          },
        ],
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'dev@example.com',
          password: 'CorrectPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('dev@example.com');
      expect(res.body.workspaces[0].name).toBe('Dev Team');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('returns 401 if refresh token is missing', async () => {
      const res = await request(app).post('/api/v1/auth/refresh');
      expect(res.status).toBe(401);
    });

    it('issues new access token if valid refresh token cookie is present', async () => {
      const refreshToken = generateRefreshToken({ userId: 'u_1', email: 'u1@example.com' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u_1',
        email: 'u1@example.com',
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refresh_token=${refreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/tokens refreshed/i);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('clears auth cookies on logout', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/logged out/i);
    });
  });
});
