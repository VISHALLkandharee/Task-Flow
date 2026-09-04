export const BOARD_COLUMNS = [
  {
    label: "To Do",
    color: "#9ca3af",
    tasks: [
      {
        title: "Research competitor pricing",
        priority: "MEDIUM",
        priorityBg: "#dbeafe",
        priorityColor: "#1e40af",
        avatar: "A",
        avatarBg: "#dbeafe",
        avatarColor: "#1e40af",
      },
      {
        title: "Draft product roadmap Q3",
        priority: "LOW",
        priorityBg: "#f3f4f6",
        priorityColor: "#4b5563",
        avatar: "M",
        avatarBg: "#fef3c7",
        avatarColor: "#92400e",
      },
    ],
  },
  {
    label: "In Progress",
    color: "#60a5fa",
    tasks: [
      {
        title: "Integrate Stripe webhooks",
        priority: "URGENT",
        priorityBg: "#fee2e2",
        priorityColor: "#991b1b",
        avatar: "V",
        avatarBg: "#ede9fe",
        avatarColor: "#5b21b6",
      },
      {
        title: "Design task detail modal",
        priority: "HIGH",
        priorityBg: "#ffedd5",
        priorityColor: "#9a3412",
        avatar: "S",
        avatarBg: "#dcfce7",
        avatarColor: "#166534",
      },
    ],
  },
  {
    label: "In Review",
    color: "#fbbf24",
    tasks: [
      {
        title: "Refactor auth middleware",
        priority: "HIGH",
        priorityBg: "#ffedd5",
        priorityColor: "#9a3412",
        avatar: "V",
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
        title: "Setup BullMQ email queue",
        priority: "MEDIUM",
        priorityBg: "#dbeafe",
        priorityColor: "#1e40af",
        avatar: "A",
        avatarBg: "#dbeafe",
        avatarColor: "#1e40af",
      },
      {
        title: "Postgres schema migration",
        priority: "LOW",
        priorityBg: "#f3f4f6",
        priorityColor: "#4b5563",
        avatar: "M",
        avatarBg: "#fef3c7",
        avatarColor: "#92400e",
      },
    ],
  },
];

export const STATS = [
  { value: "100%", label: "Real-time sync" },
  { value: "0ms", label: "Optimistic UI lag" },
  { value: "Unlimited", label: "Tasks & projects on Pro" },
];

export const FEATURES = [
  {
    emoji: "📋",
    title: "Kanban & List Views",
    description:
      "Switch between a drag-and-drop Kanban board and a filterable task list with one click.",
  },
  {
    emoji: "⚡",
    title: "Real-Time Collaboration",
    description:
      "Socket.io powered live updates. See tasks move, comments appear, and assignments update instantly.",
  },
  {
    emoji: "🔔",
    title: "Smart Notifications",
    description:
      "In-app notification bell + Resend email alerts when you get assigned a task or a deadline approaches.",
  },
  {
    emoji: "👥",
    title: "Multi-Tenant Workspaces",
    description:
      "Role-based access (Owner, Admin, Member). Invite teammates via secure time-limited tokens.",
  },
  {
    emoji: "💳",
    title: "Stripe Billing Built-in",
    description:
      "Free tier with 3 projects & 5 members. Upgrade to Pro for unlimited everything via Stripe Checkout.",
  },
  {
    emoji: "💬",
    title: "Task Comments & Activity",
    description:
      "Leave comments, discuss blockers, and track full task history directly inside the task drawer.",
  },
];

export const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Great for solo developers and small side projects.",
    features: [
      "Up to 3 projects",
      "Up to 5 team members",
      "Kanban & List views",
      "Real-time notifications",
      "Task comments",
      "Community support",
    ],
    cta: "Get started free",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "per workspace / month",
    description: "For fast-moving teams that need unlimited scale.",
    badge: "Most popular",
    features: [
      "Unlimited projects",
      "Unlimited team members",
      "Priority email reminders",
      "Advanced filtering & search",
      "Stripe Customer Portal access",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    href: "/register",
    highlighted: true,
  },
];

export const FAQS = [
  {
    q: "Is there a free trial for Pro?",
    a: "You can use the Free plan indefinitely with up to 3 projects and 5 members. Upgrade to Pro whenever your team outgrows the limits.",
  },
  {
    q: "How does real-time sync work?",
    a: "TaskFlow uses WebSockets via Socket.io. When a teammate moves a task or adds a comment, your board updates instantly without a page refresh.",
  },
  {
    q: "Can I invite team members on the free plan?",
    a: "Yes! The Free plan allows up to 5 members per workspace. Each member receives a secure email invite link to join.",
  },
];
