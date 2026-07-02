# Durable Execution Platform Research (As of June 30, 2026)

This note surveys durable execution platforms adjacent to the current cookbook
targets:

- Temporal TypeScript local harness
- AWS Lambda durable functions local harness

The goal is not to list every workflow engine. It is to identify platforms that
teach meaningfully different durable execution semantics and assess whether
additional implementations should be added to this repository.

## Recommendation summary

| Priority | Platform | Recommendation | Why |
| --- | --- | --- | --- |
| 1 | DBOS TypeScript | Add as the next implementation candidate. | Strong TypeScript fit, ordinary function/step model, Vitest-friendly testing story, and distinct Postgres-backed durability. |
| 2 | Cloudflare Workflows | Add as an edge/serverless comparison track after DBOS. | Strong current momentum, local Wrangler emulation, AI-agent positioning, and useful contrast with Lambda durable functions. |
| 3 | Rivet Actors / Workflows | Build a spike after DBOS/Cloudflare or alongside Restate. | Strong AI-agent/stateful-actor positioning, local library workflow, and useful contrast with Cloudflare Durable Objects. |
| 4 | Restate | Build a spike before committing. | Excellent durable execution semantics, but requires a Restate server/Testcontainers dependency that may complicate the beginner path. |
| 5 | Azure Durable Functions | Document as a concept mapping first. | Canonical durable pattern vocabulary, but adding an Azure Functions app increases runtime surface and non-Node conventions. |
| 6 | Inngest | Keep as provider comparison or optional lab. | Good event-driven durable workflow DX, but a first-class harness would likely depend on hosted/dev-server behavior outside this repo's current local shape. |
| 7 | Trigger.dev | Keep as AI-background-job comparison or optional lab. | Strong AI task positioning and checkpointing, but the platform is more task/deployment oriented than local runtime parity oriented. |
| 8 | Hatchet | Revisit later. | Durable task/DAG model is relevant, but V1 docs and APIs are moving quickly. |
| 9 | AWS Step Functions / Google Workflows | Do not add as runtime parity targets. | Useful production comparisons, but they are workflow-service/state-machine products rather than code-first durable execution harnesses. |

## Evaluation criteria for this repo

- Can the runtime express the existing scatter-gather recipes without changing
  `@agentic-cookbook/workflow-spec`?
- Can tests run locally in CI without cloud credentials?
- Does the platform add a new durable execution lesson, not just another syntax?
- Can normalized traces and canonical outcomes be adapted into the existing
  scenario model?
- Is the implementation cost proportional to its educational value?

## Recent content since repo creation

This repository's first commit was on February 17, 2026. The following posts,
docs, and changelogs were published after that date and are relevant to the
runtime roadmap.

### Temporal

Temporal has accelerated its AI-agent and production-operations positioning
since this repo was created.

