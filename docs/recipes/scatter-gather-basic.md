# Scatter Gather (Basic)

## Intent

Fan out across N tasks, wait for all task results, and aggregate deterministically.

## Canonical UI Preset

```json
{
  "workflowId": "ui-basic-default",
  "mode": "basic",
  "tasks": [
    { "id": "a", "payload": "alpha" },
    { "id": "b", "payload": "beta" },
    { "id": "c", "payload": "gamma" }
  ]
}
```

Run in tutorials UI:
- `/recipes/scatter-gather-basic`

## Simulator Timeline and Trace Views

After clicking Run in the UI:
- Use the timeline `Play/Pause`, speed selector, and scrub slider to replay workflow progress.
- Switch between `Normalized timeline` and `Runtime-native history` tabs.
- Inspect normalized events and OTel spans in the event table and span waterfall.

## Runtime Mapping

- Temporal: workflow proxies `executeTask` activity and runs shared `scatterGatherBasic` recipe.
- AWS Durable: handler uses durable `context.step` executor and runs shared `scatterGatherBasic` recipe.

## Runtime Caveat

Basic-mode validation failures (for example, duplicate task IDs) can be surfaced differently by runtime adapters. The cookbook normalizes duplicate-ID failures in Temporal to a non-retryable workflow failure so this recipe remains bounded in local runs.

## Local Tests

- Temporal: `pnpm --filter @agentic-cookbook/temporal-harness test`
- AWS Durable: `pnpm --filter @agentic-cookbook/aws-durable-harness test`
