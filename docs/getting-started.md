# Getting Started

This repo is a durable execution comparison lab for agentic workflow patterns.

Start with recipes and scenarios, not the infrastructure:

1. Run a recipe in Temporal.
2. Run the same recipe in the AWS Durable Task-style local harness.
3. Compare the outcome, normalized trace, spans, and runtime-native history.
4. Run scenario suites to check behavior across runtimes.

## Prerequisites

If you use GitHub Codespaces or another Dev Container host, there are no local prerequisites.

Open the repo in Codespaces, wait for setup, then open the forwarded `5173` port. The demo server starts automatically.

For all supported cloud/container paths, see:
- [`runnable-workspaces.md`](runnable-workspaces.md)

For local development without a container:

- Node 22+
- pnpm 10.5.2

## Install

```bash
pnpm install
```

## Run all checks

```bash
pnpm check
```

## Run harnesses directly

```bash
pnpm run test:durable
pnpm run test:temporal
```

## Run tutorials UI locally

```bash
pnpm demo
```

Then open `http://localhost:5173`.

First clicks:
- Open `/recipes/scatter-gather-basic`.
- Run with `temporal`.
- Switch to `aws-durable` and run again.
- Open `/scenarios` and run `recipe-vectors` for both runtimes.

Key routes:
- `/recipes/scatter-gather-basic`
- `/recipes/scatter-gather-ai-complete`
- `/recipes/scatter-gather-quorum-timeout`
- `/scenarios`

## Runtime caveats first

Before parity scenario work, read the shared runtime matrix:
- [`docs/runtime/semantics-matrix.md`](runtime/semantics-matrix.md)

When tutorials web is running, the same content is available at:
- `/runtime/semantics`

## Optional Temporal server wiring

The Temporal test suite supports either:
- an ephemeral local Temporal server (`createLocal`) by default, or
- an existing Temporal server via `TEMPORAL_ADDRESS`.

Example:

```bash
TEMPORAL_ADDRESS=127.0.0.1:7233 pnpm run test:temporal
```
