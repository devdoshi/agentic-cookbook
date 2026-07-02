# Scatter Gather (Quorum + Timeout)

## Intent

Fan out tasks and stop when either:
- quorum is reached, or
- timeout budget is exhausted.

Returns partial output with status metadata (`partial` or `timeout`).

## Canonical UI Presets

Quorum win:

```json
{
  "workflowId": "ui-quorum-default",
  "mode": "quorum-timeout",
  "tasks": [
    { "id": "a", "payload": "alpha" },
    { "id": "b", "payload": "beta" },
    { "id": "c", "payload": "gamma" }
  ],
  "quorum": 2,
  "timeoutMs": 80
}
```

Timeout edge:

```json
{
  "workflowId": "ui-timeout-default",
  "mode": "quorum-timeout",
  "tasks": [
    { "id": "a", "payload": "alpha" },
    { "id": "b", "payload": "beta" },
    { "id": "c", "payload": "gamma" }
  ],
  "quorum": 3,
  "timeoutMs": 8
}
```

Run in tutorials UI:
- `/recipes/scatter-gather-quorum-timeout`

## Simulator Timeline and Trace Views

In the interactive page:
- Replay quorum and timeout transitions with `Play/Pause` and scrub controls.
- Inspect where terminal status was decided in normalized event rows.
- Use the runtime-native tab to compare adapter histories for the same run.

## Runtime Mapping

- Shared recipe: `scatterGatherQuorumTimeout`.
- Both harnesses use the same deterministic clock helper for parity tests.

## Runtime Caveat

Timeout timing in local tests is deterministic by design in this repository. The shared deterministic clock keeps cross-runtime semantics comparable for tutorial and scenario assertions.

## Local Tests

- Temporal: `pnpm --filter @agentic-cookbook/temporal-harness test`
- AWS Durable: `pnpm --filter @agentic-cookbook/aws-durable-harness test`
