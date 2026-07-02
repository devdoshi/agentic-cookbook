import {
  type CompletenessJudgePort,
  type TaskExecutorPort,
  type WorkflowInput,
  type WorkflowOutcome,
  type WorkflowTraceEvent,
  createDeterministicClock,
  createWorkflowTraceRecorder,
  scatterGatherAiComplete,
  scatterGatherBasic,
  scatterGatherQuorumTimeout,
} from '@agentic-cookbook/workflow-spec';
import { ApplicationFailure, proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/index.js';

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 1,
  },
});

export const runAgenticWorkflow = async (
  input: WorkflowInput,
): Promise<WorkflowOutcome> => {
  const result = await runAgenticWorkflowWithTrace(input);
  return result.outcome;
};

export type TracedWorkflowResult = {
  outcome: WorkflowOutcome;
  events: WorkflowTraceEvent[];
};

export const runAgenticWorkflowWithTrace = async (
  input: WorkflowInput,
): Promise<TracedWorkflowResult> => {
  const executor: TaskExecutorPort = {
    executeTask: (request) => activity.executeTask(request),
  };

  const judge: CompletenessJudgePort = {
    evaluate: (state) => activity.evaluateCompleteness(state),
  };
  const trace = createWorkflowTraceRecorder();

  try {
    let outcomePromise: Promise<WorkflowOutcome>;

    switch (input.mode) {
      case 'basic':
        outcomePromise = scatterGatherBasic(input, executor, trace);
        break;
      case 'ai-complete':
        outcomePromise = scatterGatherAiComplete(input, executor, judge, trace);
        break;
      case 'quorum-timeout':
        outcomePromise = scatterGatherQuorumTimeout(
          input,
          executor,
          createDeterministicClock(0, 5),
          trace,
        );
        break;
      default: {
        const unsupportedMode = `unsupported workflow mode: ${String(input.mode)}`;
        throw ApplicationFailure.nonRetryable(
          unsupportedMode,
          'ValidationError',
        );
      }
    }

    const outcome = await outcomePromise;
    return {
      outcome,
      events: trace.snapshot(),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('duplicate task id')
    ) {
      throw ApplicationFailure.nonRetryable(error.message, 'ValidationError');
    }

    throw error;
  }
};
