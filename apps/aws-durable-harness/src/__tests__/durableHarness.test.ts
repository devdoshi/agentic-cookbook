import {
  type WorkflowRunResult,
  durableDeterminismWorkflowScenarios,
  durableErrorWorkflowScenarios,
  recipeVectorWorkflowScenarios,
  toWorkflowTestCases,
} from '@agentic-cookbook/test-kit';
import type { WorkflowInput } from '@agentic-cookbook/workflow-spec';
import {
  type AwsDurableRuntime,
  createAwsDurableRuntime,
} from '../runtime/createAwsDurableRuntime.js';

const runDurableScenario = async (
  runtime: AwsDurableRuntime,
  input: WorkflowInput,
): Promise<WorkflowRunResult> => {
  const result = await runtime.run(input);
  return result.kind === 'success'
    ? { kind: 'success', outcome: result.outcome }
    : { kind: 'failure', error: result.error };
};

describe('aws durable harness', () => {
  let runtime: AwsDurableRuntime;

  beforeAll(async () => {
    runtime = createAwsDurableRuntime();
  });

  afterAll(async () => {
    await runtime.close();
  });

  describe('recipe vectors', () => {
    const cases = toWorkflowTestCases(
      recipeVectorWorkflowScenarios,
      'aws-durable',
      (input) => runDurableScenario(runtime, input),
    );

    it.each(cases)('$name', async ({ execute }) => {
      await execute();
    });
  });

  describe('durable determinism scenarios', () => {
    const cases = toWorkflowTestCases(
      durableDeterminismWorkflowScenarios,
      'aws-durable',
      (input) => runDurableScenario(runtime, input),
    );

    it.each(cases)('$name', async ({ execute }) => {
      await execute();
    });
  });

  describe('durable error scenarios', () => {
    const cases = toWorkflowTestCases(
      durableErrorWorkflowScenarios,
      'aws-durable',
      (input) => runDurableScenario(runtime, input),
    );

    it.each(cases)('$name', async ({ execute }) => {
      await execute();
    });
  });
});
