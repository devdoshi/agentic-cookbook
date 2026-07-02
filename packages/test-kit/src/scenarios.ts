import type {
  WorkflowInput,
  WorkflowOutcome,
} from '@agentic-cookbook/workflow-spec';

export const durableDeterminismScenarios: Array<{
  name: string;
  input: WorkflowInput;
}> = [
  {
    name: 'deterministic-basic',
    input: {
      workflowId: 'det-basic',
      mode: 'basic',
      tasks: [
        { id: 'a', payload: 'alpha' },
        { id: 'b', payload: 'beta' },
      ],
    },
  },
  {
    name: 'deterministic-ai-complete',
    input: {
      workflowId: 'det-ai',
      mode: 'ai-complete',
      tasks: [
        { id: 'a', payload: 'alpha' },
        { id: 'b', payload: 'beta' },
        { id: 'c', payload: 'gamma' },
      ],
      minimumJudgeScore: 0.9,
    },
  },
  {
    name: 'deterministic-quorum-timeout',
    input: {
      workflowId: 'det-quorum',
      mode: 'quorum-timeout',
      tasks: [
        { id: 'a', payload: 'alpha' },
        { id: 'b', payload: 'beta' },
        { id: 'c', payload: 'gamma' },
      ],
      quorum: 2,
      timeoutMs: 30,
    },
  },
];

export const durableErrorScenarios: Array<{
  name: string;
  input: WorkflowInput;
  expectedErrorSubstring: string;
}> = [
  {
    name: 'error-duplicate-task-id',
    input: {
      workflowId: 'err-dup',
      mode: 'basic',
      tasks: [
        { id: 'dup', payload: 'alpha' },
        { id: 'dup', payload: 'beta' },
      ],
    },
    expectedErrorSubstring: 'duplicate task id',
  },
  {
    name: 'error-task-execution-failure',
    input: {
      workflowId: 'err-task',
      mode: 'basic',
      tasks: [
        { id: 'ok', payload: 'alpha' },
        { id: 'bad', payload: 'fail:explode' },
      ],
    },
    expectedErrorSubstring: 'simulated task failure',
  },
];

export const canonicalizeOutcome = (
  outcome: WorkflowOutcome,
): Omit<WorkflowOutcome, 'workflowId'> => {
  const { workflowId: _ignoredWorkflowId, ...canonical } = outcome;
  return canonical;
};
