-- Core tables for FlowForge: users, workspaces and membership

create table if not exists core_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free',
  created_by uuid not null references core_users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists core_workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references core_workspaces (id) on delete cascade,
  user_id uuid not null references core_users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists idx_core_workspace_members_workspace_id
  on core_workspace_members (workspace_id);

create index if not exists idx_core_workspace_members_user_id
  on core_workspace_members (user_id);

-- Flow domain: workflows and runs

create table if not exists flow_workflows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references core_workspaces (id) on delete cascade,
  name text not null,
  description text,
  version int not null default 1,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_by uuid not null references core_users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_flow_workflows_workspace_id
  on flow_workflows (workspace_id);

create table if not exists flow_workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references flow_workflows (id) on delete cascade,
  kind text not null check (kind in ('form', 'task', 'approval', 'wait')),
  title text not null,
  config jsonb not null default '{}'::jsonb,
  "order" int not null,
  created_at timestamptz not null default now(),
  unique (workflow_id, "order")
);

create index if not exists idx_flow_workflow_steps_workflow_id
  on flow_workflow_steps (workflow_id);

create table if not exists flow_workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references flow_workflows (id) on delete restrict,
  workspace_id uuid not null references core_workspaces (id) on delete cascade,
  started_by uuid not null references core_users (id) on delete restrict,
  status text not null default 'running' check (status in ('running', 'completed', 'failed', 'cancelled')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists idx_flow_workflow_runs_workspace_id
  on flow_workflow_runs (workspace_id);

create index if not exists idx_flow_workflow_runs_workflow_id
  on flow_workflow_runs (workflow_id);

create table if not exists flow_workflow_run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references flow_workflow_runs (id) on delete cascade,
  step_id uuid not null references flow_workflow_steps (id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'skipped', 'failed')),
  started_at timestamptz,
  finished_at timestamptz,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists idx_flow_workflow_run_steps_run_id
  on flow_workflow_run_steps (run_id);

create index if not exists idx_flow_workflow_run_steps_step_id
  on flow_workflow_run_steps (step_id);

create table if not exists flow_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references core_workspaces (id) on delete cascade,
  run_id uuid references flow_workflow_runs (id) on delete cascade,
  workflow_id uuid references flow_workflows (id) on delete cascade,
  user_id uuid references core_users (id) on delete set null,
  type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_flow_events_workspace_id
  on flow_events (workspace_id);

