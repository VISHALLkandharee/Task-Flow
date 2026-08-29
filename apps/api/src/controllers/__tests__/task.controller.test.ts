import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { generateAccessToken } from '../../lib/jwt';
import { sendTaskAssignedEmail } from '../../jobs/emailQueue';

process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-12345';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
    },
    member: {
      findUnique: jest.fn(),
    },
    task: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../lib/socket', () => ({
  emitToUser: jest.fn(),
  initSocket: jest.fn(),
}));

jest.mock('../../jobs/emailQueue', () => ({
  sendTaskAssignedEmail: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendInviteEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('Task Controller Endpoints', () => {
  const testUserId = 'user_123';
  const validToken = generateAccessToken({ userId: testUserId, email: 'user@example.com' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/tasks', () => {
    it('returns 401 if unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .send({ title: 'New Task', projectId: 'proj_1' });

      expect(res.status).toBe(401);
    });

    it('returns 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ projectId: 'proj_1' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('returns 404 if project does not exist', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Task 1', projectId: 'non_existent_proj' });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/project not found/i);
    });

    it('returns 403 if user is not a member of the workspace (access denied)', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'proj_1',
        workspaceId: 'ws_1',
        name: 'Sprint 1',
        workspace: { name: 'Main Org' },
      });
      (prisma.member.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Task 1', projectId: 'proj_1' });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/access denied/i);
    });

    it('returns 201 and creates task successfully with assignment notifications', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'proj_1',
        workspaceId: 'ws_1',
        name: 'Sprint 1',
        workspace: { name: 'Main Org' },
      });
      (prisma.member.findUnique as jest.Mock).mockResolvedValue({
        id: 'mem_1',
        userId: testUserId,
        workspaceId: 'ws_1',
        role: 'MEMBER',
      });
      (prisma.task.findFirst as jest.Mock).mockResolvedValue({ position: 1000 });
      (prisma.task.create as jest.Mock).mockResolvedValue({
        id: 'task_99',
        title: 'Build API Tests',
        description: 'Comprehensive test suite',
        status: 'TODO',
        priority: 'HIGH',
        position: 2000,
        projectId: 'proj_1',
        creatorId: testUserId,
        assigneeId: 'assignee_456',
        assignee: {
          id: 'assignee_456',
          name: 'Jane Dev',
          email: 'jane@example.com',
          avatarUrl: null,
        },
        creator: { id: testUserId, name: 'Lead Dev' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ name: 'Lead Dev' });
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif_1' });

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Build API Tests',
          description: 'Comprehensive test suite',
          status: 'TODO',
          priority: 'HIGH',
          projectId: 'proj_1',
          assigneeId: 'assignee_456',
        });

      expect(res.status).toBe(201);
      expect(res.body.task.id).toBe('task_99');
      expect(prisma.task.create).toHaveBeenCalled();
      expect(sendTaskAssignedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'jane@example.com',
          taskTitle: 'Build API Tests',
        })
      );
    });
  });

  describe('GET /api/v1/tasks', () => {
    it('returns 400 if projectId query parameter is missing', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/projectId is required/i);
    });

    it('returns 200 with list of tasks for a project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'proj_1',
        workspaceId: 'ws_1',
      });
      (prisma.member.findUnique as jest.Mock).mockResolvedValue({
        id: 'mem_1',
        userId: testUserId,
        workspaceId: 'ws_1',
      });
      (prisma.task.findMany as jest.Mock).mockResolvedValue([
        { id: 'task_1', title: 'Task 1', position: 1000 },
        { id: 'task_2', title: 'Task 2', position: 2000 },
      ]);

      const res = await request(app)
        .get('/api/v1/tasks?projectId=proj_1')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tasks).toHaveLength(2);
    });
  });

  describe('PATCH /api/v1/tasks/:id', () => {
    it('returns 404 if task is not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/v1/tasks/unknown_task')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(404);
    });

    it('returns 200 and updates task', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: 'task_1',
        projectId: 'proj_1',
        assigneeId: null,
      });
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'proj_1',
        workspaceId: 'ws_1',
      });
      (prisma.member.findUnique as jest.Mock).mockResolvedValue({
        id: 'mem_1',
        userId: testUserId,
        workspaceId: 'ws_1',
      });
      (prisma.task.update as jest.Mock).mockResolvedValue({
        id: 'task_1',
        title: 'Updated Title',
        status: 'IN_PROGRESS',
      });

      const res = await request(app)
        .patch('/api/v1/tasks/task_1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Updated Title', status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(res.body.task.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('returns 200 and performs soft delete', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        id: 'task_1',
        projectId: 'proj_1',
      });
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'proj_1',
        workspaceId: 'ws_1',
      });
      (prisma.member.findUnique as jest.Mock).mockResolvedValue({
        id: 'mem_1',
        userId: testUserId,
        workspaceId: 'ws_1',
      });
      (prisma.task.update as jest.Mock).mockResolvedValue({
        id: 'task_1',
        deletedAt: new Date(),
      });

      const res = await request(app)
        .delete('/api/v1/tasks/task_1')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task_1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      );
    });
  });
});
