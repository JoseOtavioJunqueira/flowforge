# FlowForge

A full-stack platform for **personal and team workflow orchestration**. Users compose workflows out of steps (tasks, forms, approvals, waits) and track runs and metrics per workspace.

This is an early-stage project: the data model and system architecture are fully designed (see `db/migrations/` and `docs/ARCHITECTURE.md`), and authentication is implemented end-to-end, but the core workflow features are not built yet. See **Status** below for exactly what works today.

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

**Designed but not yet implemented**
- Workspaces, workflows, runs, and metrics modules (REST endpoints, database access layer). The schema exists; the NestJS modules that read/write it do not.
- The user store is currently in-memory (`UsersService`), not backed by the `core_users` Postgres table yet.

## Folder Structure

- `backend/` — NestJS API (auth and users are implemented; workspaces/workflows/runs/metrics are planned)
- `frontend/` — React SPA (currently a landing page placeholder)
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

`vercel.json` defines two services: `frontend` (Vite, served at `/`) and `backend` (NestJS, served at `/api/*`).
Set this environment variable in the Vercel project (without it the backend falls back to a temporary random secret and logs a warning):

- `JWT_SECRET`: a long random string

Note: users are currently stored in memory, so on serverless they reset between cold starts. Persistence arrives when the `core_users` table (PostgreSQL) is wired up.
