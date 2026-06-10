"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <nav
        className="border-b border-gray-100 sticky top-0 bg-white/90
        backdrop-blur-md z-50"
      >
        <div
          className="max-w-5xl mx-auto px-6 h-14 flex items-center
          justify-between"
        >
          <span className="text-base font-semibold text-indigo-600">
            TaskFlow
          </span>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="text-sm bg-indigo-600 text-white px-4
                py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-gray-500 px-3 py-1.5
                  rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-indigo-600 text-white px-4
                  py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="max-w-3xl mx-auto px-6 pt-20 pb-12
        text-center"
      >
        <div
          className="inline-flex items-center gap-2 bg-indigo-50
          text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full
          mb-6 border border-indigo-100"
        >
          <div
            className="w-1.5 h-1.5 bg-indigo-500 rounded-full
            animate-pulse"
          />
          Built for modern dev teams
        </div>

        <h1
          className="text-5xl font-bold text-gray-900 mb-5
          leading-tight tracking-tight"
        >
          Ship faster with
          <br />
          <span className="text-indigo-600">less chaos</span>
        </h1>

        <p
          className="text-lg text-gray-500 mb-8 max-w-xl mx-auto
          leading-relaxed"
        >
          TaskFlow is a real-time team task manager built for founders and
          developers — Kanban boards, live notifications, Stripe billing, and
          full team collaboration in one place.
        </p>

        <div className="flex items-center justify-center gap-3 mb-4">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-indigo-600
              text-white px-6 py-3 rounded-xl text-sm font-medium
              hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="flex items-center gap-2 bg-indigo-600
                text-white px-6 py-3 rounded-xl text-sm font-medium
                hover:bg-indigo-700 transition-colors"
              >
                Start for free →
              </Link>
              <Link
                href="/login"
                className="text-sm text-gray-600 px-6 py-3 rounded-xl
                border border-gray-200 hover:border-gray-300
                hover:bg-gray-50 transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

        <p className="text-xs text-gray-400">
          Free plan · No credit card required · Setup in 2 minutes
        </p>
      </section>

      {/* ── Board Preview ── */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div
          className="bg-gray-50 border border-gray-200 rounded-2xl
          p-5"
        >
          <p className="text-xs text-gray-400 font-medium mb-4">
            Live Kanban board preview
          </p>
          <div className="grid grid-cols-4 gap-3">
            {BOARD_COLUMNS.map((col) => (
              <div key={col.label}>
                <div className="flex items-center gap-1.5 mb-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: col.color }}
                  />
                  <span className="text-xs font-medium text-gray-500">
                    {col.label}
                  </span>
                </div>
                {col.tasks.map((task) => (
                  <div
                    key={task.title}
                    className="bg-white border border-gray-200
                    rounded-lg p-2.5 mb-2"
                  >
                    <p className="text-xs font-medium text-gray-800 mb-2">
                      {task.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full
                        font-medium"
                        style={{
                          background: task.priorityBg,
                          color: task.priorityColor,
                        }}
                      >
                        {task.priority}
                      </span>
                      <div
                        className="w-5 h-5 rounded-full flex items-center
                        justify-center text-xs font-medium"
                        style={{
                          background: task.avatarBg,
                          color: task.avatarColor,
                        }}
                      >
                        {task.avatar}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-gray-50 border border-gray-200
              rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-semibold text-indigo-600 mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section
        className="max-w-5xl mx-auto px-6 py-16 border-t
        border-gray-100"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Everything your team needs
          </h2>
          <p className="text-gray-500">
            All the tools to plan, track, and ship — without the bloat.
          </p>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
          gap-4"
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-gray-50 rounded-xl p-5 border
              border-gray-200 hover:border-indigo-200 hover:bg-indigo-50
              transition-all group"
            >
              <div
                className="w-8 h-8 bg-white rounded-lg border
                border-gray-200 flex items-center justify-center mb-3
                group-hover:border-indigo-200 transition-colors text-base"
              >
                {f.emoji}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                {f.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section
        className="max-w-5xl mx-auto px-6 py-16 border-t
        border-gray-100"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Simple, honest pricing
          </h2>
          <p className="text-gray-500">
            Start free. Upgrade when your team grows.
          </p>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-5
          max-w-2xl mx-auto"
        >
          {/* Free */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Free</h3>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-3xl font-bold text-gray-900">$0</span>
              <span className="text-sm text-gray-400">/month</span>
            </div>
            <ul className="space-y-2 mb-6">
              {FREE_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm
                  text-gray-600"
                >
                  <div
                    className="w-4 h-4 rounded-full bg-gray-100
                    border border-gray-200 flex items-center
                    justify-center"
                  >
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="block text-center px-4 py-2.5 border
              border-gray-300 rounded-xl text-sm font-medium
              text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-indigo-600 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-white">Pro</h3>
              <span
                className="text-xs bg-white/20 text-indigo-100
                px-2 py-0.5 rounded-full"
              >
                Popular
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-3xl font-bold text-white">$9</span>
              <span className="text-sm text-indigo-300">/month</span>
            </div>
            <ul className="space-y-2 mb-6">
              {PRO_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm
                  text-indigo-100"
                >
                  <div
                    className="w-4 h-4 rounded-full bg-indigo-500
                    border border-indigo-400 flex items-center
                    justify-center"
                  >
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="block text-center px-4 py-2.5 bg-white
              rounded-xl text-sm font-medium text-indigo-600
              hover:bg-indigo-50 transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-indigo-600 rounded-3xl p-14 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">
            Ready to get started?
          </h2>
          <p className="text-indigo-200 mb-8 text-base">
            Join teams already using TaskFlow to ship faster.
          </p>
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-white
              text-indigo-600 px-6 py-3 rounded-xl text-sm font-medium
              hover:bg-indigo-50 transition-colors"
            >
              Go to your Dashboard →
            </Link>
          ) : (
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white
              text-indigo-600 px-6 py-3 rounded-xl text-sm font-medium
              hover:bg-indigo-50 transition-colors"
            >
              Create your free account →
            </Link>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8">
        <div
          className="max-w-5xl mx-auto px-6 flex items-center
          justify-between"
        >
          <span className="text-sm font-semibold text-indigo-600">
            TaskFlow
          </span>
          <p className="text-xs text-gray-400">
            © 2025 TaskFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs text-gray-400 hover:text-gray-600
              transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-xs text-gray-400 hover:text-gray-600
              transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────
// Data
// ─────────────────────────────────────────
const BOARD_COLUMNS = [
  {
    label: "To Do",
    color: "#9ca3af",
    tasks: [
      {
        title: "Design landing page",
        priority: "Medium",
        priorityBg: "#fef3c7",
        priorityColor: "#92400e",
        avatar: "H",
        avatarBg: "#ede9fe",
        avatarColor: "#5b21b6",
      },
      {
        title: "Write API docs",
        priority: "Low",
        priorityBg: "#dcfce7",
        priorityColor: "#166534",
        avatar: "V",
        avatarBg: "#fce7f3",
        avatarColor: "#9d174d",
      },
    ],
  },
  {
    label: "In Progress",
    color: "#60a5fa",
    tasks: [
      {
        title: "Build auth system",
        priority: "Urgent",
        priorityBg: "#fee2e2",
        priorityColor: "#991b1b",
        avatar: "A",
        avatarBg: "#e0e7ff",
        avatarColor: "#3730a3",
      },
    ],
  },
  {
    label: "In Review",
    color: "#fbbf24",
    tasks: [
      {
        title: "Stripe webhook fix",
        priority: "High",
        priorityBg: "#ffedd5",
        priorityColor: "#9a3412",
        avatar: "H",
        avatarBg: "#ede9fe",
        avatarColor: "#5b21b6",
      },
    ],
  },
  {
    label: "Done",
    color: "#4ade80",
    tasks: [
      {
        title: "Setup Docker",
        priority: "Low",
        priorityBg: "#dcfce7",
        priorityColor: "#166534",
        avatar: "V",
        avatarBg: "#fce7f3",
        avatarColor: "#9d174d",
      },
      {
        title: "Prisma migrations",
        priority: "Medium",
        priorityBg: "#fef3c7",
        priorityColor: "#92400e",
        avatar: "A",
        avatarBg: "#e0e7ff",
        avatarColor: "#3730a3",
      },
    ],
  },
];

const STATS = [
  { value: "∞", label: "Tasks per project on Pro" },
  { value: "0ms", label: "Real-time notification delay" },
  { value: "$0", label: "To get started today" },
];

const FEATURES = [
  {
    emoji: "📋",
    title: "Kanban boards",
    description:
      "Drag and drop tasks across columns. Visualise your workflow and keep everyone aligned.",
  },
  {
    emoji: "👥",
    title: "Team collaboration",
    description:
      "Invite teammates via email, assign tasks, and manage roles — all from one workspace.",
  },
  {
    emoji: "🔔",
    title: "Real-time notifications",
    description:
      "Instant WebSocket alerts when tasks are assigned or updated. No refresh needed.",
  },
  {
    emoji: "📊",
    title: "Progress dashboard",
    description:
      "See your team's workload, completed tasks, and project health at a glance.",
  },
  {
    emoji: "⚡",
    title: "Optimistic UI",
    description:
      "The app responds instantly — changes appear before the server confirms. Zero lag.",
  },
  {
    emoji: "🔒",
    title: "Secure by default",
    description:
      "JWT auth, RBAC roles, HTTPS, rate limiting, and input validation built in from day one.",
  },
];

const FREE_FEATURES = [
  "3 projects",
  "5 team members",
  "Unlimited tasks",
  "Kanban board",
  "Email invites",
  "Real-time notifications",
];

const PRO_FEATURES = [
  "Unlimited projects",
  "Unlimited members",
  "Unlimited tasks",
  "Priority support",
  "Advanced analytics",
  "Feature flags",
];
