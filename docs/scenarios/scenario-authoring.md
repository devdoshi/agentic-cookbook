# Scenario Authoring Guide (Given/When/Then DSL)

This project uses a branchable Given/When/Then DSL in `@agentic-cookbook/test-kit` to keep behavior scenarios shared across runtimes.

Interactive runner route:
- `/scenarios`

## Where the DSL lives

- `packages/test-kit/src/bdd/workflowScenario.ts`
- `packages/test-kit/src/bdd/plans.ts`

## Design goal

Define behavior once, then branch and execute it in:
- Temporal harness
- AWS durable harness

This avoids rewriting equivalent tests per runtime.

## Core building blocks

- `workflowScenario(name, input)`: Create the base scenario with seed input.
- `.given(name, fn)`: Derive input state.
- `.when(name, fn)`: Execute the action.
- `.then(name, fn)`: Assert outcomes.
- `.branch(name)`: Fork scenario display name for variants.
- `.supportsRuntimes(...)`: Limit scenario execution to specific runtimes.
- `toWorkflowTestCases(...)`: Convert scenarios into `it.each` test cases for a runtime.

## Minimal example

```ts
import {
  expectWorkflowSuccess,
  toWorkflowTestCases,
  workflowScenario,
} from '@agentic-cookbook/test-kit';

const scenarios = [
  workflowScenario('basic-completes', {
    workflowId: 'ex-basic',
    mode: 'basic',
    tasks: [
      { id: 'a', payload: 'alpha' },
      { id: 'b', payload: 'beta' },
    ],
  })
    .when('execute workflow', async ({ input, run }) => run(input))
    .then('returns complete status', ({ result }) => {
      const outcome = expectWorkflowSuccess(result);
      expect(outcome.status).toBe('complete');
    }),
];

const cases = toWorkflowTestCases(scenarios, 'temporal', runTemporalScenario);

it.each(cases)('$name', async ({ execute }) => {
  await execute();
});
```

## Runtime branching pattern

For runtime-specific behavior, prefer runtime filtering over duplicate scenario definitions:

```ts
const runtimeSpecificScenario = workflowScenario('runtime-specific-example', input)
  .when('execute', ({ input, run }) => run(input))
  .then('fails', ({ result }) => {
    const error = expectWorkflowFailure(result);
    expect(error).toContain('runtime-specific behavior');
  })
  .supportsRuntimes('aws-durable');
```

Use runtime filtering only when behavior is intentionally runtime-specific.

In this repository, duplicate task ID scenarios run in both runtimes. Temporal workflow wrapper logic marks duplicate-ID validation failures as non-retryable so the scenario remains bounded in local tests.

## How to add a new shared scenario

1. Add scenario definition in `packages/test-kit/src/bdd/plans.ts`.
2. Export any new plan collection from `packages/test-kit/src/index.ts`.
3. Consume via `toWorkflowTestCases(...)` in:
   - `apps/temporal-harness/src/__tests__/temporalHarness.test.ts`
   - `apps/aws-durable-harness/src/__tests__/durableHarness.test.ts`
4. Run:
   - `pnpm run test:durable`
   - `pnpm run test:temporal`
   - `pnpm check`
