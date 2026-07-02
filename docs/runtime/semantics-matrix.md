# Runtime Semantics Matrix

This page defines the shared semantics language used across tutorials and scenario tests.

## Matrix

| Concern | Temporal TypeScript local harness | AWS Durable Lambdas local harness | Tutorial stance |
| --- | --- | --- | --- |
| Determinism | Workflow code must stay replay-safe. | Handler execution is replayed by durable runtime; deterministic logic still required. | Keep orchestration logic pure and side-effect free. |
| Task retries | Activity retries are explicit and configurable. | Step retries use durable runtime behavior and SDK controls. | Treat retries as policy, not business logic. |
| Validation failures | Validation in workflow body can fail workflow task; mark as non-retryable when needed. | Validation errors typically surface as failed durable execution with terminal status. | Normalize messages in adapters; assert canonical error substrings. |
| Timeouts | Workflow timers and activity timeouts are explicit constructs. | Durable time progression is orchestrator-driven in test runner. | Validate timeout status in shared scenario vectors. |
| Partial completion | Return explicit `partial` outcomes when quorum/timeout stops fan-in early. | Same target semantics; adapter maps to durable response payload. | Compare canonical `WorkflowOutcome` shape in both runtimes. |

## Current caveat tracked in this repo

Duplicate task IDs are a validation-time workflow failure. In Temporal, that can keep generating workflow task failures unless wrapped as non-retryable.

Reference implementation:
- `/Users/local-admin/work/codex/agentic-cookbook/apps/temporal-harness/src/workflows/index.ts`

## How tutorials should use this page

- Getting Started should link this matrix before users run parity scenarios.
- Hello World should call out which rows are demonstrated and which are deferred to recipe chapters.
