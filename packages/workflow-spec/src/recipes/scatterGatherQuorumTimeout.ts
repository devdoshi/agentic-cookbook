import type { ClockPort, TaskExecutorPort } from '../ports.js';
import type { WorkflowTraceRecorder } from '../trace.js';
import type { WorkflowInput, WorkflowOutcome } from '../types.js';
import { aggregateResults, assertUniqueTaskIds } from './common.js';

export const scatterGatherQuorumTimeout = async (
  input: WorkflowInput,
  executor: TaskExecutorPort,
  clock: ClockPort,
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
  const quorum = Math.max(1, input.quorum ?? input.tasks.length);
  const timeoutMs = Math.max(0, input.timeoutMs ?? 0);
  const startMs = clock.now();

  try {
    while (pending.length > 0) {
      const elapsed = clock.now() - startMs;
      if (timeoutMs > 0 && elapsed >= timeoutMs) {
        trace?.emit({
          lane: 'runtime',
          phase: 'point',
          name: 'workflow.timeout',
          attrs: {
            elapsedMs: elapsed,
            timeoutMs,
          },
        });
        trace?.emit({
          lane: 'workflow',
          phase: 'point',
          name: 'workflow.terminal',
          attrs: {
            status: 'timeout',
            reason: `timeout reached at ${elapsed}ms`,
          },
        });
        trace?.emit({
          lane: 'workflow',
          phase: 'end',
          name: 'workflow.end',
          attrs: {
            status: 'timeout',
          },
        });
        return {
          workflowId: input.workflowId,
          mode: 'quorum-timeout',
          status: 'timeout',
          aggregate: aggregateResults(completed),
          completedTaskIds: completed.map((task) => task.id),
          pendingTaskIds: pending.map((task) => task.id),
          reason: `timeout reached at ${elapsed}ms`,
        };
      }

      if (completed.length >= quorum) {
        const status = pending.length === 0 ? 'complete' : 'partial';
        trace?.emit({
          lane: 'runtime',
          phase: 'point',
          name: 'workflow.quorum',
          attrs: {
            completed: completed.length,
            quorum,
          },
        });
        trace?.emit({
          lane: 'workflow',
          phase: 'point',
          name: 'workflow.terminal',
          attrs: {
            status,
            reason: `quorum reached (${completed.length}/${quorum})`,
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
          mode: 'quorum-timeout',
          status,
          aggregate: aggregateResults(completed),
          completedTaskIds: completed.map((task) => task.id),
          pendingTaskIds: pending.map((task) => task.id),
          reason: `quorum reached (${completed.length}/${quorum})`,
        };
      }

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
    }

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
      mode: 'quorum-timeout',
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
