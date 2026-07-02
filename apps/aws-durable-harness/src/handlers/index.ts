import { FixtureReplayJudge } from '@agentic-cookbook/ai-judge-fixtures';
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
import {
  type DurableContext,
  withDurableExecution,
} from '@aws/durable-execution-sdk-js';

const fixtureJudge = new FixtureReplayJudge();

export type TracedWorkflowResult = {
  outcome: WorkflowOutcome;
  events: WorkflowTraceEvent[];
};

const executeDurableWorkflow = async (
  input: WorkflowInput,
  context: DurableContext,
): Promise<TracedWorkflowResult> => {
  const trace = createWorkflowTraceRecorder();
  const executor: TaskExecutorPort = {
    executeTask: async (request) =>
      context.step(`task-${request.id}`, async () => {
        if (request.payload.startsWith('fail:')) {
          throw new Error(`simulated task failure for ${request.id}`);
        }

        return {
          id: request.id,
          value: `${request.payload}-done`,
          score: request.payload.length,
        };
      }),
  };

  const judge: CompletenessJudgePort = {
    evaluate: async (state) =>
      context.step('judge-completeness', async () =>
        fixtureJudge.evaluate(state),
      ),
  };

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
    default:
      throw new Error(`unsupported workflow mode: ${String(input.mode)}`);
  }

  const outcome = await outcomePromise;
  return {
    outcome,
    events: trace.snapshot(),
  };
};

export const durableWorkflowWithTraceHandler = withDurableExecution<
  WorkflowInput,
  TracedWorkflowResult
>(async (input, context) => executeDurableWorkflow(input, context));

export const durableWorkflowHandler = withDurableExecution<
  WorkflowInput,
  WorkflowOutcome
>(async (input, context) => {
  const traced = await executeDurableWorkflow(input, context);
  return traced.outcome;
});
