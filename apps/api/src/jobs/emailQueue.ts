import { Queue, Worker, QueueEvents } from 'bullmq';
import { redis } from '../lib/redis';
import { Resend } from 'resend';

// ─────────────────────────────────────────
// Types for our email jobs
// ─────────────────────────────────────────
interface InviteEmailData {
  to: string;
  inviterName: string;
  workspaceName: string;
  inviteToken: string;
}

interface WelcomeEmailData {
  to: string;
  name: string;
  workspaceName: string;
}

export interface TaskAssignedEmailData {
  to: string;
  assigneeName: string;
  assignerName: string;
  taskTitle: string;
  projectName: string;
  workspaceName: string;
  taskUrl: string;
}

// ─────────────────────────────────────────
// Create the Queue
// Think of this as the "inbox" for email jobs
// ─────────────────────────────────────────
export const emailQueue = new Queue('emails', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,           // retry 3 times if it fails
    backoff: {
      type: 'exponential', // wait longer between each retry
      delay: 2000,         // start with 2 seconds
    },
    removeOnComplete: 100, // keep last 100 completed jobs
    removeOnFail: 50,      // keep last 50 failed jobs
  },
});

// ─────────────────────────────────────────
// Helper functions to add jobs to queue
// Use these in your controllers
// ─────────────────────────────────────────
export const sendInviteEmail = async (data: InviteEmailData) => {
  await emailQueue.add('invite-email', data);
  console.log(`📧 Invite email queued for ${data.to}`);
};

export const sendWelcomeEmail = async (data: WelcomeEmailData) => {
  await emailQueue.add('welcome-email', data);
  console.log(`📧 Welcome email queued for ${data.to}`);
};

export const sendTaskAssignedEmail = async (data: TaskAssignedEmailData) => {
  await emailQueue.add('task-assigned-email', data);
  console.log(`📧 Task assigned email queued for ${data.to}`);
};

// ─────────────────────────────────────────
// Due Date Reminder Email
// ─────────────────────────────────────────
export interface TaskDueReminderEmailData {
  to: string;
  assigneeName: string;
  taskTitle: string;
  projectName: string;
  workspaceName: string;
  taskUrl: string;
  dueDate: string; // human-readable date, e.g. "June 3, 2026"
}

export const sendTaskDueReminderEmail = async (data: TaskDueReminderEmailData) => {
  await emailQueue.add('task-due-reminder-email', data);
  console.log(`⏰ Due reminder email queued for ${data.to}`);
};