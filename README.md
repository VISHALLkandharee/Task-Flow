Task Flow — Modern Task & Workflow Manager

Live demo: https://task-flow-nu-sepia.vercel.app/
Contact: vishall.kandharee@gmail.com

One-line summary Task Flow is a production-minded task and workflow manager with an intuitive, fast UI, realtime-ish updates, and features to track projects, tasks, assignees, and progress — built with modern frontend engineering practices for reliability and maintainability.

Why this project matters (TL;DR for reviewers)




Demonstrates full‑stack thinking: UX, performance-focused frontend, auth/session handling, and deploy-ready configuration.
Great interview talking points: data modeling for tasks, routing & state management, optimistic updates, accessibility and responsive layout.
Top features

Project and task CRUD with rich metadata (due date, assignee, priority, tags)
Kanban / list view switching and quick filters
Search and tag-based filtering
User authentication & role-aware UI (if enabled)
Export/import tasks and CSV export
Responsive design: desktop + mobile
Deployed to Vercel for instant sharing with clients
Screenshots (replace placeholders with real images in /assets/) ![Dashboard (placeholder)](./assets/tf-1.png)


Technology:

Frontend: Next.js (App Router) + React + TypeScript
Styling: Tailwind CSS / CSS Modules (adjust to actual)
State: React Query / Zustand / Context (adjust to actual)
Backend/BaaS: Supabase / Firebase / custom API (adjust to actual)
Deployment: Vercel
What I (author) built — quick bullets for resumes/interviews

Built Task Flow frontend with Next.js and TypeScript; implemented project/task CRUD, filters, and a responsive dashboard.
Integrated authentication and persisted user data using Supabase (or your backend); deployed to Vercel for client demos.
Added CI checks (lint, type-check, build) and documented a reproducible dev setup in the README.
Quick start (5–10 minutes)

Clone the repo git clone https://github.com/VISHALLkandharee/Task-Flow.git cd Task-Flow
Install dependencies npm install
Create env file cp .env.example .env
edit .env with real values (see below)
Run dev server npm run dev
Open browser: http://localhost:3000 (or the port printed by Next/Vite)
Environment variables (.env.example)

Example variables — DO NOT commit secrets
NEXT_PUBLIC_API_URL=https://api.example.com NEXT_PUBLIC_VERCEL_ENV=development NEXT_PUBLIC_MAPS_KEY=your_maps_key_if_applicable NEXTAUTH_URL=http://localhost:3000 NEXTAUTH_SECRET=your_nextauth_secret SUPABASE_URL=https://your.supabase.co SUPABASE_ANON_KEY=your_supabase_anon_key

NPM scripts (recommended) Add/verify these in package.json:

dev — start dev server (next dev or vite)
build — production build (next build or vite build)
start — start production server (next start)
lint — eslint
format — prettier --write .
type-check — tsc --noEmit
test — vitest / jest Example: { "scripts": { "dev": "next dev", "build": "next build", "start": "next start", "lint": "eslint 'src/**/*.{ts,tsx,js,jsx}'", "format": "prettier --write .", "type-check": "tsc --noEmit", "test": "vitest" } }
Recommended repo additions (high impact)

.env.example (shown above)
LICENSE (MIT) at repo root
.github/workflows/ci.yml — run: npm ci, npm run lint, npm run type-check, npm run build, npm run test
Add badges (Vercel + CI + license) on top of README
Add CONTRIBUTING.md, ISSUE_TEMPLATE.md & PULL_REQUEST_TEMPLATE.md
Add small architecture diagram in /assets/arch.png
Suggested CI workflow (copy to .github/workflows/ci.yml) name: CI on: [push, pull_request] jobs: build: runs-on: ubuntu-latest steps: - uses: actions/checkout@v4 - uses: actions/setup-node@v4 with: node-version: 18 - run: npm ci - run: npm run lint - run: npm run type-check - run: npm run build - run: npm run test

Testing & quality

Add unit tests (Vitest + React Testing Library) for core components (header, task item, project card)
Add lint-staged + husky pre-commit hooks to run format + lint
Add a single integration test to validate core user flows
Accessibility & performance checks

Run Lighthouse and document scores in README or repo issues
Add basic keyboard navigation notes for core UI (kanban drag/drop, modal focus trapping)
Ensure images use alt text and content has semantic HTML
Deployment / Vercel

Provide a one-click Vercel deploy button: ![Deploy to Vercel](https://vercel.com/button)
On Vercel, set environment variables (NEXTAUTH_SECRET, SUPABASE keys) in the project settings.
Security & secrets

Never commit production keys. Use Vercel / Netlify secret stores.
If using Supabase, avoid embedding service_role keys in the frontend.
Architecture (brief)

Frontend: Next.js handles SSR/SSG pages and client navigation.
API: Either uses Supabase client in frontend or calls an API server for business logic.
Storage: Supabase / Postgres for persistent data; object storage for attachments. (If you want, I’ll open a small architecture diagram showing auth → API → DB → frontend flow.)
What to show clients / reviewers (5–30s tour)

Home/dashboard (single glance): total tasks, due soon, active projects.
Create a project and add 2 tasks (demonstrates CRUD).
Filter/search and show quick sorting/kanban view.
Open task detail to show comments/attachments (if implemented).
Call out deployment + CI status and show README top-line bullets.
“Elevator” bullets you can copy into your portfolio or LinkedIn

Built Task Flow, a modern task/workflow manager, using Next.js and TypeScript; integrated Supabase for auth & storage; deployed to Vercel for client demos.
Implemented project-level CRUD, dynamic filtering & Kanban UI and improved performance to reach X% faster initial paint (replace X with your metric if available).
Added developer-friendly tooling: type-checks, linting, and CI to ensure PR quality and fast iteration.
Contributing

Fork → create branch feat/NAME → open PR
Run tests and linters before opening PR
Add descriptive PR titles and link any related issue
License MIT — see LICENSE file

Contact & demo Live demo: https://task-flow-nu-sepia.vercel.app/
Email: vishall.kandharee@gmail.com
