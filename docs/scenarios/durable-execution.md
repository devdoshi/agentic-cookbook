# Durable Execution Scenarios

The cookbook includes shared scenario classes used by both runtime harnesses.

Authoring reference:
- `docs/scenarios/scenario-authoring.md`
- Interactive runner: `/scenarios`

## Interactive Trace Replay

The `/scenarios` page now supports:
- selecting a scenario trace from the latest run,
- replaying its normalized timeline with play/scrub controls,
- toggling runtime-native history view,
- inspecting span waterfall details generated from in-memory OTel export.

## Scenario groups

- Recipe vectors: expected statuses for each recipe mode.
- Determinism scenarios: same input run twice should produce identical canonical outcomes.
- Error scenarios: duplicate IDs and task execution failures should fail consistently.

## Runtime caveat (Temporal duplicate-ID failures)

Duplicate task IDs fail at workflow validation time. In Temporal, this class of failure can behave differently from activity failures because it happens inside workflow execution rather than an activity boundary.

Current handling in this repository:
- Temporal workflow wrapper normalizes duplicate-ID validation to a non-retryable workflow failure.
- This keeps local harness tests bounded and makes duplicate-ID error scenarios safely testable across both runtimes.

Reference implementation:
- `/Users/local-admin/work/codex/agentic-cookbook/apps/temporal-harness/src/workflows/index.ts`

## Why scenarios over a dedicated parity checker package (for now)

A dedicated parity engine adds maintenance overhead early. Shared scenarios in `@agentic-cookbook/test-kit` provide most parity value while keeping examples readable for learners. We can add a dedicated parity package later if scenario count or runtime count grows significantly.
