<div align="center">

# TaskFlow

**A real-time, multi-tenant team task management SaaS — built end-to-end, deployed to production.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-task--flow--nu--sepia.vercel.app-4f46e5?style=for-the-badge)](https://task-flow-nu-sepia.vercel.app/)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)

[Live App](https://task-flow-nu-sepia.vercel.app/) · [Features](#features) · [Tech Stack](#tech-stack) · [Architecture](#architecture) · [Getting Started](#getting-started)

</div>

<br />

<p align="center">
  <img src="./assets/hero-dashboard.png" alt="TaskFlow dashboard overview" width="100%" />
</p>

<br />

## Overview

TaskFlow is a production-grade, multi-tenant SaaS task management platform built for teams of any size — from solo founders to growing startups. It supports multiple workspaces per user, real-time collaboration, role-based permissions, and a complete Stripe-powered subscription billing system.

This isn't a tutorial clone. It's a system designed and built to mirror the architecture decisions, edge cases, and trade-offs found in real production SaaS products like Linear, Notion, and Asana — covering everything from JWT refresh-token rotation to webhook signature verification to optimistic UI rollbacks.

**Live deployment:** [task-flow-nu-sepia.vercel.app](https://task-flow-nu-sepia.vercel.app/)

<br />

## Why this project

Most portfolio projects stop at CRUD. TaskFlow goes further on purpose — every feature below exists because a real SaaS product needs it, not because it looked good on a checklist:

- **Multi-tenancy that's actually enforced** — every query is scoped to a workspace and verified against the requesting user's membership and role, not just hidden in the UI.
- **Billing that's wired to real money flows** — Stripe Checkout, webhook signature verification, subscription lifecycle events, and plan-based feature gating, all working against Stripe's test environment in production.
- **Real-time that's actually real-time** — Socket.io rooms scoped per user, with JWT-authenticated socket handshakes, not polling dressed up as "real-time."
- **Permission boundaries that hold up** — a task assignee can update status but cannot edit title/description/due date; only the task creator or workspace admin can. This is enforced in both the API and the UI.

<br />

## Features

<table>
<tr>
<td width="50%" valign="top">

### Workspace & Identity
- Multi-workspace support with a workspace switcher
- Per-workspace billing (each workspace has its own plan — exactly like Slack, Notion, and Linear)
- Role-based access control (Owner / Admin / Member)
- JWT auth with short-lived access tokens + rotating refresh tokens
- Email invite flow with expiring, signed tokens

### Project & Task Management
- Kanban board with drag-and-drop (`@dnd-kit`)
- Position-based ordering (no full re-indexing on reorder)
- Task detail panel with role-aware editing — full edit for creators/admins, status-only for assignees
- Comment threads per task with real-time notification fan-out
- Search, filter (by assignee/priority/overdue), and team-avatar quick filters on the board

</td>
<td width="50%" valign="top">

### Real-Time & Notifications
- Socket.io with authenticated per-user rooms
- Instant in-app notifications (task assigned, commented, etc.)
- Optimistic UI everywhere — drag, status change, and comments update instantly and roll back on failure

### Billing & Plans
- Stripe Checkout for subscription upgrades
- Signature-verified webhooks (`checkout.session.completed`, `invoice.payment_succeeded/failed`, `subscription.deleted`)
- Stripe Billing Portal for self-service plan management
- Free-tier limits enforced server-side (projects, members) with clear in-app upgrade prompts

### Platform
- Background job queue (BullMQ + Redis) for transactional email
- Soft deletes across core entities (projects, tasks, workspaces)
- Rate limiting, Helmet security headers, input validation (Zod) on every mutation

</td>
</tr>
</table>

<br />

<p align="center">
  <img src="./assets/kanban-board.png" alt="Drag-and-drop Kanban board with filters" width="100%" />
</p>

<br />

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS, Zustand, TanStack Query (React Query), React Hook Form + Zod |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL (Prisma ORM), hosted on Supabase |
| **Caching / Queues** | Redis (Upstash), BullMQ |
| **Real-time** | Socket.io, JWT-authenticated handshakes |
| **Payments** | Stripe (Checkout, Billing Portal, Webhooks) |
| **Email** | Resend (transactional email via background jobs) |
| **Auth** | JWT access + refresh tokens, httpOnly cookies, bcrypt |
| **Drag & Drop** | `@dnd-kit/core` |
| **Deployment** | Vercel (frontend), Railway (API), Supabase (DB), Upstash (Redis) |
| **Local Dev** | Docker Compose (Postgres + Redis) |

<br />

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   Next.js Frontend   │  HTTPS  │   Express API         │
│   (Vercel)           │◄───────►│   (Railway)            │
│                      │         │                        │
│  - App Router        │         │  - REST endpoints      │
│  - Zustand (client)  │         │  - JWT middleware      │
│  - React Query       │         │  - Zod validation      │
│  - Socket.io client  │◄───────►│  - Socket.io server    │
└─────────────────────┘  WS      └───────────┬──────────┘
                                              │
                          ┌───────────────────┼───────────────────┐
                          ▼                   ▼                   ▼
                 ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐
                 │  PostgreSQL     │  │  Redis (Upstash) │  │  Stripe API   │
                 │  (Supabase)     │  │  - BullMQ queues │  │  - Checkout   │
                 │  via Prisma     │  │  - Socket cache  │  │  - Webhooks   │
                 └────────────────┘  └─────────────────┘  └──────────────┘
```

**Data model highlights:**
- `Workspace` → has many `Project`, `Member`, `Invite`
- `Member` is the join table between `User` and `Workspace`, carrying the `Role` enum
- `Project` → has many `Task`; `Task` → has many `Comment`, optional `assignee`, required `creator`
- Soft deletes (`deletedAt`) on `Project` and `Task` preserve referential integrity without hard deletes

<br />

## Permission Model

A deliberate design decision worth calling out: **assignees and creators have different editing rights on the same task.**

| Action | Creator / Admin / Owner | Assignee (not creator) |
|---|---|---|
| Change status | ✅ | ✅ |
| Edit title / description / due date | ✅ | ❌ (read-only view) |
| Reassign task | ✅ | ❌ |
| Delete task | ✅ | ❌ |
| Comment | ✅ | ✅ |

This mirrors how real teams work — the person doing the work should be able to update progress without being able to silently rewrite the task's scope.

<br />

## Billing Model

Each **workspace** carries its own subscription — not each user. A single user can own a free personal workspace and a paid client workspace simultaneously, exactly like Slack, Linear, and Notion handle multi-team billing.

| | Free | Pro — $9/mo |
|---|---|---|
| Projects | 3 | Unlimited |
| Members | 5 | Unlimited |
| Tasks | Unlimited | Unlimited |
| Real-time notifications | ✅ | ✅ |
| Priority support | — | ✅ |

Plan limits are enforced **server-side** in the relevant controllers — the frontend reflects state, it doesn't gate it.

<br />

<p align="center">
  <img src="./assets/billing-page.png" alt="Stripe-powered billing and plan management" width="100%" />
</p>

<br />

## Getting Started

### Prerequisites
- Node.js 18+
- Docker (for local Postgres + Redis)
- A Stripe account (test mode is fine)
- A Resend API key (for email)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd Task-Flow
cd apps/api && npm install
cd ../client && npm install
```

### 2. Start local infrastructure

```bash
docker compose up -d
```

### 3. Configure environment variables

Create `apps/api/.env`:

```env
DATABASE_URL="postgresql://taskflow:taskflow123@localhost:5432/taskflow_dev"
DIRECT_URL="postgresql://taskflow:taskflow123@localhost:5432/taskflow_dev"
JWT_SECRET="your-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
REDIS_URL="redis://localhost:6379"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."
RESEND_API_KEY="re_..."
CLIENT_URL="http://localhost:3000"
```

Create `apps/client/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 4. Run database migrations

```bash
cd apps/api
npx prisma migrate dev
```

### 5. Start the apps

```bash
# Terminal 1 — API
cd apps/api && npm run dev

# Terminal 2 — Frontend
cd apps/client && npm run dev

# Terminal 3 — Stripe webhook forwarding (local only)
stripe listen --forward-to localhost:5000/api/v1/billing/webhook
```

Visit `http://localhost:3000`.

<br />

## Deployment

| Service | Platform |
|---|---|
| Frontend | [Vercel](https://vercel.com) |
| API | [Railway](https://railway.app) |
| Database | [Supabase](https://supabase.com) (Postgres) |
| Redis | [Upstash](https://upstash.com) |
| Email | [Resend](https://resend.com) |
| Payments | [Stripe](https://stripe.com) |

**Live app:** [https://task-flow-nu-sepia.vercel.app/](https://task-flow-nu-sepia.vercel.app/)

<br />

## What I'd build next

Being transparent about the roadmap rather than pretending the project is "finished":

- File attachments on tasks (S3-compatible storage)
- Task activity log / audit trail
- Google OAuth as an alternative login method
- CSV/PDF export for project reports
- Admin-level analytics dashboard across workspaces

<br />

## Project Structure

```
Task-Flow/
├── apps/
│   ├── api/                 # Express + TypeScript backend
│   │   ├── prisma/          # Schema + migrations
│   │   └── src/
│   │       ├── controllers/
│   │       ├── routes/
│   │       ├── middlewares/
│   │       ├── jobs/         # BullMQ workers
│   │       └── lib/          # Prisma, Redis, Socket.io, Stripe clients
│   └── client/               # Next.js 16 frontend
│       ├── app/              # App Router pages
│       ├── components/
│       ├── hooks/             # React Query hooks per domain
│       ├── lib/api/            # Typed API client layer
│       └── store/              # Zustand auth/workspace store
└── docker-compose.yml
```

<br />

## Author

**Vishal Kandharee**

- Email: [your.email@example.com](vishall.kandharee@gmail.com)
- LinkedIn: [linkedin.com/in/your-profile](https://www.linkedin.com/in/vishal-kumar-87a19730b/)
- GitHub: [@VISHALLkandharee](https://github.com/VISHALLkandharee)

<br />

<div align="center">

If you're an engineer or hiring manager reviewing this — thank you for taking the time. I'm actively looking for full-stack opportunities and happy to walk through any part of the architecture, including the decisions that didn't make it into this README.

</div>