- [Building AI agents that overcome the complexity cliff](https://temporal.io/blog/building-ai-agents-that-overcome-the-complexity-cliff)
  (March 10, 2026): Frames durable execution as necessary for long, expensive
  agent runs and replay-powered experimentation.
- [GA for Worker Versioning and Public Preview for Upgrade on Continue-as-New](https://temporal.io/blog/ga-worker-versioning-public-preview-upgrade-on-continue-as-new)
  (March 25, 2026): Makes long-running workflow upgrades a first-class platform
  topic. This matters if the cookbook adds entity-style workflows or persistent
  agents.
- [From agent zoo to agent orchestra](https://temporal.io/blog/from-agent-zoo-to-agent-orchestra-temporal-agentic-control-plane)
  (April 23, 2026): Positions Temporal as an enterprise control plane for
  conversational, ambient, event-streaming, and multi-agent systems.
- [Keep Business Processes Moving by Recovering Failed Steps Without Restarting](https://temporal.io/blog/keep-business-processes-moving)
  (May 11, 2026): TypeScript-oriented pattern for pausing on non-retryable
  failure, correcting data, and resuming without losing completed work.
- [Replay 2026 product announcements](https://temporal.io/blog/replay-2026-product-announcements)
  (May 6, 2026): Announced Serverless Workers, Standalone Activities, Workflow
  Streams, External Payload Storage, Google ADK integration, OpenAI Agents SDK
  integration, and expanded governance/observability features.
- [How to build deep research agents using Temporal and Braintrust](https://temporal.io/blog/how-to-build-deep-research-agents-using-temporal-and-braintrust)
  (June 3, 2026): Relevant to this repo's AI fixture/judge story because it
  combines durable runs with agent evaluation/observability.
- [Coordinate access to shared resources with a distributed lock built on Temporal Workflows](https://temporal.io/blog/coordinate-access-to-shared-resources-with-a-distributed-lock-built-on-temporal-workflows)
  (June 11, 2026): Useful if the cookbook adds coordination recipes beyond
  scatter-gather.
- [How we built it: Running Replay on Temporal](https://temporal.io/blog/how-we-built-it-running-replay-on-temporal)
  (June 24, 2026): Practical TypeScript example of Temporal as a production
  event and registration system.
- [Timers, Timeouts, and the Art of Waiting in Temporal](https://temporal.io/blog/timers-timeouts-and-the-art-of-waiting-in-temporal)
  (June 30, 2026): Directly relevant to the repo's timeout semantics matrix and
  curriculum language.

Implication for this repo:

- Keep Temporal as the determinism and local testing baseline.
- Add examples that cover long-lived workflow upgrade/versioning, human
  correction/resume, streaming progress, and shared-resource coordination before
  adding too many new runtime adapters.

### AWS Lambda durable functions

AWS has published several post-launch durable-function examples and docs since
February 17, 2026.

- [Best practices for Lambda durable functions using a fraud detection example](https://aws.amazon.com/blogs/compute/best-practices-for-lambda-durable-functions-using-a-fraud-detection-example/)
  (March 23, 2026): Covers idempotency, parallel verification, callback
  timeouts, and human-in-the-loop workflows.
- [Build reliable voice analytics workflows with AWS Lambda durable functions and Amazon Bedrock](https://aws.amazon.com/blogs/compute/build-reliable-voice-analytics-workflows-with-aws-lambda-durable-functions-and-amazon-bedrock/)
  (June 25, 2026): Shows Bedrock-backed multi-step AI analysis using durable
  functions.
- [Building fault-tolerant multi-agent AI workflows with AWS Lambda durable functions](https://aws.amazon.com/blogs/compute/building-fault-tolerant-multi-agent-ai-workflows-with-aws-lambda-durable-functions/)
  (June 29, 2026): Coordinates multiple AI agents, human review, callback waits,
  polling, and idempotent external submission.
- [Durable execution SDK docs](https://docs.aws.amazon.com/lambda/latest/dg/durable-execution-sdk.html)
  (checked June 30, 2026): Now explicitly lists JavaScript, TypeScript, Python,
  and Java SDK support and documents operation payload accounting.
- [Event source mappings with durable functions](https://docs.aws.amazon.com/lambda/latest/dg/durable-invoking-esm.html)
  (checked June 30, 2026): Important caveat: synchronous event source mapping
  invocations are subject to a 15-minute total durable execution limit unless an
  intermediary async invocation pattern is used.

Implication for this repo:

- Expand the AWS harness docs with callback timeout, parallel completion, and
  event-source-mapping caveats.
- Consider adding an AWS-specific scenario for idempotent external submissions
  and callback timeouts.

### DBOS

DBOS has shipped a steady stream of workflow operations, AI-agent integration,
and database-backed durability content.

- [DBOS Product Enhancements - March 2026](https://www.dbos.dev/blog/dbos-new-features-march-2026)
  (March 3, 2026): Added workflow patching, lineage tracking, dynamic workflow
  scheduling, self-hosted Conductor, MCP-based workflow troubleshooting, and AI
  integrations.
- [Building Durable Agents with DBOS and Databricks](https://www.dbos.dev/blog/building-durable-agents-dbos-databricks)
  (April 7, 2026): Positions DBOS with Databricks Lakebase for reliable,
  reproducible, observable AI agents.
- [DBOS Enhancements - April 2026](https://www.dbos.dev/blog/dbos-new-features-april-2026)
  (April 13, 2026): Added cross-language workflow interoperation, persisted app
  versions, Postgres UDF/trigger workflow enqueueing, durable concurrency
  primitives, delay scheduling, and improved fork capabilities.
- [GOTO Considered Harmful: Why Event-Driven is a Poor Architecture](https://www.dbos.dev/blog/goto-considered-harmful-2026)
  (April 29, 2026): Argues for durable workflow architecture over event-driven
  decomposition for stateful, failure-prone AI agents.
- [What's New in DBOS - May 2026](https://www.dbos.dev/blog/new-in-dbos-may-2026)
  (May 20, 2026): Adds timeline visualization, dynamic queue configuration, and
  published scale/performance claims for Postgres-backed workflows.
- [What's New in DBOS - June 2026](https://www.dbos.dev/blog/new-in-dbos-june-2026)
  (June 18, 2026): Adds OpenMetrics/observability improvements, RBAC, bulk
  workflow forking, and Google ADK integration.

Implication for this repo:

- DBOS remains the best next runtime spike, but the spike should include
  observability/forking/versioning notes, not only happy-path recipe execution.
- The DBOS MCP/forking story is especially relevant to agent-assisted debugging
  and could become a tutorial topic.

### Cloudflare

Cloudflare has moved Workflows and Agents SDK content aggressively toward
production agent infrastructure.

- [How we use ASTs to turn Workflows code into visual diagrams](https://blog.cloudflare.com/workflow-diagrams/)
  (March 27, 2026): Workflows diagrams are derived from code using ASTs, useful
  for tutorial trace visualization comparisons.
- [Rearchitecting the Workflows control plane for the agentic era](https://blog.cloudflare.com/workflows-v2/)
  (April 15, 2026): Raises concurrency and creation-rate limits and explicitly
  frames Workflows as durable harnesses for agents.
- [Project Think: building the next generation of AI agents on Cloudflare](https://blog.cloudflare.com/project-think/)
  (April 15, 2026): Introduces Cloudflare's agent harness direction, built on
  Workers, Durable Objects, storage, and execution primitives.
- [Introducing Dynamic Workflows](https://blog.cloudflare.com/dynamic-workflows/)
  (May 1, 2026): Allows tenant/customer/agent-authored workflow code to be run
  as Cloudflare Workflows through dynamic routing.
- [Bringing more agent harnesses and frameworks to Cloudflare, starting with Flue](https://blog.cloudflare.com/agents-platform-flue-sdk/)
  (June 17, 2026): Positions durable execution, dynamic code execution, durable
  filesystem, and dynamic workflows as a base layer for agent harnesses.

Implication for this repo:

- Cloudflare Workflows should stay high priority, especially if the curriculum
  adds edge-hosted agents, dynamic workflows, or visual trace/diagram exercises.
- A Cloudflare spike should explicitly compare Workflows with Durable Objects and
  Rivet Actors rather than treating Cloudflare as only another workflow runtime.

### Rivet

Rivet's changelog since February 17, 2026 makes it a more serious candidate than
a generic competitor note.

- [Rivet blog/changelog](https://rivet.dev/blog/) entries after February 17,
  2026 include:
  - February 24: Rivet Workflows for durable, replayable TypeScript workflows
    with sleep, join, race, retry, rollback, and human-in-the-loop integration.
  - February 25: Actor queues with durable, ordered, programmable run handlers.
  - February 26: SQLite for Rivet Actors.
  - April 4: agentOS for lightweight agent VMs.
  - June 15: Rivet 2.3 with actor lifecycle improvements.
  - June 16-17: Effect SDK, Rust SDK, and Rivet Compute.
  - June 25: agentOS v0.2.

Implication for this repo:

- Rivet should remain a serious spike candidate for the "durable actor / agent
  runtime" track.
- Because the product surface is moving quickly, implement only a narrow local
  spike before committing to a full harness.

### Restate

Recent Restate content emphasizes agent observability, versioning, and durable
control operations.

- [Updating AI Agents safely in production](https://www.restate.dev/blog/dealing-with-versioning-in-long-running-agents)
  (March 11, 2026): Explains deployment-pinned executions and durable replay for
  long-running agents.
- [Restate blog index](https://restate.dev/blog) lists additional post-February
  items including Pydantic AI integration (April 2), Langfuse integration
  (April 9), checkpointing-vs-resiliency guidance (June 15), and Arize Phoenix
  observability integration (June 25).

Implication for this repo:

- Restate remains a good spike if the curriculum needs durable services,
  version-pinned agent execution, and operational control over running requests.
- Its recent content strengthens the case for evaluating observability and
  invocation control, not just step replay.

### Inngest

Inngest has published several pieces that frame durable execution as AI-agent
infrastructure.

- [Durable Execution: The Key to Harnessing AI Agents in Production](https://www.inngest.com/blog/durable-execution-key-to-harnessing-ai-agents)
  (February 19, 2026): Argues that AI agents drove durable execution into
  broader adoption and emphasizes HITL, tool reliability, and latency.
- [Eliminating latency in AI workflows](https://www.inngest.com/blog/eliminating-latency-ai-workflows)
  (February 25, 2026): Useful critique of inter-step latency and over-decomposed
  workflow steps.
- [How to Build a Durable AI Agent with Inngest](https://www.inngest.com/blog/ai-agents-inngest-durable-steps)
  (March 17, 2026): TypeScript agent-loop walkthrough with durable tool
  execution, observability, and sub-agent delegation.
- [AI in Production: The 2026 Benchmark Report](https://www.inngest.com/blog/ai-in-production-report-2026)
  (May 5, 2026): Survey content useful for curriculum motivation around
  reliability, observability, and scale confidence.

Implication for this repo:

- Inngest is useful for teaching event-driven agent workflows and latency
  tradeoffs.
- It remains lower priority than DBOS/Cloudflare/Rivet/Restate for a local
  parity harness because the repo's current model is deterministic, input/output
  scenario execution rather than event-driven hosted functions.

### Trigger.dev and Hatchet

Recent Trigger.dev content is agent-infrastructure adjacent, but less directly
about new durable execution semantics since this repo was created.

- [Skills: teaching AI agents to act consistently](https://trigger.dev/blog/skills)
  (February 4, 2026) predates the repo, but is relevant background for agent
  reliability.
- Trigger.dev's blog navigation shows later 2026 posts around Cal.com durable
  async fan-out tasks, Claude Code workflows, Bun throughput, ClickHouse
  analytics, and compliance; these are useful for product comparison but do not
  materially change the harness recommendation yet.
- [Hatchet blog](https://hatchet.run/blog/) shows only one post after this repo's
  creation date in the visible list, [Supertoast tables](https://hatchet.run/blog/supertoast-tables)
  (March 6, 2026), which is not primarily a durable execution product update.

Implication for this repo:

- Keep Trigger.dev and Hatchet in the watchlist.
- Do not prioritize them for runnable parity until there is a clearer local
  testing story or a new durable-semantics feature worth teaching.

## Platform notes

### DBOS TypeScript

Primary sources:

- [DBOS TypeScript workflows](https://docs.dbos.dev/typescript/tutorials/workflow-tutorial)
- [DBOS architecture](https://docs.dbos.dev/architecture)
- [DBOS TypeScript testing and mocking](https://docs.dbos.dev/typescript/tutorials/testing)
- [DBOS workflow upgrades](https://docs.dbos.dev/typescript/tutorials/upgrading-workflows)

Model:

- DBOS workflows are ordinary TypeScript or JavaScript functions composed of
  durable steps.
- The runtime checkpoints workflow and step state into Postgres.
- On restart, DBOS resumes from the last completed step.
- DBOS supports workflow handles, workflow IDs, communication primitives,
  scheduling, queues, and workflow versioning/patching.

Fit for this repository:

- High. The cookbook already uses TypeScript, Vitest, shared ports, and simple
  function-shaped recipes.
- The Postgres checkpointing architecture would teach a materially different
  durability model from Temporal's service history and Lambda's checkpoint/replay
  managed runtime.
- DBOS testing docs explicitly discuss JavaScript/TypeScript test frameworks,
  including Vitest-style workflow testing.

Implementation feasibility:

- Feasible as `apps/dbos-harness`.
- Requires deciding how CI should provide Postgres. Options:
  - Docker Compose/Testcontainers for integration tests.
  - A fast unit layer that mocks steps plus an opt-in integration layer.
- The likely adapter shape is:
  - workflow wrapper around `runScatterGather*`
  - DBOS steps for task execution and AI fixture judgment
  - test runner that starts DBOS against disposable Postgres
  - normalized trace adapter from DBOS workflow/step metadata where available

Utility:

- High. DBOS is the clearest next addition because it broadens the cookbook from
  "workflow service" and "cloud function checkpointing" into "application library
  plus database-backed durability."

Risks:

- Postgres lifecycle can make local setup heavier.
- DBOS decorators/configuration may require package-level TypeScript settings
  that differ from the current harnesses.

Recommendation:

- Add a DBOS spike first, then promote it to a supported harness if it can pass
  the shared scenario vectors locally with one command.

### Cloudflare Workflows

Primary sources:

- [Cloudflare Workflows overview](https://developers.cloudflare.com/workflows/)
- [Cloudflare Workflows local development](https://developers.cloudflare.com/workflows/build/local-development/)
- [Cloudflare Workflows durable agent guide](https://developers.cloudflare.com/workflows/get-started/durable-agents/)
- [Cloudflare Workflows limits](https://developers.cloudflare.com/workflows/reference/limits/)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)

Model:

- Workflows run durable, multi-step applications on Cloudflare Workers.
- Steps can retry, persist state, sleep, wait, and coordinate with external
  systems.
- Wrangler provides local emulation for Workflows and lifecycle commands.
- Durable Objects remain a related Cloudflare primitive for strongly consistent
  stateful coordination, but Workflows are the closer durable execution target.

Fit for this repository:

- Medium-high. Cloudflare Workflows are TypeScript-friendly and locally emulated
  through Wrangler, but the runtime environment is Workers rather than Node.
- The edge/serverless environment would teach constraints that Temporal, AWS
  Lambda durable functions, and DBOS do not.

Implementation feasibility:

- Feasible as `apps/cloudflare-workflows-harness`, but likely needs different
  build/test plumbing:
  - Wrangler config
  - Workers-compatible module entrypoint
  - compatibility date management
  - local workflow triggering through Wrangler commands or Workers test helpers
- Existing shared business logic may need audit for Node-only APIs before it can
  run inside Workers.

Utility:

- High for curriculum. Cloudflare gives a strong "edge durable execution" story,
  plus current AI-agent documentation that aligns with this repo's agentic
  positioning.

Risks:

- Local emulation may not expose the same test ergonomics as Temporal's test
  environment or AWS's durable testing SDK.
- Workers runtime constraints may force polyfills or refactors in shared packages.

Recommendation:

- Add after DBOS, or run a short spike in parallel focused on one recipe vector.
- Prefer Workflows over building directly on Durable Objects for this cookbook.
  Durable Objects are important context, but Workflows map more directly to
  durable multi-step recipe execution.

### Rivet Actors / Workflows

Primary sources:

- [rivet-dev GitHub organization](https://github.com/rivet-dev)
- [rivet-dev/rivet repository](https://github.com/rivet-dev/rivet)
- [Rivet Actors](https://rivet.dev/actors/)
- [Rivet Workflows](https://rivet.dev/docs/actors/workflows/)
- [Rivet homepage](https://rivet.dev/)

Model:

- Rivet Actors are long-running, lightweight processes for stateful workloads,
  including AI agents, collaborative apps, realtime systems, and durable
  execution.
- Actor state lives in memory while active and is persisted automatically; actors
  can hibernate when idle and resume later.
- Rivet Workflows provide durable, replayable run handlers inside actors, with
  steps, queue waits, timers, rollback, retries, and human-in-the-loop style
  pauses.
- Rivet positions the developer experience as standard Node.js, Bun, or Deno,
  with local library development and optional Rivet Cloud/VPC deployment.

Fit for this repository:

- Medium-high. Rivet is TypeScript-friendly and highly aligned with the repo's
  agentic framing.
- It adds a useful new category: durable stateful actors with workflow behavior,
  rather than a pure workflow engine or serverless function checkpointing model.
- It is especially relevant as a comparison point to Cloudflare Durable Objects:
  both use actor-like stateful compute ideas, but Rivet explicitly packages
  actors, queues, scheduling, workflows, realtime, and agent use cases together.

Implementation feasibility:

- Feasible as `apps/rivet-harness` if local RivetKit workflows can be driven
  cleanly from Vitest.
- The likely adapter shape is:
  - one actor per workflow run or scenario execution
  - actor workflow/run handler for scatter-gather orchestration
  - actor queue messages for human-callback or event-driven extensions
  - normalized outcome adapter from workflow step state and actor events
- A spike should validate:
  - whether the current `workflow-spec` package is runtime-compatible without
    Node-only assumptions
  - whether workflow state and step history are inspectable enough for tutorial
    traces
  - whether local execution is deterministic and isolated enough for CI

Utility:

- High for future agent-centric curriculum because Rivet directly targets
  long-lived agents, realtime interaction, durable queues, scheduling, and
  workflow progress inspection.
- Medium for the current scatter-gather-only recipe set because the actor model
  may be more powerful than the initial examples need.

Risks:

- Product/API surface appears to be moving quickly, with active GitHub
  development and recent workflow/queue feature releases.
- The actor-first model may require a different scenario lifecycle than the
  existing request/response harnesses.
- Workflow semantics should be tested carefully against the cookbook's
  determinism and canonical outcome expectations before promotion.

Recommendation:

- Track as a serious implementation candidate, not just a competitor note.
- Do a small spike after DBOS and Cloudflare, or alongside Restate if the
  curriculum prioritizes stateful agents over pure workflow parity.
- If promoted, position Rivet as the "durable actor / agent runtime" track
  rather than another Temporal-style workflow adapter.

### Restate

Primary sources:

- [Restate key concepts](https://docs.restate.dev/foundations/key-concepts)
- [Restate workflows](https://docs.restate.dev/tour/workflows)
- [Restate TypeScript durable steps](https://docs.restate.dev/develop/ts/durable-steps)
- [Restate TypeScript testing](https://docs.restate.dev/develop/ts/testing)
- [Restate AI parallelization pattern](https://docs.restate.dev/ai/patterns/parallelization)

Model:

- Restate provides durable execution, durable promises, service invocation,
  virtual objects, and durable state.
- Handlers use a Restate context for durable actions such as `ctx.run`, sleep,
  promises, and service calls.
- Replay is driven by a persisted action log managed by Restate Server.

Fit for this repository:

- Medium-high. Restate's TypeScript SDK and deterministic replay model align
  well with the existing semantics matrix.
- Its virtual objects and durable promises would expand the cookbook beyond pure
  workflow runs into durable coordination and stateful actors.

Implementation feasibility:

- Feasible, but more infrastructure-heavy than DBOS.
- The official TypeScript testing path uses `@restatedev/restate-sdk-testcontainers`,
  which means Docker/Testcontainers in CI.

Utility:

- High if the repo wants to teach durable services and stateful coordination, not
  just linear workflow execution.

Risks:

- Testcontainers may make contributor setup slower.
- The app shape may look less like the current harnesses because Restate is both
  a server/proxy and an SDK model.

Recommendation:

- Build a spike only after DBOS. Promote if the scenario adapter is clean and
  Docker-based tests are acceptable.

### Azure Durable Functions

Primary sources:

- [Azure Durable Functions overview](https://learn.microsoft.com/en-us/azure/durable-task/durable-functions/durable-functions-overview)
- [Durable orchestration overview](https://learn.microsoft.com/en-us/azure/durable-task/common/durable-task-orchestrations)
- [Durable Task programming model](https://learn.microsoft.com/en-us/azure/durable-task/common/programming-model-overview)

Model:

- Azure Durable Functions provides orchestrator, activity, entity, and client
  functions.
- It manages state, checkpoints, retries, and recovery for long-running
  serverless workflows.
- The Azure pattern canon remains useful: function chaining, fan-out/fan-in,
  monitor, async HTTP APIs, human interaction, and aggregators.

Fit for this repository:

- Medium. Conceptually excellent, but runtime integration would introduce Azure
  Functions hosting conventions and likely a different local emulator story.

Implementation feasibility:

- Possible, but not the next best use of effort.
- A docs-only mapping gives most of the educational value at lower maintenance
  cost.

Utility:

- High as reference vocabulary and pattern taxonomy.
- Medium as a runnable implementation unless the repo explicitly wants Azure
  deployment coverage.

Recommendation:

- Expand docs and recipe concept tables before adding an Azure harness.

### Inngest

Primary sources:

- [Inngest docs](https://www.inngest.com/docs)
- [How Inngest functions execute](https://www.inngest.com/docs/learn/how-functions-are-executed)
- [Inngest functions](https://www.inngest.com/docs/learn/inngest-functions)
- [Inngest steps](https://www.inngest.com/docs/learn/inngest-steps)

Model:

- Inngest is an event-driven durable execution platform.
- Functions are durable, retriable background logic triggered by events, cron, or
  webhooks.
- Steps provide checkpointed, retriable units of work, sleeps, and observability.

Fit for this repository:

- Medium. Inngest maps well to event-driven agent workflows, but less directly
  to the repo's current "same input, same canonical workflow result" harness
  model.

Implementation feasibility:

- Possible as an optional app or lab.
- A first-class harness would need a reliable local dev-server strategy and
  event triggering/inspection glue.

Utility:

- Medium-high for agentic/event-driven background jobs.
- Lower for core runtime parity than DBOS, Cloudflare, or Restate.

Recommendation:

- Keep in the platform comparison for now. Revisit when the curriculum adds
  event coordination or user-defined workflow modules.

### Trigger.dev

Primary sources:

- [Trigger.dev introduction](https://trigger.dev/docs/introduction)
- [Trigger.dev how it works](https://trigger.dev/docs/how-it-works)
- [Trigger.dev task triggering](https://trigger.dev/docs/triggering)
- [Trigger.dev wait primitives](https://trigger.dev/docs/wait)
- [Trigger.dev OpenAI Agents SDK playground](https://trigger.dev/docs/guides/example-projects/openai-agents-sdk-typescript-playground)

Model:

- Trigger.dev is an open-source background jobs framework and managed platform
  for reliable workflows in plain async code.
- It emphasizes long-running AI tasks, retries, queues, checkpoint/resume,
  observability, waits, and real-time task state.

Fit for this repository:

- Medium. Trigger.dev is very relevant to AI-agent durability, but its natural
  teaching unit is a deployed or managed task run rather than a local parity
  harness.

Implementation feasibility:

- Possible as an integration tutorial, not ideal as the next shared scenario
  runtime.
- The strongest use would be an "AI background task durability" module rather
  than a replacement for Temporal/AWS-style workflow tests.

Utility:

- High for AI product workflows.
- Medium for teaching low-level replay semantics.

Recommendation:

- Document and potentially add a tutorial integration later. Do not add as the
  next runtime adapter.

### Hatchet

Primary sources:

- [Hatchet docs](https://docs.hatchet.run/)
- [Hatchet durable execution](https://docs.hatchet.run/v1/durable-execution)
- [Hatchet durable tasks](https://docs.hatchet.run/v1/durable-tasks)
- [Hatchet DAGs as durable workflows](https://docs.hatchet.run/v1/directed-acyclic-graphs)
- [Hatchet durable tasks vs DAGs](https://docs.hatchet.run/cookbooks/durable-tasks-vs-dags)

Model:

- Hatchet combines workers, tasks, DAG workflows, durable tasks, sleeps, waits,
  and child task spawning.
- Durable tasks checkpoint on durable operations and must remain deterministic
  around the durable context.

Fit for this repository:

- Medium. Hatchet is relevant because it distinguishes DAG workflows from
  durable tasks, which is a useful curriculum contrast.

Implementation feasibility:

- Unclear until a spike validates the local development and testing story.
- V1 docs were updated very recently, so API churn is a concern.

Utility:

- Medium. Hatchet could help teach the boundary between queue/DAG systems and
  durable execution.

Recommendation:

- Track, but wait before adding a runnable implementation.

### AWS Step Functions

Primary sources:

- [AWS Step Functions overview](https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html)
- [Step Functions workflow types](https://docs.aws.amazon.com/step-functions/latest/dg/choosing-workflow-type.html)
- [Step Functions best practices](https://docs.aws.amazon.com/step-functions/latest/dg/sfn-best-practices.html)

Model:

- Step Functions orchestrates distributed applications using state machines,
  Amazon States Language, service integrations, Standard/Express workflow types,
  retries, timeouts, and visual tooling.

Fit for this repository:

- Medium as production background; low as a code-first durable execution runtime.
- It is already adjacent to AWS Lambda durable functions, but teaches a different
  model: external state machine orchestration rather than durable async code.

Implementation feasibility:

- Low for local parity unless using mocks or local emulators that do not fully
  represent the service.

Utility:

- High as a comparison point for "when not to use Lambda durable functions."
- Low as a next implementation in this repo.

Recommendation:

- Keep as docs/comparison only.

### Google Cloud Workflows

Primary sources:

- [Google Cloud Workflows overview](https://cloud.google.com/workflows/docs/overview)

Model:

- Google Cloud Workflows orchestrates services through workflow definitions,
  connectors, retries, callbacks, and long-running execution.

Fit for this repository:

- Low-medium. It is durable orchestration, but not the same code-first model as
  this cookbook's current harnesses.

Implementation feasibility:

- Low for local parity and CI without cloud dependencies.

Utility:

- Useful only as a broad market comparison.

Recommendation:

- Do not add an implementation unless the repo later becomes a cross-cloud
  orchestration catalog.

## Current targets retained for baseline

### Temporal TypeScript

Primary sources:

- [Temporal TypeScript testing suite](https://docs.temporal.io/develop/typescript/testing-suite)
- [Temporal workflow definition and determinism](https://docs.temporal.io/workflow-definition)

Temporal remains the baseline for explicit workflow/activity separation,
deterministic workflow replay, local testing quality, and workflow history
inspection.

### AWS Lambda durable functions

Primary sources:

- [Lambda durable functions](https://docs.aws.amazon.com/lambda/latest/dg/durable-functions.html)
- [Lambda durable functions examples](https://docs.aws.amazon.com/lambda/latest/dg/durable-examples.html)
- [Durable execution SDK](https://docs.aws.amazon.com/lambda/latest/dg/durable-execution-sdk.html)
- [Testing Lambda durable functions](https://docs.aws.amazon.com/lambda/latest/dg/durable-testing.html)
- [Supported durable function runtimes](https://docs.aws.amazon.com/lambda/latest/dg/durable-supported-runtimes.html)

AWS Lambda durable functions remain the best baseline for "regular cloud
function plus checkpoint/replay" semantics. The current repo implementation
should continue to track the official SDK and testing package closely because
the feature is young and likely to evolve.

## Proposed implementation roadmap

### Phase 1: DBOS spike

Add `apps/dbos-harness` behind package-level scripts.

Target scope:

- one scatter-gather recipe
- one deterministic fixture-backed AI task
- shared scenario vector execution
- local DB lifecycle documented clearly
- no production deployment story yet

Promotion criteria:

- `pnpm --filter @agentic-cookbook/dbos-harness test` runs locally
- failures normalize to the existing canonical outcome model
- setup does not make the root `pnpm check` brittle

### Phase 2: Cloudflare Workflows spike

Add a minimal Workers/Workflows app only after validating shared package
compatibility with the Workers runtime.

Target scope:

- one recipe vector
- Wrangler local workflow trigger
- notes on Workers runtime constraints
- comparison table versus AWS Lambda durable functions

Promotion criteria:

- tests can run without Cloudflare credentials
- local lifecycle is scriptable enough for contributors
- the adapter does not require invasive changes to `workflow-spec`

### Phase 3: Restate decision

Run a Testcontainers-based spike.

Target scope:

- durable steps for task execution
- durable promise or service-call example if it naturally fits a recipe
- clear note on Docker/Testcontainers requirement

Promotion criteria:

- Restate adds a clearly distinct lesson around durable services, virtual
  objects, or durable promises
- CI cost is acceptable

### Phase 4: Rivet actor workflow spike

Add a minimal Rivet actor harness if the curriculum expands toward long-lived
agents, realtime sessions, or actor-local queues.

Target scope:

- one actor-backed workflow run
- one scatter-gather recipe vector
- basic workflow step/progress inspection
- note comparing Rivet Actors with Cloudflare Durable Objects and Cloudflare
  Workflows

Promotion criteria:

- local tests run without hosted Rivet dependencies
- actor lifecycle maps cleanly to shared scenario setup/teardown
- the actor model teaches something beyond the DBOS/Cloudflare/Restate tracks

## Suggested docs updates after implementation

- Expand `docs/runtime/semantics-matrix.md` from two runtime columns to a
  platform matrix grouped by execution model.
- Add a "When to choose which durable runtime" tutorial page.
- Add recipe-level runtime mapping tables only for promoted harnesses.
- Keep provider-only products such as Step Functions and Google Workflows in a
  comparison section rather than runnable parity tests.
