# Tutorials Web App

React Router v7 framework-mode tutorial app with json-render server-driven UI specs.

## Local Run

```bash
pnpm --filter @agentic-cookbook/tutorials-web dev
```

Build + serve:

```bash
pnpm --filter @agentic-cookbook/tutorials-web build
pnpm --filter @agentic-cookbook/tutorials-web start
```

Course videos (one file per page, committed under `docs/videos`):

```bash
pnpm --filter @agentic-cookbook/tutorials-web videos:install
pnpm --filter @agentic-cookbook/tutorials-web videos:record
```

## Implemented Routes

- `/`
- `/getting-started`
- `/tutorials/hello-world`
- `/runtime/semantics`
- `/recipes/:slug`
- `/scenarios`
- `POST /api/workflow/run`
- `POST /api/scenario/run`

## SDUI Structure

- Catalog: `app/sdui/catalog.ts`
- Registry: `app/sdui/registry.tsx`
- Builders: `app/sdui/builders/*`

## Runtime Integration

Interactive execution uses in-process adapters exported from harness packages:
- `@agentic-cookbook/temporal-harness`
- `@agentic-cookbook/aws-durable-harness`

Both routes and tests call shared runtime wrappers so behavior stays aligned.

Simulator pages now include:
- animated timeline playback (play/pause, speed, scrub),
- normalized event table and OTel span waterfall,
- runtime-native history tab for Temporal and AWS durable runs.

Server handlers keep endpoint compatibility (`/api/workflow/run`, `/api/scenario/run`) while delegating to in-memory tRPC callers.
