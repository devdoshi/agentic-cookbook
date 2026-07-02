import {
  type WorkflowRunResult,
  durableDeterminismWorkflowScenarios,
  durableErrorWorkflowScenarios,
  recipeVectorWorkflowScenarios,
  toWorkflowTestCases,
} from '@agentic-cookbook/test-kit';
import type { WorkflowInput } from '@agentic-cookbook/workflow-spec';
import {
  type TemporalRuntime,
  createTemporalRuntime,
} from '../runtime/createTemporalRuntime.js';

describe('temporal harness', () => {
  let runtime: TemporalRuntime;

  const runTemporalScenario = async (
    input: WorkflowInput,
  ): Promise<WorkflowRunResult> => {
    const result = await runtime.run(input);
    return result.kind === 'success'
      ? { kind: 'success', outcome: result.outcome }
      : { kind: 'failure', error: result.error };
  };

  beforeAll(async () => {
    runtime = createTemporalRuntime();
  });

  afterAll(async () => {
    await runtime.close();
  });

  describe('recipe vectors', () => {
    const cases = toWorkflowTestCases(
      recipeVectorWorkflowScenarios,
      'temporal',
      runTemporalScenario,
    );

    it.each(cases)('$name', async ({ execute }) => {
      await execute();
    });
  });

  describe('durable determinism scenarios', () => {
    const cases = toWorkflowTestCases(
      durableDeterminismWorkflowScenarios,
      'temporal',
      runTemporalScenario,
    );

    it.each(cases)('$name', async ({ execute }) => {
      await execute();
    });
  });

  describe('durable error scenarios', () => {
    const cases = toWorkflowTestCases(
      durableErrorWorkflowScenarios,
      'temporal',
      runTemporalScenario,
    );

    it.each(cases)('$name', async ({ execute }) => {
      await execute();
    });
  });
});
