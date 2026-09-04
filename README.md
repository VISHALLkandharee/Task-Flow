<div align="center">

# TaskFlow

**A real-time, multi-tenant team task management SaaS — built end-to-end, deployed to production.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-task--flow--nu--sepia.vercel.app-4f46e5?style=for-the-badge)](https://task-flow-nu-sepia.vercel.app/)
[![CI Pipeline](https://img.shields.io/github/actions/workflow/status/VISHALLkandharee/Task-Flow/ci.yml?branch=main&style=for-the-badge&label=CI%20Pipeline)](https://github.com/VISHALLkandharee/Task-Flow/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[Live App](https://task-flow-nu-sepia.vercel.app/) · [Features](#features) · [Tech Stack](#tech-stack) · [Architecture](#architecture) · [Automated Testing](#automated-testing-suite) · [Getting Started](#getting-started)

</div>

<br />

<p align="center">
  <img src="./assets/Screenshot%20(345).png" alt="TaskFlow dashboard overview" width="100%" />
</p>

<br />

## Overview

TaskFlow is a production-grade, multi-tenant SaaS task management platform built for teams of any size — from solo founders to growing startups. It supports multiple workspaces per user, real-time collaboration, and enterprise-grade permission controls.

This is a fully functional, deployed system designed to mirror the architecture decisions, edge cases, and trade-offs found in real production SaaS products like Linear, Notion, and Asana.

**Live deployment:** [task-flow-nu-sepia.vercel.app](https://task-flow-nu-sepia.vercel.app/)

<br />

## Why this project

Most portfolio projects stop at CRUD. TaskFlow goes further on purpose — every feature below exists because a real SaaS product needs it, not because it looked good on a checklist:

- **Multi-tenancy that's actually enforced** — every query is scoped to a workspace and verified against the requesting user's membership and role, not just hidden in the UI.
- **Billing that's wired to real money flows** — Stripe Checkout, webhook signature verification, subscription lifecycle events, and plan-based feature gating, all working against Stripe's production API.
- **Real-time that's actually real-time** — Socket.io rooms scoped per user, with JWT-authenticated socket handshakes, not polling dressed up as "real-time."
- **Permission boundaries that hold up** — a task assignee can update status but cannot edit title/description/due date; only the task creator or workspace admin can. This is enforced in both the API and database layer.
- **Zero-setup automated testing** — Jest and Supertest suite covering authentication, access control, billing idempotency, and health endpoints with complete offline mock isolation.

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

</td>
<td width="50%" valign="top">

### Tasks & Execution
- Drag-and-drop Kanban board powered by `@dnd-kit`
- Optimistic updates with instant rollback on failure
- Server-enforced permissions per task field
- Comments, due dates, priority tags, and soft deletes
- Filterable task views by status, priority, and assignee

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Real-Time & Background Jobs
- WebSockets via Socket.io with JWT handshakes
- Real-time in-app notification bell
- BullMQ worker queues for transactional emails via Resend
- Daily cron jobs for task due date reminders

</td>
<td width="50%" valign="top">

### Billing & Observability
- Stripe Checkout & Customer Portal integration
- Idempotent webhook processing protecting against duplicate events
- Structured JSON logging with `pino` for production monitoring
- Live health check endpoints (`/health`, `/api/v1/health`) for uptime tracking

</td>
</tr>
</table>

<br />

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS, Zustand, TanStack Query (React Query), React Hook Form + Zod |
| **Backend** | Node.js, Express, TypeScript, Pino Structured Logger |
| **Database** | PostgreSQL (Prisma ORM), hosted on Supabase |
| **Caching / Queues** | Redis (Upstash), BullMQ |
| **Real-time** | Socket.io, JWT-authenticated handshakes |
| **Payments** | Stripe (Checkout, Billing Portal, Webhooks) |
| **Email** | Resend (transactional email via background jobs) |
| **Auth** | JWT access + refresh tokens, httpOnly cookies, bcrypt |
| **Testing** | Jest, Supertest, ts-jest (30+ automated tests) |
| **CI/CD** | GitHub Actions (`ci.yml`), Dependabot |
| **Drag & Drop** | `@dnd-kit/core` |
| **Deployment** | Vercel (frontend), Railway (API), Supabase (DB), Upstash (Redis) |
| **Local Dev** | Docker Compose (Postgres, Redis, API, Client) |

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

## Automated Testing Suite

The repository includes unit and integration tests covering controller logic, security boundaries, Stripe webhook idempotency, and health endpoints:

```bash
cd apps/api

# Run automated tests
npm test

# Run tests with coverage report
npm run test:coverage
```

### Coverage Highlights
- **Task Controller**: Validates unauthenticated 401s, input validation 400s, cross-tenant isolation (403 for non-members, 404 for non-existent projects), task updates, and soft deletes.
- **Billing Controller**: Tests Stripe checkout session generation, portal access, and idempotency handling (duplicate webhook events return `200` without re-processing).
- **Auth Controller**: Tests registration duplicates (409), password hashing validation, cookie issuance, and refresh token rotation.
- **Health Endpoints**: Validates `/health` and `/api/v1/health` connectivity checks for database (`SELECT 1`) and Redis (`PING`).

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

Each **workspace** carries its own subscription — not each user. A single user can own a free personal workspace and a paid client workspace simultaneously, exactly like Slack, Linear, and Notion.

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
  <img src="./assets/Screenshot%20(347).png" alt="Stripe-powered billing and plan management" width="100%" />
</p>

<br />

## Getting Started

### Option A: One-Command Docker Setup

```bash
docker compose up --build
```
- Web App: `http://localhost:3000`
- API Server: `http://localhost:5000`
- Health Endpoint: `http://localhost:5000/health`

---

### Option B: Local Development Setup

#### Prerequisites
- Node.js 18+
- Docker (for local Postgres + Redis)
- A Stripe account (test mode is fine)
- A Resend API key (for email)

#### 1. Clone and install

```bash
git clone https://github.com/VISHALLkandharee/Task-Flow.git
cd Task-Flow
cd apps/api && npm install
cd ../client && npm install
```

#### 2. Start local infrastructure

```bash
docker compose up -d postgres redis
```

#### 3. Configure environment variables

Copy the example environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/client/.env.local.example apps/client/.env.local
```

#### 4. Run database migrations

```bash
cd apps/api
npx prisma generate
npx prisma db push
```

#### 5. Start the apps

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

## Screenshots

<p align="center">
  <img src="./assets/Screenshot%20(348).png" alt="Task creation and management interface" width="100%" />
</p>

<p align="center">
  <img src="./assets/Screenshot%20(349).png" alt="Real-time notifications and updates" width="100%" />
</p>

<p align="center">
  <img src="./assets/Screenshot%20(350).png" alt="User workspace and team management" width="100%" />
</p>

<br />

## Roadmap

Future enhancements planned for TaskFlow:

- File attachments on tasks (S3-compatible storage)
- Task activity log / audit trail
- Google OAuth as an alternative login method
- CSV/PDF export for project reports
- Admin-level analytics dashboard across workspaces

<br />

## Project Structure

```
Task-Flow/
├── .github/
│   ├── workflows/ci.yml     # Automated CI pipeline
│   └── dependabot.yml       # Automated dependency updates
├── apps/
│   ├── api/                 # Express + TypeScript backend
│   │   ├── prisma/          # Schema + migrations
│   │   └── src/
│   │       ├── controllers/ # Route controllers
│   │       ├── routes/      # API endpoints
│   │       ├── middlewares/ # Auth, rate-limiting, error handling
│   │       ├── jobs/        # BullMQ email & cron workers
│   │       └── lib/         # Logger, Redis, Socket.io, Stripe clients
│   └── client/              # Next.js 16 frontend
│       ├── app/             # App Router pages
│       ├── components/      # Modular UI components (<300 LOC)
│       ├── hooks/           # React Query hooks per domain
│       ├── lib/api/         # Typed API client layer
│       └── store/           # Zustand auth/workspace store
└── docker-compose.yml       # Full stack container orchestration
```

<br />

## Contact

**Vishal Kandharee**

- Email: [vishall.kandharee@gmail.com](mailto:vishall.kandharee@gmail.com)
- LinkedIn: [linkedin.com/in/vishal-kumar-87a19730b](https://www.linkedin.com/in/vishal-kumar-87a19730b/)
- GitHub: [@VISHALLkandharee](https://github.com/VISHALLkandharee)

<br />

<div align="center">

If you're an engineer or hiring manager reviewing this — thank you for taking the time. I'm actively looking for full-stack opportunities and welcome discussions about architecture, scaling, or any technical aspects of this project.

</div>
