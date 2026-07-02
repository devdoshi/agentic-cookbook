import type { AggregateResult, TaskResult, WorkflowOutcome } from './types.js';

export const aggregateResults = (results: TaskResult[]): AggregateResult => {
  const totalScore = results.reduce((sum, item) => sum + item.score, 0);
  return {
    values: results.map((item) => item.value),
    totalScore,
    averageScore: results.length === 0 ? 0 : totalScore / results.length,
  };
};

export const createOutcome = (
  mode: WorkflowOutcome['mode'],
  workflowId: string,
  status: WorkflowOutcome['status'],
  completed: TaskResult[],
  pendingTaskIds: string[],
  reason: string,
  judgeScore?: number,
): WorkflowOutcome => ({
  workflowId,
  mode,
  status,
  aggregate: aggregateResults(completed),
  completedTaskIds: completed.map((task) => task.id),
  pendingTaskIds,
  reason,
  judgeScore,
});
