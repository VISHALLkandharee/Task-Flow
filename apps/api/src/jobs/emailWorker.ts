import { Worker, Job } from 'bullmq';
import { Resend } from 'resend';
import { redis } from '../lib/redis';

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// ─────────────────────────────────────────
// The Worker — processes jobs from the queue
// This runs separately from your HTTP server
// ─────────────────────────────────────────
export const emailWorker = new Worker(
  'emails', // same queue name
  async (job: Job) => {
    console.log(`⚙️  Processing job: ${job.name}`);

    // ── Invite Email ──
    if (job.name === 'invite-email') {
      const { to, inviterName, workspaceName, inviteToken } = job.data;
      const inviteUrl = `${BASE_URL}/invite/${inviteToken}`;

      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'TaskFlow <onboarding@resend.dev>',
        to,
        subject: `${inviterName} invited you to ${workspaceName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">You're invited to join ${workspaceName}!</h2>
            <p style="color: #6b7280;">
              ${inviterName} has invited you to collaborate on TaskFlow.
            </p>
            
              href="${inviteUrl}"
              style="
                display: inline-block;
                background: #4f46e5;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: bold;
                margin: 16px 0;
              "
            >
              Accept Invitation
            </a>
            <p style="color: #9ca3af; font-size: 13px;">
              This invite expires in 24 hours.
              If you didn't expect this, you can ignore this email.
            </p>
          </div>
        `,
      });

      console.log(`✅ Invite email sent to ${to}`);
    }

    // ── Welcome Email ──
    if (job.name === 'welcome-email') {
      const { to, name, workspaceName } = job.data;

      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'TaskFlow <onboarding@resend.dev>',
        to,
        subject: `Welcome to TaskFlow, ${name}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Welcome to TaskFlow! 🎉</h2>
            <p style="color: #6b7280;">
              Hi ${name}, you've successfully joined <strong>${workspaceName}</strong>.
            </p>
            <p style="color: #6b7280;">
              Start by creating your first project and inviting your team.
            </p>
            
              href="${BASE_URL}/dashboard"
              style="
                display: inline-block;
                background: #4f46e5;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: bold;
              "
            >
              Go to Dashboard
            </a>
          </div>
        `,
      });

      console.log(`✅ Welcome email sent to ${to}`);
    }

    // ── Task Assigned Email ──
    if (job.name === 'task-assigned-email') {
      const { to, assigneeName, assignerName, taskTitle, projectName, workspaceName, taskUrl } = job.data;

      const fullTaskUrl = `${BASE_URL}${taskUrl}`;

      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'TaskFlow <onboarding@resend.dev>',
        to,
        subject: `${assignerName} assigned you a task in ${projectName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="background: #e0e7ff; color: #4f46e5; width: 48px; height: 48px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold;">
                📋
              </div>
            </div>
            <h2 style="color: #111827; text-align: center; margin-bottom: 8px;">New Task Assignment</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5; text-align: center; margin-bottom: 24px;">
              Hi ${assigneeName},<br>
              <strong>${assignerName}</strong> just assigned you a new task in the <strong>${projectName}</strong> project (Workspace: ${workspaceName}).
            </p>
            
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #111827; font-weight: 600; font-size: 16px;">
                ${taskTitle}
              </p>
            </div>

            <div style="text-align: center;">
              <a 
                href="${fullTaskUrl}"
                style="
                  display: inline-block;
                  background: #4f46e5;
                  color: white;
                  padding: 12px 24px;
                  border-radius: 6px;
                  text-decoration: none;
                  font-weight: 600;
                  font-size: 16px;
                "
              >
                View Task Board
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 13px; text-align: center; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
              You're receiving this because you're a member of ${workspaceName} on TaskFlow.
            </p>
          </div>
        `,
      });

      console.log(`✅ Task assigned email sent to ${to}`);
    }

    // ── Task Due Reminder Email ──
    if (job.name === 'task-due-reminder-email') {
      const { to, assigneeName, taskTitle, projectName, workspaceName, taskUrl, dueDate } = job.data;

      const fullTaskUrl = `${BASE_URL}${taskUrl}`;

      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'TaskFlow <onboarding@resend.dev>',
        to,
        subject: `⚠️ Reminder: Task "${taskTitle}" is due tomorrow!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="background: #fff7ed; color: #ea580c; width: 48px; height: 48px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold;">
                ⚠️
              </div>
            </div>
            <h2 style="color: #111827; text-align: center; margin-bottom: 8px;">Task Due Tomorrow</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5; text-align: center; margin-bottom: 24px;">
              Hi ${assigneeName},<br>
              This is a friendly reminder that a task assigned to you in the project <strong>${projectName}</strong> (Workspace: ${workspaceName}) is due tomorrow, <strong>${dueDate}</strong>.
            </p>
            
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #92400e; font-weight: 600; font-size: 16px;">
                ${taskTitle}
              </p>
              <p style="margin: 4px 0 0 0; color: #b45309; font-size: 14px;">
                Due date: ${dueDate}
              </p>
            </div>

            <div style="text-align: center;">
              <a 
                href="${fullTaskUrl}"
                style="
                  display: inline-block;
                  background: #ea580c;
                  color: white;
                  padding: 12px 24px;
                  border-radius: 6px;
                  text-decoration: none;
                  font-weight: 600;
                  font-size: 16px;
                "
              >
                View Task Board
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 13px; text-align: center; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
              You're receiving this because you're a member of ${workspaceName} on TaskFlow.
            </p>
          </div>
        `,
      });

      console.log(`✅ Task due reminder email sent to ${to}`);
    }
  },
  {
    connection: redis,
    concurrency: 5, // process 5 emails simultaneously
  }
);

// ─────────────────────────────────────────
// Worker event listeners — for logging
// ─────────────────────────────────────────
emailWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} (${job.name}) completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} (${job?.name}) failed:`, err.message);
});