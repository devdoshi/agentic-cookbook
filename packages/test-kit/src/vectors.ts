import type { WorkflowInput } from '@agentic-cookbook/workflow-spec';

export const sharedVectors: Array<{
  name: string;
  input: WorkflowInput;
  expectedStatus: 'complete' | 'partial' | 'timeout';
}> = [
  {
    name: 'basic-all-complete',
    input: {
      workflowId: 'vec-basic',
      mode: 'basic',
      tasks: [
        { id: 'a', payload: 'alpha' },
        { id: 'b', payload: 'beta' },
        { id: 'c', payload: 'gamma' },
      ],
    },
    expectedStatus: 'complete',
  },
  {
    name: 'ai-partial',
    input: {
      workflowId: 'vec-ai',
      mode: 'ai-complete',
      tasks: [
        { id: 'a', payload: 'alpha' },
        { id: 'b', payload: 'beta' },
        { id: 'c', payload: 'gamma' },
      ],
      minimumJudgeScore: 0.9,
    },
    expectedStatus: 'partial',
  },
  {
    name: 'quorum-partial',
    input: {
      workflowId: 'vec-quorum',
      mode: 'quorum-timeout',
      tasks: [
        { id: 'a', payload: 'alpha' },
        { id: 'b', payload: 'beta' },
        { id: 'c', payload: 'gamma' },
      ],
      quorum: 2,
      timeoutMs: 100,
    },
    expectedStatus: 'partial',
  },
  {
    name: 'quorum-timeout',
    input: {
      workflowId: 'vec-timeout',
      mode: 'quorum-timeout',
      tasks: [
        { id: 'a', payload: 'alpha' },
        { id: 'b', payload: 'beta' },
        { id: 'c', payload: 'gamma' },
      ],
      quorum: 3,
      timeoutMs: 8,
    },
    expectedStatus: 'timeout',
  },
];
