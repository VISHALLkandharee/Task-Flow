# TaskFlow — Modern Task & Workflow Management SaaS

[![CI Pipeline](https://github.com/VISHALLkandharee/Task-Flow/actions/workflows/ci.yml/badge.svg)](https://github.com/VISHALLkandharee/Task-Flow/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16+-black.svg)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-green.svg)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Live Demo:** [task-flow-nu-sepia.vercel.app](https://task-flow-nu-sepia.vercel.app/)  
**Contact:** [vishall.kandharee@gmail.com](mailto:vishall.kandharee@gmail.com)

---

## Overview

**TaskFlow** is an enterprise-grade TypeScript SaaS monorepo featuring a multi-tenant task and workflow management system. Built with **Next.js (App Router)** and an **Express.js API**, it features real-time WebSocket communication, background email queuing with BullMQ & Redis, Stripe subscription billing with idempotent webhooks, role-based access control (RBAC), and automated testing.

---

## Key Features

- **Multi-Tenant Workspaces**: Workspace isolation with `OWNER`, `ADMIN`, and `MEMBER` RBAC roles.
- **Real-Time Kanban & List Boards**: Drag-and-drop task manipulation with optimistic UI updates and live WebSocket synchronization across users.
- **Stripe Subscription Billing**: Pro plan upgrades via Stripe Checkout, customer portal self-management, and idempotent webhook processing.
- **Background Processing & Cron**: BullMQ and Redis queues for transactional invite/welcome emails (Resend) and automated daily task due date reminders.
- **Structured Logging & Diagnostics**: `pino`-powered structured logging with request tracing, standardized API error responses, and `/health` monitoring endpoints.
- **Zero-Setup Testing**: Comprehensive Jest + Supertest automated test suite mocking external boundaries (Stripe, Resend, DB, Redis) with 100% offline test execution.
- **Full Containerization**: Multi-stage Dockerfiles and `docker-compose.yml` to spin up PostgreSQL, Redis, API, and Client in a single command.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Client (Next.js 16 + React)                 │
│         Kanban Board | Optimistic UI | Tailwind CSS         │
└───────────────┬─────────────────────────────▲───────────────┘
                │ HTTP / REST                 │ Socket.io
                ▼                             │
┌─────────────────────────────────────────────┴───────────────┐
│                 API Server (Express 5 + TS)                 │
│      JWT Auth | Zod Validation | Pino Structured Logging    │
└───────┬──────────────┬──────────────┬──────────────┬────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│  PostgreSQL  ││ Redis/BullMQ ││ Stripe API   ││  Resend API  │
│(Prisma ORM)  ││ (Background) ││  (Billing)   ││   (Emails)   │
└──────────────┘└──────────────┘└──────────────┘└──────────────┘
```

---

## Quick Start (Fresh Clone)

### Option A: One-Command Docker Setup

```bash
# 1. Clone repository
git clone https://github.com/VISHALLkandharee/Task-Flow.git
cd Task-Flow

# 2. Start all services (PostgreSQL, Redis, API, and Client)
docker compose up --build
```
- **Web App**: `http://localhost:3000`
- **API Server**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/health`

---

### Option B: Local Development Setup

#### 1. Setup Backend API (`apps/api`)

```bash
cd apps/api

# Install dependencies
npm ci

# Configure environment variables
cp .env.example .env

# Generate Prisma Client & Run Migrations
npx prisma generate
npx prisma db push

# Start API in development mode
npm run dev
```

#### 2. Setup Client (`apps/client`)

```bash
cd apps/client

# Install dependencies
npm ci

# Configure environment variables
cp .env.local.example .env.local

# Start Next.js frontend
npm run dev
```

---

## Automated Testing Suite

The repository includes unit and integration tests covering controller logic, access control permissions, Stripe webhook idempotency, and health endpoints.

```bash
cd apps/api

# Run test suite
npm test

# Run tests with code coverage report
npm run test:coverage
```

### Test Coverage Highlights
- **Task Controller**: Verifies creation validation, project access security (403 for unauthorized members, 404 for missing projects), task updates, moves, and soft deletion.
- **Billing Controller**: Tests Stripe checkout creation, customer mapping, billing portal redirection, and webhook idempotency handling.
- **Auth Controller**: Tests registration, password hashing verification, JWT token refreshes, and cookie management.
- **Health Endpoint**: Validates `/health` and `/api/v1/health` connectivity status checks for PostgreSQL and Redis.

---

## Code Quality & Linting

```bash
# Lint API
cd apps/api && npm run lint

# Lint Client
cd apps/client && npm run lint

# Typecheck Monorepo
cd apps/api && npx tsc --noEmit
cd apps/client && npx tsc --noEmit
```

---

## Monorepo Structure

```
Task-Flow/
├── .github/
│   ├── workflows/ci.yml       # Automated CI pipeline (lint, typecheck, test, build)
│   └── dependabot.yml         # Weekly automated dependency update tooling
├── apps/
│   ├── api/                   # Express.js REST API
│   │   ├── prisma/            # Database schema & migrations
│   │   ├── src/
│   │   │   ├── controllers/   # Route controllers (auth, billing, task, etc.)
│   │   │   ├── jobs/          # BullMQ background workers & cron queues
│   │   │   ├── lib/           # Logger, Prisma, Redis, Stripe, Socket helpers
│   │   │   ├── middlewares/   # Error handling, Auth protection, Rate limiter
│   │   │   └── routes/        # Express API route declarations
│   │   ├── Dockerfile
│   │   └── jest.config.js
│   └── client/                # Next.js 16 App Router Client
│       ├── app/               # App Router pages and layouts
│       ├── components/        # Modular UI components (<300 LOC per file)
│       │   ├── board/         # Kanban board, cards, columns, task detail forms
│       │   └── landing/       # Modular landing page sections
│       ├── hooks/             # TanStack React Query custom hooks
│       ├── store/             # Zustand global state stores
│       └── Dockerfile
├── docker-compose.yml         # Full stack container orchestration
└── README.md
```

---

## License

This project is licensed under the [MIT License](LICENSE).
