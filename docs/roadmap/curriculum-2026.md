# Curriculum Roadmap (As of February 17, 2026)

This roadmap turns current durable-orchestration platform guidance into an educational sequence for this repository.

## External Pattern Research

Durable execution platform survey:
- [Durable Execution Platform Research (June 30, 2026)](./durable-execution-platform-research-2026-06-30.md)

### Azure Durable Functions pattern canon

Azure’s official Durable Functions documentation continues to frame a reusable set of orchestrator patterns that map well to this cookbook:
- Function chaining
- Fan-out/fan-in
- Async HTTP API
- Monitor
- Human interaction
- Aggregator (stateful entities)

Reference:
- [Azure Durable Functions overview (patterns)](https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-overview?tabs=in-process%2Cnodejs-v3%2Cv1-model)

Important platform timeline:
- Azure notes support for the in-process model ends on **November 10, 2026**; curriculum should prioritize isolated worker model guidance.

Reference:
- [Azure Durable Functions overview (support note)](https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-overview?tabs=in-process%2Cnodejs-v3%2Cv1-model)

### AWS Durable Functions capabilities and AI relevance

AWS Durable Functions (JavaScript/TypeScript) now documents primitive building blocks that align closely with our recipe style:
- `step`, `wait`, `waitForCallback`
- `parallel`, `map` for fan-out execution
- Child execution context and direct function invocation

References:
- [AWS Lambda durable functions for JavaScript](https://docs.aws.amazon.com/lambda/latest/dg/durable-functions-javascript.html)
- [AWS Lambda durable functions examples](https://docs.aws.amazon.com/lambda/latest/dg/durable-functions-example.html)
- [AWS Lambda durable functions API](https://docs.aws.amazon.com/lambda/latest/dg/durable-functions-api.html)

AWS explicitly positions durable execution for long-running and AI/agentic workflows in launch messaging and docs:
- [AWS Compute Blog announcement (Aug 13, 2025)](https://aws.amazon.com/blogs/compute/build-resilient-serverless-workflows-using-durable-execution-for-aws-lambda/)
- [AWS Durable Functions docs entry point](https://docs.aws.amazon.com/lambda/latest/dg/durable-functions.html)

For AI curriculum extensions, use AWS Bedrock orchestration docs as advanced modules:
- [Bedrock custom orchestrator examples](https://docs.aws.amazon.com/bedrock/latest/userguide/working-with-models-not-yet-optimized.html)
- [Bedrock Agents multi-agent collaboration](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-multi-agent-collaboration.html)
- [Bedrock AgentBuilder framework + durable integration blog](https://aws.amazon.com/blogs/machine-learning/build-production-ready-ai-agents-with-aws-serverless-and-the-open-source-strands-agents-sdk/)

### Temporal testing and determinism baseline

Temporal’s TypeScript testing suite and deterministic workflow model remain the reference for local durable testing quality:
- [Temporal TypeScript testing suite](https://docs.temporal.io/develop/typescript/testing-suite)
- [Temporal workflow determinism and replay model](https://docs.temporal.io/workflow-definition)

## Curriculum Organization

## Track 1: Durable Fundamentals
- Module 1: Workflow/Activity/Step mental model (Temporal vs AWS Durable vs Azure concepts)
- Module 2: Determinism rules and replay safety
- Module 3: Local harness setup, test lifecycle, and CI repeatability

## Track 2: Core Workflow Patterns
- Module 4: Scatter-gather basic
- Module 5: Quorum + timeout scatter-gather
- Module 6: Human-in-loop callback/wait patterns
- Module 7: Monitor and polling workflows

## Track 3: AI-Augmented Durability
- Module 8: AI completeness judge (deterministic fixture replay)
- Module 9: AI branching and partial completion policies
- Module 10: Tool-calling orchestration patterns with durable boundaries

## Track 4: Production and Platform
- Module 11: Error taxonomy, retries, compensation, idempotency
- Module 12: Observability and workflow forensics
- Module 13: Deployment tracks (Pulumi + runtime-specific infra)
- Module 14: Documentation UX via React Router v7 SSR tutorials app

## 2026 Roadmap

## Phase A: Scenario DSL + parity by construction (now)
- Add branchable Given/When/Then scenario DSL in `packages/test-kit`
- Keep parity validation inside shared scenario vectors, not a separate parity engine
- Expand durable scenario suite: determinism, failure classes, timeout edges, callback edges

## Phase B: Educational expansion
- Add `hello-world`, `human-callback`, `monitor-loop`, and `compensation` recipes
- Publish each recipe with:
  - intent
  - runtime mapping tables (Temporal/AWS/Azure equivalent concepts)
  - failure mode exercises

## Phase C: Platformization
- Add `infra/pulumi` starter stacks for:
  - Temporal self-host/dev
  - AWS Lambda durable deployment
- Stand up `apps/tutorials-web` for guided walkthroughs and runnable scenario catalogs

## Phase D: Advanced AI orchestration
- Add Bedrock-focused modules: single-agent, multi-agent, and durable checkpointing
- Add cost/latency/reliability trade-off labs
- Add policy/testing modules for AI decision determinism and guardrails

## Parity Checker Recommendation

For current scope, keep shared scenario suites in `test-kit` rather than introducing a dedicated parity-checker package.
- Pros:
  - lower maintenance overhead
  - clearer educational path
  - direct runtime harness ownership
- Trigger to add dedicated parity engine later:
  - more than 3 runtime adapters
  - scenario count grows enough that execution orchestration becomes repetitive
