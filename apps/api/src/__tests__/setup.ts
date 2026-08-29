// Global test setup to prevent real socket / queue network calls during unit & integration tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-12345';
process.env.STRIPE_SECRET_KEY = 'sk_test_12345';
process.env.STRIPE_PRICE_ID = 'price_test_12345';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_12345';
process.env.CLIENT_URL = 'http://localhost:3000';

// Mock BullMQ Queue so test runs don't attempt external network connections to Redis
jest.mock('bullmq', () => {
  return {
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    })),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    })),
    QueueEvents: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    })),
  };
});
