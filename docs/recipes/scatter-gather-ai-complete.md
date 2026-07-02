# Scatter Gather (AI Completeness)

## Intent

Fan out tasks and evaluate whether enough evidence has arrived using an AI judge after each completion wave.

## Canonical UI Preset

```json
{
  "workflowId": "ui-ai-default",
  "mode": "ai-complete",
  "tasks": [
    { "id": "a", "payload": "alpha" },
    { "id": "b", "payload": "beta" },
    { "id": "c", "payload": "gamma" }
  ],
  "minimumJudgeScore": 0.9
}
```

Run in tutorials UI:
- `/recipes/scatter-gather-ai-complete`

## Simulator Timeline and Trace Views

After a run completes in the UI:
- Replay event flow with the timeline controls.
- Scrub to each judge decision cycle and inspect event payloads.
- Compare normalized events with runtime-native history and OTel span waterfall output.

## Runtime Mapping

- Shared recipe: `scatterGatherAiComplete` in `@agentic-cookbook/workflow-spec`.
- Judge implementation: `FixtureReplayJudge` from `@agentic-cookbook/ai-judge-fixtures`.
- Temporal: judge invoked through activity.
- AWS Durable: judge invoked via durable `context.step`.

## Runtime Caveat

The AI judge in this cookbook is deterministic fixture replay, not a live model call. That keeps parity tests stable across Temporal and AWS durable local harnesses while preserving the orchestration shape of AI-completeness gating.

## Local Tests

- Temporal: `pnpm --filter @agentic-cookbook/temporal-harness test`
- AWS Durable: `pnpm --filter @agentic-cookbook/aws-durable-harness test`
