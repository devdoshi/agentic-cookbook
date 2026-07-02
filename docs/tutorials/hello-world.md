# Hello World (Durable Workflow)

This walkthrough uses the existing scatter-gather recipes and harness adapters in this repository.

## Goal

Run one recipe interactively in both runtimes and compare final outcomes:
- Temporal TypeScript local harness
- AWS Durable local harness

## Run in Tutorials UI

1. Start the tutorials app:

```bash
pnpm --filter @agentic-cookbook/tutorials-web dev
```

2. Open the recipe playground:
- `/recipes/scatter-gather-basic`

3. In the UI:
- choose `Temporal`, run
- choose `AWS durable`, run
- compare `WorkflowOutcome` fields (`status`, `aggregate`, `completedTaskIds`, `reason`)

Expected baseline:
- both runtimes return `status: "complete"` for the default basic preset

## Run in Harness Tests

```bash
pnpm --filter @agentic-cookbook/temporal-harness test
pnpm --filter @agentic-cookbook/aws-durable-harness test
```

## Shared runtime semantics reference

Use this matrix while comparing behavior:
- [`docs/runtime/semantics-matrix.md`](../runtime/semantics-matrix.md)

In tutorials web, open:
- `/runtime/semantics`
