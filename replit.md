# Collaboration Builder

A full-stack no-code multi-agent workflow platform based on the "From Dialog to Collaboration" ebook (Trilogi Buku II). Users create workrooms from sector templates, orchestrate AI agents (Strategis/Skeptis/Eksekutor), and advance through an 8-stage pipeline with human gate checkpoints.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/collaboration-builder run dev` — run the frontend (port 23244, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080, base path `/api`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Frontend: React + Vite + Wouter + TanStack Query + shadcn/ui
- Build: esbuild (CJS bundle for server)

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM schema files (templates, agents, workrooms)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas used in route validation
- `artifacts/api-server/src/routes/` — Express route handlers (templates, agents, workrooms)
- `artifacts/collaboration-builder/src/pages/` — React page components

## Architecture decisions

- **Contract-first API**: OpenAPI spec drives both server Zod validation and React Query client hooks via Orval codegen. Run codegen after any spec change.
- **8-stage fixed pipeline**: Every workroom gets exactly 8 stages (Intake → Framing → Skeptic Gate → Blueprint → Delivery → QA Gate → Release → Retro) created automatically on workroom creation. Gates are `stageType: "gate"` requiring human approval.
- **Generated mutations wrap body in `{ data: ... }`**: All Orval-generated mutation hooks expect `{ data: InputType }` not the raw input. This is the Orval default behavior for `customFetch`.
- **Agents are a registry**: Agents are stored in DB and assigned to tasks by `functionRole` (strategis/skeptis/eksekutor/narasumber/pack_compiler). No live AI calls yet — the platform manages orchestration state only.
- **Dynamic agent import in dashboard route**: The `agentsTable` is dynamically imported inside the dashboard summary handler to avoid circular dependency issues at bundle time.

## Product

- **Dashboard** (`/`) — Mission Control: KPI stats, recent workrooms, status distribution
- **Workrooms** (`/workrooms`) — List all pipelines with search/filter
- **Workroom Detail** (`/workrooms/:id`) — Full 8-stage pipeline view with task management, gate decision panel, and activity log
- **New Workroom** (`/workrooms/new`) — 2-step wizard: pick template → configure name/objective
- **Templates** (`/templates`) — Sector-grouped template browser with "Use Template" shortcut
- **Agents** (`/agents`) — Agent registry with role badges, category grouping, and live search

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`, then restart the API server workflow.
- `pnpm --filter @workspace/db run push` for schema changes — do not run in production.
- The frontend uses `BASE_URL` from Vite's env for the Wouter router base. Never use root-relative API paths in application code.
- Orval generates mutations as `mutateAsync({ data: InputType })` — always wrap the request body in `{ data: ... }`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
