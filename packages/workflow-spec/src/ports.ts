import type {
  CompletenessDecision,
  CompletenessState,
  TaskRequest,
  TaskResult,
} from './types.js';

export type TaskExecutorPort = {
  executeTask(request: TaskRequest): Promise<TaskResult>;
};

export type CompletenessJudgePort = {
  evaluate(state: CompletenessState): Promise<CompletenessDecision>;
};

export type ClockPort = {
  now(): number;
};
