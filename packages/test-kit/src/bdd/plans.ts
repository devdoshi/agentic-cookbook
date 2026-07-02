import assert from 'node:assert/strict';
import {
  canonicalizeOutcome,
  durableDeterminismScenarios,
  durableErrorScenarios,
} from '../scenarios.js';
import { sharedVectors } from '../vectors.js';
import {
  expectWorkflowFailure,
  expectWorkflowSuccess,
  workflowScenario,
} from './workflowScenario.js';

export const recipeVectorWorkflowScenarios = sharedVectors.map((vector) =>
  workflowScenario(vector.name, vector.input)
    .when('execute workflow', async ({ input, run }) => run(input))
    .then('returns expected status', ({ result }) => {
      const outcome = expectWorkflowSuccess(result);
      assert.equal(outcome.status, vector.expectedStatus);
      assert.equal(outcome.mode, vector.input.mode);
    }),
);

export const durableDeterminismWorkflowScenarios =
  durableDeterminismScenarios.map((scenario) =>
    workflowScenario(scenario.name, scenario.input)
      .when('run first execution', async ({ input, run }) => run(input))
      .then('replay stays deterministic', async ({ input, result, run }) => {
        const first = expectWorkflowSuccess(result);
        const secondResult = await run(input);
        const second = expectWorkflowSuccess(secondResult);

        assert.deepEqual(
          canonicalizeOutcome(first),
          canonicalizeOutcome(second),
          'expected canonical outcomes to match across replays',
        );
      }),
  );

export const durableErrorWorkflowScenarios = durableErrorScenarios.map(
  (scenario) => {
    return workflowScenario(scenario.name, scenario.input)
      .when('execute workflow and capture failure', async ({ input, run }) =>
        run(input),
      )
      .then('fails with expected message', ({ result }) => {
        const message = expectWorkflowFailure(result);
        assert.ok(
          message.includes(scenario.expectedErrorSubstring),
          `expected error to include "${scenario.expectedErrorSubstring}", got "${message}"`,
        );
      });
  },
);
