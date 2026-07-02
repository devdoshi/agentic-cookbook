import type { CompletenessJudgePort, TaskExecutorPort } from '../ports.js';
import type { WorkflowTraceRecorder } from '../trace.js';
import type { WorkflowInput, WorkflowOutcome } from '../types.js';
import { aggregateResults, assertUniqueTaskIds } from './common.js';

export const scatterGatherAiComplete = async (
  input: WorkflowInput,
  executor: TaskExecutorPort,
  judge: CompletenessJudgePort,
  trace?: WorkflowTraceRecorder,
): Promise<WorkflowOutcome> => {
  assertUniqueTaskIds(input.tasks.map((task) => task.id));

  trace?.emit({
    lane: 'workflow',
    phase: 'start',
    name: 'workflow.start',
    attrs: {
      workflowId: input.workflowId,
      mode: input.mode,
      taskCount: input.tasks.length,
    },
  });

  const completed: Awaited<ReturnType<TaskExecutorPort['executeTask']>>[] = [];
  const pending = [...input.tasks];
  let lastScore = 0;

  try {
    while (pending.length > 0) {
      const next = pending.shift();
      if (!next) {
        break;
      }

      trace?.emit({
        lane: 'task',
        phase: 'point',
        name: 'task.dispatch',
        taskId: next.id,
        attrs: {
          payload: next.payload,
        },
      });
      trace?.emit({
        lane: 'task',
        phase: 'start',
        name: 'task.execute',
        taskId: next.id,
      });

      const result = await executor.executeTask(next);
      completed.push(result);

      trace?.emit({
        lane: 'task',
        phase: 'end',
        name: 'task.execute',
        taskId: next.id,
        attrs: {
          score: result.score,
        },
      });

      trace?.emit({
        lane: 'judge',
        phase: 'start',
        name: 'judge.evaluate',
        attrs: {
          completedCount: completed.length,
          pendingCount: pending.length,
        },
      });

      const decision = await judge.evaluate({
        input,
        completed,
        pending,
      });
      lastScore = decision.score;

      trace?.emit({
        lane: 'judge',
        phase: 'end',
        name: 'judge.evaluate',
        attrs: {
          complete: decision.complete,
          score: decision.score,
          reason: decision.reason,
        },
      });

      if (decision.complete) {
        const status = pending.length === 0 ? 'complete' : 'partial';
        trace?.emit({
          lane: 'workflow',
          phase: 'point',
          name: 'workflow.terminal',
          attrs: {
            status,
            reason: decision.reason,
          },
        });
        trace?.emit({
          lane: 'workflow',
          phase: 'end',
          name: 'workflow.end',
          attrs: {
            status,
          },
        });
        return {
          workflowId: input.workflowId,
          mode: 'ai-complete',
          status,
          aggregate: aggregateResults(completed),
          completedTaskIds: completed.map((task) => task.id),
          pendingTaskIds: pending.map((task) => task.id),
          reason: decision.reason,
          judgeScore: decision.score,
        };
      }
    }

    trace?.emit({
      lane: 'workflow',
      phase: 'point',
      name: 'workflow.terminal',
      attrs: {
        status: 'complete',
        reason: 'all tasks consumed before judge accepted completion',
      },
    });
    trace?.emit({
      lane: 'workflow',
      phase: 'end',
      name: 'workflow.end',
      attrs: {
        status: 'complete',
      },
    });

    return {
      workflowId: input.workflowId,
      mode: 'ai-complete',
      status: 'complete',
      aggregate: aggregateResults(completed),
      completedTaskIds: completed.map((task) => task.id),
      pendingTaskIds: [],
      reason: 'all tasks consumed before judge accepted completion',
      judgeScore: lastScore,
    };
  } catch (error) {
    trace?.emit({
      lane: 'workflow',
      phase: 'end',
      name: 'workflow.end',
      attrs: {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
};
