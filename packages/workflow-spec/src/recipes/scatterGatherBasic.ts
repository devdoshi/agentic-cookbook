import type { TaskExecutorPort } from '../ports.js';
import type { WorkflowTraceRecorder } from '../trace.js';
import type { WorkflowInput, WorkflowOutcome } from '../types.js';
import { aggregateResults, assertUniqueTaskIds } from './common.js';

export const scatterGatherBasic = async (
  input: WorkflowInput,
  executor: TaskExecutorPort,
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

  try {
    const completed = await Promise.all(
      input.tasks.map(async (task) => {
        trace?.emit({
          lane: 'task',
          phase: 'point',
          name: 'task.dispatch',
          taskId: task.id,
          attrs: {
            payload: task.payload,
          },
        });
        trace?.emit({
          lane: 'task',
          phase: 'start',
          name: 'task.execute',
          taskId: task.id,
        });
        try {
          const result = await executor.executeTask(task);
          trace?.emit({
            lane: 'task',
            phase: 'end',
            name: 'task.execute',
            taskId: task.id,
            attrs: {
              score: result.score,
            },
          });
          return result;
        } catch (error) {
          trace?.emit({
            lane: 'task',
            phase: 'point',
            name: 'task.fail',
            taskId: task.id,
            attrs: {
              error: error instanceof Error ? error.message : String(error),
            },
          });
          throw error;
        }
      }),
    );

    trace?.emit({
      lane: 'workflow',
      phase: 'point',
      name: 'workflow.terminal',
      attrs: {
        status: 'complete',
        reason: 'all tasks completed',
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
      mode: 'basic',
      status: 'complete',
      aggregate: aggregateResults(completed),
      completedTaskIds: completed.map((task) => task.id),
      pendingTaskIds: [],
      reason: 'all tasks completed',
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
