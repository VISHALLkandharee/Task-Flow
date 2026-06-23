# Task Flow — Modern Task & Workflow Manager

A production-ready task and workflow management application built with Next.js and TypeScript. Features an intuitive UI, real-time updates, and comprehensive project tracking capabilities.

**[Live Demo](https://task-flow-nu-sepia.vercel.app/)** · **[LinkedIn](https://www.linkedin.com/in/vishal-kumar-87a19730b)** · **[Contact](mailto:vishall.kandharee@gmail.com)**

---

## ✨ Features

- **Project & Task Management** — Full CRUD operations with rich metadata (due dates, assignees, priorities, tags)
- **Multiple Views** — Switch between Kanban and list views with quick filtering
- **Search & Filter** — Tag-based filtering and intelligent search across tasks
- **Authentication** — Secure user auth with role-based UI
- **Data Export** — Export tasks and full projects to CSV
- **Responsive Design** — Works seamlessly on desktop and mobile devices
- **Cloud Deployed** — Instant sharing with clients via Vercel

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js (App Router), React, TypeScript |
| **Styling** | Tailwind CSS |
| **State Management** | React Query / Zustand |
| **Backend** | Supabase (Auth & Database) |
| **Deployment** | Vercel |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm (or yarn/pnpm)

### Setup (5 minutes)

```bash
# Clone the repository
git clone https://github.com/VISHALLkandharee/Task-Flow.git
cd Task-Flow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables section)

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NextAuth (if using)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Do not commit `.env.local` — it contains sensitive credentials.

---

## 📦 NPM Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint 'src/**/*.{ts,tsx,js,jsx}'",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "vitest"
  }
}
```

**Common commands:**
- `npm run dev` — Start development server with hot reload
- `npm run build && npm start` — Production build and start
- `npm run lint` — Check for code issues
- `npm run type-check` — Run TypeScript type checking
- `npm run test` — Run test suite

---

## 🏗 Project Structure

```
Task-Flow/
├── apps/
│   └── client/              # Next.js frontend app
│       ├── src/
│       │   ├── app/         # App Router pages and layouts
│       │   ├── components/  # React components
│       │   ├── lib/         # Utilities and helpers
│       │   └── styles/      # Global styles
│       └── public/          # Static assets
├── assets/                  # Images and diagrams
├── .env.example             # Environment template
├── package.json
└── README.md
```

---

## 💡 Key Highlights

### For Developers
- **Type-safe** — Full TypeScript coverage with strict mode enabled
- **Performant** — Optimized bundle size, lazy-loaded components, image optimization
- **Well-structured** — Clear separation of concerns, reusable components, utilities
- **Testing ready** — Examples for unit and integration tests using Vitest

### For Portfolio / Interviews
- **Full-stack thinking** — Frontend design, state management, authentication, and deployment
- **Real-world features** — CRUD operations, filtering, search, exports
- **Production-ready** — Error handling, validation, security best practices
- **Interview talking points** — Data modeling, performance optimization, UX considerations

---

## 🔒 Security

- **Environment Secrets** — Never commit `.env.local` or private keys
- **Vercel Secrets** — Store production secrets in Vercel project settings
- **Supabase** — Use anon keys in frontend; keep service_role keys private
- **Authentication** — User sessions managed securely via NextAuth or Supabase Auth

---

## 📚 Next Steps & Recommendations

### Immediate
- [ ] Create `.env.example` with all required variables
- [ ] Add CI workflow (GitHub Actions)
- [ ] Set up pre-commit hooks with Husky + lint-staged
- [ ] Add unit tests for core components

### Short-term
- [ ] Implement E2E tests (Playwright or Cypress)
- [ ] Add Lighthouse performance monitoring
- [ ] Create CONTRIBUTING.md and issue templates
- [ ] Document API routes and database schema

### Polish
- [ ] Add architecture diagram to `/assets`
- [ ] Implement keyboard navigation (a11y)
- [ ] Test mobile responsiveness across devices
- [ ] Set up Sentry for error tracking

---

## 🧪 Testing & Quality

Run the following before opening a pull request:

```bash
npm run lint      # Fix linting issues
npm run format    # Format code
npm run type-check # Type checking
npm run test      # Run tests
npm run build     # Verify production build
```

---

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feat/your-feature`)
5. Open a Pull Request

Please ensure:
- Code passes linting and type-checking
- Tests are included for new features
- PR description clearly explains changes
- Commits follow conventional commit format

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

**Vishal Kumar**

- **Email:** [vishall.kandharee@gmail.com](mailto:vishall.kandharee@gmail.com)
- **LinkedIn:** [linkedin.com/in/vishal-kumar-87a19730b](https://www.linkedin.com/in/vishal-kumar-87a19730b)
- **Live Demo:** [task-flow-nu-sepia.vercel.app](https://task-flow-nu-sepia.vercel.app/)

---

<div align="center">

**Built with ❤️ using Next.js, TypeScript, and Supabase**

</div>
