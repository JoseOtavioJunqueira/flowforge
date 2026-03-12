# FlowForge

Plataforma full‑stack para **orquestração de workflows pessoais e de equipe**. Usuários criam fluxos compostos de etapas (tarefas, formulários, aprovações, esperas) e acompanham execuções e métricas por espaço de trabalho (workspace).

## Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: NestJS (Node.js + TypeScript)
- **Banco**: PostgreSQL com migrações SQL em `db/migrations`
- **Segurança**: JWT no backend e **Row Level Security (RLS)** por workspace no banco

## Estrutura de pastas

- `backend/` – API NestJS (auth, usuários, workspaces, workflows, runs, metrics)
- `frontend/` – SPA React (dashboard, páginas de workflows, etc.)
- `db/` – migrações SQL e `docker-compose.yml` para PostgreSQL
- `docs/` – documentação complementar (arquitetura, API)

## Como rodar localmente

1. Subir o Postgres:

   ```bash
   cd db
   docker compose up -d
   ```

2. Instalar dependências:

   ```bash
   cd ..
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Rodar backend e frontend (em dois terminais):

   ```bash
   cd backend
   npm run start:dev
   ```

   ```bash
   cd frontend
   npm run dev
   ```

Mais detalhes em `docs/ARCHITECTURE.md` e `docs/API.md`.

