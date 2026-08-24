# Fastify Agent Console

An internal agent console for a support ticketing platform. Agents sign in, view and manage tickets, upload attachments, and see updates from other agents live as they happen. Built as the second app in the Fastify block of a nine-app Node.js/TypeScript framework learning series.

## Tech Stack

**Backend**
- Fastify (Node.js/TypeScript)
- Drizzle ORM + PostgreSQL 16
- Redis
- MinIO (S3-compatible object storage) for file attachments
- MailHog (local SMTP catcher) + Nodemailer for transactional email
- Server-Sent Events (SSE) for live ticket updates
- Prometheus + Grafana for metrics and dashboards
- JWT access tokens + httpOnly refresh-token cookies, with token rotation on every refresh
- Google OAuth alongside email/password authentication
- Vitest for backend testing (35 tests)

**Frontend**
- React 19 + Vite
- Tailwind CSS v4 + shadcn/ui (Radix primitives)
- Zustand for client state
- Axios with request/response interceptors for silent token refresh
- React Hook Form + Zod for form validation, sharing validation schemas with the backend where practical
- React Router v7 (declarative mode)
- Vitest + Testing Library for frontend testing (22 tests)

**Infrastructure**
- NX monorepo (single root `package.json`)
- pnpm package manager
- Docker Compose for all backing services (Postgres, Redis, MinIO, MailHog, Prometheus, Grafana)

## Links

- [GitHub Repository](https://github.com/bbornino/fastify_agent_console)

## Features Implemented

- **Authentication** — email/password registration and login, Google OAuth (with automatic account linking by email), full JWT refresh-token rotation, httpOnly cookies, and sessions that survive a page reload
- **Ticket management** — create, list, view, and update tickets, with status, priority, category, and agent assignment
- **Cursor-based pagination** — tickets load 25 at a time via a "Load more" button, tested against a 25,000+ row seeded dataset
- **File attachments** — agents can upload files to a ticket, view the list of what's attached, download any of them back, and delete ones that no longer belong, all stored in MinIO
- **Transactional email** — agents receive an email when a ticket is assigned to them; customers receive an email when their ticket is resolved
- **Live updates** — the ticket list updates in real time via Server-Sent Events whenever any ticket is created or changed, without a page refresh
- **Observability** — Prometheus scrapes live request metrics from the API; a Grafana dashboard visualizes request rate

## Setup / Installation

### Prerequisites
- Node.js 24 (via nvm-windows or equivalent)
- pnpm
- Docker Desktop

### 1. Install dependencies
```powershell
pnpm install
```

### 2. Start backing services
```powershell
docker compose up -d
```
This starts Postgres, Redis, MinIO, MailHog, Prometheus, and Grafana.

### 3. Configure environment variables
Copy `.env.example` to `.env` and fill in real values. This includes database, Redis, MinIO (both the app's connection details and the MinIO container's own admin credentials, `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`, which Docker Compose reads directly from `.env`), SMTP, and Google OAuth credentials. See `apps/api/src/app/constants.ts` and the plugin files under `apps/api/src/app/plugins/` for how each variable is used.

### 4. Push the database schema
```powershell
node_modules/drizzle-kit/bin.cjs push
```

### 5. Seed the database
```powershell
pnpm seed
```
This creates three sample agent accounts, a `test@example.com` account (password: `testpass123`), and 25,000+ sample tickets for realistic pagination testing.

### 6. Run the app
In two separate terminals:
```powershell
pnpm exec nx serve api
pnpm exec nx serve web
```
The frontend is available at `http://localhost:4200`, proxying all `/api/*` requests to the backend on port 3000.

### Health checks
```powershell
pnpm health        # is the API server up?
pnpm db:ping        # is Postgres reachable?
pnpm redis:ping     # is Redis reachable?
pnpm minio:ping     # is MinIO reachable?
pnpm mail:ping      # is MailHog reachable?
```

## Running Tests

**Backend (35 tests):**
```powershell
pnpm exec nx test api
```

**Frontend (22 tests):**
```powershell
pnpm exec nx test web
```

## Local Service URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:4200 |
| API | http://localhost:3000 |
| MailHog inbox | http://localhost:8026 |
| MinIO console | http://localhost:9003 |
| Prometheus | http://localhost:9091 |
| Grafana | http://localhost:3001 |
