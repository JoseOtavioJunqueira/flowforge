# API FlowForge (visão geral)

Esta é uma visão de alto nível dos principais endpoints planejados para o backend NestJS.

## Autenticação

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh` (planejado)

Tokens JWT carregam `sub` (user id) e `email`. O backend usará essas informações para montar o contexto de usuário e workspaces.

## Workspaces

- `GET /workspaces`
- `POST /workspaces`
- `PATCH /workspaces/:id`
- `DELETE /workspaces/:id`
- `POST /workspaces/:id/members`
- `PATCH /workspaces/:id/members/:userId`

O acesso é restringido por RLS no banco e por verificações adicionais de papel (`owner`, `admin`, `member`, `viewer`).

## Workflows

- `GET /workflows`
- `POST /workflows`
- `GET /workflows/:id`
- `PATCH /workflows/:id`
- `DELETE /workflows/:id`

Cada workflow pertence a um `workspace_id`. Usuários só enxergam workflows de workspaces em que são membros.

## Execuções (Runs)

- `POST /workflows/:id/run`
- `GET /runs`
- `GET /runs/:id`
- `POST /runs/:id/step/:stepId/complete`

Endpoints permitem iniciar execuções, avançar etapas e consultar linha do tempo de execução.

## Métricas

- `GET /metrics/workflows/summary`
- `GET /metrics/workspaces/usage`

Endpoints de métricas expõem estatísticas de uso por workspace e por workflow.

