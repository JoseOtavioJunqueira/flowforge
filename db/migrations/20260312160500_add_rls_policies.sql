-- Helper functions to expose app user and workspace context via PostgreSQL settings.

create or replace function app_current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;

create or replace function app_current_workspace_ids()
returns uuid[]
language sql
stable
as $$
  select string_to_array(
    coalesce(nullif(current_setting('app.current_workspace_ids', true), ''), ''),
    ','
  )::uuid[];
$$;

-- Enable Row Level Security on workspace-scoped tables.

alter table if exists core_workspaces
  enable row level security;

alter table if exists core_workspace_members
  enable row level security;

alter table if exists flow_workflows
  enable row level security;

alter table if exists flow_workflow_runs
  enable row level security;

alter table if exists flow_events
  enable row level security;

-- Policies:
-- 1. Users can see workspaces where they are members.

create policy if not exists select_core_workspaces_by_membership
  on core_workspaces
  for select
  using (
    id = any (app_current_workspace_ids())
  );

-- Allow owners/admins to manage their workspaces.

create policy if not exists manage_core_workspaces_by_owner
  on core_workspaces
  for all
  using (
    id in (
      select m.workspace_id
      from core_workspace_members m
      where m.user_id = app_current_user_id()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    id in (
      select m.workspace_id
      from core_workspace_members m
      where m.user_id = app_current_user_id()
        and m.role in ('owner', 'admin')
    )
  );

-- Membership table: users can see and manage only memberships of their workspaces.

create policy if not exists select_core_workspace_members_by_workspace
  on core_workspace_members
  for select
  using (
    workspace_id = any (app_current_workspace_ids())
  );

create policy if not exists manage_core_workspace_members_by_admin
  on core_workspace_members
  for all
  using (
    workspace_id in (
      select m.workspace_id
      from core_workspace_members m
      where m.user_id = app_current_user_id()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    workspace_id in (
      select m.workspace_id
      from core_workspace_members m
      where m.user_id = app_current_user_id()
        and m.role in ('owner', 'admin')
    )
  );

-- Workflows: scoped by workspace membership.

create policy if not exists select_flow_workflows_by_workspace
  on flow_workflows
  for select
  using (
    workspace_id = any (app_current_workspace_ids())
  );

create policy if not exists manage_flow_workflows_by_admin
  on flow_workflows
  for all
  using (
    workspace_id in (
      select m.workspace_id
      from core_workspace_members m
      where m.user_id = app_current_user_id()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    workspace_id in (
      select m.workspace_id
      from core_workspace_members m
      where m.user_id = app_current_user_id()
        and m.role in ('owner', 'admin')
    )
  );

-- Runs and events: same idea, always tied to workspace.

create policy if not exists select_flow_workflow_runs_by_workspace
  on flow_workflow_runs
  for select
  using (
    workspace_id = any (app_current_workspace_ids())
  );

create policy if not exists manage_flow_workflow_runs_by_members
  on flow_workflow_runs
  for all
  using (
    workspace_id = any (app_current_workspace_ids())
  )
  with check (
    workspace_id = any (app_current_workspace_ids())
  );

create policy if not exists select_flow_events_by_workspace
  on flow_events
  for select
  using (
    workspace_id = any (app_current_workspace_ids())
  );

