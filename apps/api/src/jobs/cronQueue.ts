import { Queue } from 'bullmq';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';

// ─────────────────────────────────────────
// Create the Cron Queue
// ─────────────────────────────────────────
export const cronQueue = new Queue('cron', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// ─────────────────────────────────────────
// Register Repeatable Jobs
// ─────────────────────────────────────────
const registerRepeatableJobs = async () => {
  try {
    // BullMQ handles repeatable jobs by hashing the pattern, so this call is idempotent.
    // Daily at 8:00 AM UTC
    await cronQueue.add(
      'check-due-dates',
      {},
      {
        repeat: {
          pattern: '0 8 * * *',
        },
      }
    );
    logger.info('BullMQ repeatable job "check-due-dates" registered (Daily at 8:00 AM UTC)');
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to register repeatable job "check-due-dates"');
  }
};

registerRepeatableJobs();
