# FlowForge

A full-stack platform for **personal and team workflow orchestration**. Users compose workflows out of steps (tasks, forms, approvals, waits) and track runs and metrics per workspace.

This is an early-stage project: the data model and system architecture are fully designed (see `db/migrations/` and `docs/ARCHITECTURE.md`), and authentication and a working in-memory version of workflows, runs and metrics are implemented, with the database layer still to come. See **Status** below for exactly what works today.

## Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL, with SQL migrations in `db/migrations`
- **Security**: JWT auth in the backend, plus workspace-scoped **Row Level Security (RLS)** at the database level

## Status

**Implemented**
- User registration and login (`POST /api/auth/register`, `POST /api/auth/login`), password hashing with bcrypt, JWT issuance.
- A global auth guard protecting all routes by default, with a `@Public()` decorator to opt specific routes out (used by the auth endpoints themselves).
- Full relational schema for workspaces, workflows, workflow steps, runs, run steps, and events, with RLS policies — see `db/migrations/`.

- Workflows API (`/api/workflows`, `/api/workflows/:id/runs`, `/api/runs`, `/api/metrics`), scoped per user, in memory, with a React UI to create workflows from steps (task, form, approval, wait), run them and see per-step timings.

**Designed but not yet implemented**
- Workspaces, and the PostgreSQL access layer for workflows, runs and metrics. The schema exists; the in-memory services do not use it yet.
- The user store is currently in-memory (`UsersService`), not backed by the `core_users` Postgres table yet.

## Folder Structure

- `backend/` — NestJS API (auth and users are implemented; workspaces/workflows/runs/metrics are planned)
- `frontend/` — React SPA (sign up / sign in, create and run workflows, metrics and run history)
- `db/` — SQL migrations and `docker-compose.yml` for PostgreSQL
- `docs/` — architecture and API documentation

## Running Locally

1. Start Postgres:

   ```bash
   cd db
   docker compose up -d
   ```

2. Install dependencies:

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Run backend and frontend (in two terminals):

   ```bash
   cd backend
   npm run start:dev
   ```

   ```bash
   cd frontend
   npm run dev
   ```

See `docs/ARCHITECTURE.md` and `docs/API.md` for more detail.

## Deploying on Vercel

`vercel.json` builds the frontend as a static site (`frontend/dist`) and serves the NestJS API as a serverless function (`api/index.js`, rewritten from `/api/*`).
The backend is pre-bundled so the function needs no `node_modules`: after changing anything in `backend/`, run `npm run bundle` in `backend/` and commit `backend/bundle/handler.cjs`.
Set this environment variable in the Vercel project (without it the backend falls back to a temporary random secret and logs a warning):

- `JWT_SECRET`: a long random string

Note: users are currently stored in memory, so on serverless they reset between cold starts. Persistence arrives when the `core_users` table (PostgreSQL) is wired up.
