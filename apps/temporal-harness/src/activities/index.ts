import { FixtureReplayJudge } from '@agentic-cookbook/ai-judge-fixtures';
import type {
  CompletenessDecision,
  CompletenessState,
  TaskRequest,
  TaskResult,
} from '@agentic-cookbook/workflow-spec';

const fixtureJudge = new FixtureReplayJudge();

export const executeTask = async (
  request: TaskRequest,
): Promise<TaskResult> => {
  if (request.payload.startsWith('fail:')) {
    throw new Error(`simulated task failure for ${request.id}`);
  }

  return {
    id: request.id,
    value: `${request.payload}-done`,
    score: request.payload.length,
  };
};

export const evaluateCompleteness = async (
  state: CompletenessState,
): Promise<CompletenessDecision> => fixtureJudge.evaluate(state);
