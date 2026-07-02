# Repository Rubric Evaluation (February 17, 2026)

Scale:
- 1 = poor / missing
- 2 = weak
- 3 = acceptable
- 4 = strong
- 5 = exemplary

## 1. Monorepo and Build Architecture

Rubric criteria:
- Clear package boundaries and workspace ownership
- Root scripts delegate to orchestrator (no script sprawl)
- Task graph and cache behavior are explicit and deterministic

Score: **4.6 / 5**

Evidence:
- Root scripts delegate via Turbo in `/Users/local-admin/work/codex/agentic-cookbook/package.json`
- Task graph is explicit in `/Users/local-admin/work/codex/agentic-cookbook/turbo.json`
- Shared logic is isolated in `/Users/local-admin/work/codex/agentic-cookbook/packages/workflow-spec`

Gap:
- No package-level turbo overrides yet; may become useful once app behavior diverges further.

## 2. Cross-Runtime Workflow Design

Rubric criteria:
- Runtime-agnostic domain layer
- Clear adapter boundaries for Temporal and AWS Durable
- Semantic consistency across runtimes

Score: **4.5 / 5**

Evidence:
- Domain contracts + recipes in `/Users/local-admin/work/codex/agentic-cookbook/packages/workflow-spec`
- Temporal adapter in `/Users/local-admin/work/codex/agentic-cookbook/apps/temporal-harness/src/workflows/index.ts`
- AWS adapter in `/Users/local-admin/work/codex/agentic-cookbook/apps/aws-durable-harness/src/handlers/index.ts`

Gap:
- One known runtime-specific caveat remains for duplicate-ID behavior in Temporal runtime harness scenarios.

## 3. Durable Correctness and Failure Semantics

Rubric criteria:
- Determinism checks
- Timeout/quorum/error behavior checks
- Explicit handling of runtime-specific failure characteristics

Score: **4.2 / 5**

Evidence:
- Determinism + error scenario plans in `/Users/local-admin/work/codex/agentic-cookbook/packages/test-kit/src/bdd/plans.ts`
- Temporal and AWS scenario execution in harness tests:
  - `/Users/local-admin/work/codex/agentic-cookbook/apps/temporal-harness/src/__tests__/temporalHarness.test.ts`
  - `/Users/local-admin/work/codex/agentic-cookbook/apps/aws-durable-harness/src/__tests__/durableHarness.test.ts`

Gap:
- Duplicate task ID remains runtime-filtered to AWS in harness scenarios due Temporal workflow-task retry semantics.

## 4. Test Architecture and Maintainability

Rubric criteria:
- Shared test abstractions reduce duplication
- Scenario authoring ergonomics
- Unit + harness test layering

Score: **4.7 / 5**

Evidence:
- Branchable Given/When/Then DSL in `/Users/local-admin/work/codex/agentic-cookbook/packages/test-kit/src/bdd/workflowScenario.ts`
- Authoring guide in `/Users/local-admin/work/codex/agentic-cookbook/docs/scenarios/scenario-authoring.md`
- Unit test coverage of recipe logic in `/Users/local-admin/work/codex/agentic-cookbook/packages/workflow-spec/src/__tests__/recipes.test.ts`

Gap:
- No property-based or fuzz-style invariants yet for broader state-space durability checking.

## 5. CI Reproducibility and Operational Reliability

Rubric criteria:
- Reproducible CI execution environment
- CI reflects local developer checks
- Minimal environment-specific flakiness

Score: **4.1 / 5**

Evidence:
- Dockerized CI workflow in `/Users/local-admin/work/codex/agentic-cookbook/.github/workflows/ci.yml`
- Pinned package manager version + containerized check command in `/Users/local-admin/work/codex/agentic-cookbook/Dockerfile.ci`
- Full check target passes via `pnpm check`

Gap:
- Base image tag `node:22-bookworm-slim` is still mutable; image digest pinning would improve strict reproducibility.

## 6. Educational Value and Curriculum Readiness

Rubric criteria:
- Clear learning path and module progression
- Practical recipe docs
- Discoverability for contributors and learners

Score: **4.0 / 5**

Evidence:
- Curriculum plan in `/Users/local-admin/work/codex/agentic-cookbook/docs/roadmap/curriculum-2026.md`
- Recipe docs in `/Users/local-admin/work/codex/agentic-cookbook/docs/recipes`
- Getting-started + scenario docs in `/Users/local-admin/work/codex/agentic-cookbook/docs`

Gap:
- Tutorials web app and Pulumi deployment tracks are scaffolded but not yet implemented:
  - `/Users/local-admin/work/codex/agentic-cookbook/apps/tutorials-web/README.md`
  - `/Users/local-admin/work/codex/agentic-cookbook/infra/pulumi/README.md`

## 7. Productization Readiness (Platform + Governance)

Rubric criteria:
- Deployment path clarity
- Contributor governance and consistency mechanisms
- Evidence of upgrade/migration strategy

Score: **3.6 / 5**

Evidence:
- Forward plan exists in roadmap docs.
- Core architecture supports incremental runtime additions.

Gap:
- Missing concrete governance artifacts and policies (for example: ADR cadence, CODEOWNERS, release/versioning policy).

## Overall

Weighted impression: **4.2 / 5 (strong foundation, pre-scale stage)**

Most valuable next upgrades:
1. Implement one real end-to-end deployment path under `/Users/local-admin/work/codex/agentic-cookbook/infra/pulumi`.
2. Add one “getting started runnable” path in `/Users/local-admin/work/codex/agentic-cookbook/apps/tutorials-web`.
3. Add advanced durability tests (property/fuzz and callback/human-in-loop scenarios) to deepen semantic confidence.
