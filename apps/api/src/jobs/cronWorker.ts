import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { notify } from '../lib/notify';
import { sendTaskDueReminderEmail } from './emailQueue';

// ─────────────────────────────────────────
// The Cron Worker — processes repeatable cron jobs
// ─────────────────────────────────────────
export const cronWorker = new Worker(
  'cron', // queue name
  async (job: Job) => {
    console.log(`⚙️  Processing cron job: ${job.name}`);

    if (job.name === 'check-due-dates') {
      const now = new Date();
      
      // Calculate "tomorrow" start and end in UTC
      const tomorrowStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
      );
      const tomorrowEnd = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 23, 59, 59, 999)
      );

      console.log(`🔍 Checking for tasks due between ${tomorrowStart.toISOString()} and ${tomorrowEnd.toISOString()}`);

      // Format a nice human-readable date in UTC (e.g. "June 5, 2026")
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const formattedDueDate = `${monthNames[tomorrowStart.getUTCMonth()]} ${tomorrowStart.getUTCDate()}, ${tomorrowStart.getUTCFullYear()}`;

      // Query tasks
      const tasks = await prisma.task.findMany({
        where: {
          deletedAt: null,
          status: {
            not: 'DONE',
          },
          dueDate: {
            gte: tomorrowStart,
            lte: tomorrowEnd,
          },
          assigneeId: {
            not: null,
          },
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              workspace: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      console.log(`📌 Found ${tasks.length} tasks due tomorrow.`);

      const promises = tasks.map(async (task) => {
        if (!task.assigneeId || !task.assignee || !task.assignee.email) {
          return;
        }

        try {
          // 1. Bell / WebSocket notification
          await notify({
            userId: task.assigneeId,
            message: `Reminder: Task "${task.title}" is due tomorrow!`,
            link: `/projects/${task.projectId}`,
          });

          // 2. Email notification (delegated to emailQueue/emailWorker)
          await sendTaskDueReminderEmail({
            to: task.assignee.email,
            assigneeName: task.assignee.name,
            taskTitle: task.title,
            projectName: task.project.name,
            workspaceName: task.project.workspace.name,
            taskUrl: `/projects/${task.projectId}`,
            dueDate: formattedDueDate,
          });
        } catch (err) {
          console.error(`❌ Failed to send reminder for task ${task.id}:`, err);
        }
      });

      await Promise.allSettled(promises);
      console.log(`✅ Finished processing reminders for all due tasks.`);
    }
  },
  {
    connection: redis,
    concurrency: 1, // scheduled task, run one at a time
  }
);

// Worker event listeners for logging
cronWorker.on('completed', (job) => {
  console.log(`✅ Cron Job ${job.id} (${job.name}) completed successfully`);
});

cronWorker.on('failed', (job, err) => {
  console.error(`❌ Cron Job ${job?.id} (${job?.name}) failed:`, err.message);
});
