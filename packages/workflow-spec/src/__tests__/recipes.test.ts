import {
  type ClockPort,
  type CompletenessJudgePort,
  type TaskExecutorPort,
  type TaskRequest,
  createWorkflowTraceRecorder,
  scatterGatherAiComplete,
  scatterGatherBasic,
  scatterGatherQuorumTimeout,
} from '../index.js';

const buildTasks = (): TaskRequest[] => [
  { id: 'a', payload: 'alpha' },
  { id: 'b', payload: 'beta' },
  { id: 'c', payload: 'gamma' },
];

const createExecutor = (): TaskExecutorPort => ({
  async executeTask(request) {
    return {
      id: request.id,
      value: `${request.payload}-done`,
      score: request.payload.length,
    };
  },
});

describe('scatterGatherBasic', () => {
  it('completes all tasks and aggregates deterministically', async () => {
    const outcome = await scatterGatherBasic(
      {
        workflowId: 'wf-1',
        mode: 'basic',
        tasks: buildTasks(),
      },
      createExecutor(),
    );

    expect(outcome.status).toBe('complete');
    expect(outcome.completedTaskIds).toEqual(['a', 'b', 'c']);
    expect(outcome.aggregate.values).toEqual([
      'alpha-done',
      'beta-done',
      'gamma-done',
    ]);
  });

  it('throws for duplicate task IDs', async () => {
    await expect(
      scatterGatherBasic(
        {
          workflowId: 'wf-dup',
          mode: 'basic',
          tasks: [
            { id: 'dup', payload: 'x' },
            { id: 'dup', payload: 'y' },
          ],
        },
        createExecutor(),
      ),
    ).rejects.toThrow('duplicate task id');
  });

  it('emits ordered trace events', async () => {
    const trace = createWorkflowTraceRecorder();

    await scatterGatherBasic(
      {
        workflowId: 'wf-trace-basic',
        mode: 'basic',
        tasks: buildTasks().slice(0, 2),
      },
      createExecutor(),
      trace,
    );

    const eventNames = trace.snapshot().map((event) => event.name);
    expect(eventNames[0]).toBe('workflow.start');
    expect(eventNames).toContain('task.dispatch');
    expect(eventNames).toContain('task.execute');
    expect(eventNames[eventNames.length - 1]).toBe('workflow.end');
  });
});

describe('scatterGatherAiComplete', () => {
  it('stops early when judge returns complete', async () => {
    const judge: CompletenessJudgePort = {
      async evaluate(state) {
        if (state.completed.length >= 2) {
          return {
            complete: true,
            score: 0.93,
            reason: 'coverage threshold met',
          };
        }

        return {
          complete: false,
          score: 0.4,
          reason: 'insufficient signal',
        };
      },
    };

    const outcome = await scatterGatherAiComplete(
      {
        workflowId: 'wf-ai',
        mode: 'ai-complete',
        tasks: buildTasks(),
      },
      createExecutor(),
      judge,
    );

    expect(outcome.status).toBe('partial');
    expect(outcome.completedTaskIds).toEqual(['a', 'b']);
    expect(outcome.pendingTaskIds).toEqual(['c']);
    expect(outcome.judgeScore).toBe(0.93);
  });

  it('finishes all tasks when judge never returns complete', async () => {
    const judge: CompletenessJudgePort = {
      async evaluate() {
        return {
          complete: false,
          score: 0.5,
          reason: 'keep going',
        };
      },
    };

    const outcome = await scatterGatherAiComplete(
      {
        workflowId: 'wf-ai-all',
        mode: 'ai-complete',
        tasks: buildTasks(),
      },
      createExecutor(),
      judge,
    );

    expect(outcome.status).toBe('complete');
    expect(outcome.completedTaskIds).toEqual(['a', 'b', 'c']);
  });

  it('emits judge decision events', async () => {
    const trace = createWorkflowTraceRecorder();
    const judge: CompletenessJudgePort = {
      async evaluate() {
        return {
          complete: false,
          score: 0.25,
          reason: 'continue',
        };
      },
    };

    await scatterGatherAiComplete(
      {
        workflowId: 'wf-trace-ai',
        mode: 'ai-complete',
        tasks: buildTasks().slice(0, 1),
      },
      createExecutor(),
      judge,
      trace,
    );

    const eventNames = trace.snapshot().map((event) => event.name);
    expect(eventNames).toContain('judge.evaluate');
    expect(eventNames).toContain('workflow.terminal');
  });
});

describe('scatterGatherQuorumTimeout', () => {
  it('returns partial once quorum is reached', async () => {
    const ticks = [0, 10, 20, 30, 40];
    const clock: ClockPort = {
      now() {
        return ticks.shift() ?? 40;
      },
    };

    const outcome = await scatterGatherQuorumTimeout(
      {
        workflowId: 'wf-quorum',
        mode: 'quorum-timeout',
        tasks: buildTasks(),
        quorum: 2,
        timeoutMs: 1000,
      },
      createExecutor(),
      clock,
    );

    expect(outcome.status).toBe('partial');
    expect(outcome.completedTaskIds).toEqual(['a', 'b']);
    expect(outcome.pendingTaskIds).toEqual(['c']);
  });

  it('returns timeout when budget is exhausted', async () => {
    const ticks = [0, 0, 5, 10, 15, 20];
    const clock: ClockPort = {
      now() {
        return ticks.shift() ?? 20;
      },
    };

    const outcome = await scatterGatherQuorumTimeout(
      {
        workflowId: 'wf-timeout',
        mode: 'quorum-timeout',
        tasks: buildTasks(),
        quorum: 3,
        timeoutMs: 8,
      },
      createExecutor(),
      clock,
    );

    expect(outcome.status).toBe('timeout');
    expect(outcome.completedTaskIds.length).toBeLessThan(3);
    expect(outcome.pendingTaskIds.length).toBeGreaterThan(0);
  });

  it('handles empty task sets', async () => {
    const clock: ClockPort = {
      now() {
        return 0;
      },
    };

    const outcome = await scatterGatherQuorumTimeout(
      {
        workflowId: 'wf-empty',
        mode: 'quorum-timeout',
        tasks: [],
      },
      createExecutor(),
      clock,
    );

    expect(outcome.status).toBe('complete');
    expect(outcome.aggregate.totalScore).toBe(0);
  });

  it('emits timeout terminal trace', async () => {
    const trace = createWorkflowTraceRecorder();
    const ticks = [0, 100];
    const clock: ClockPort = {
      now() {
        return ticks.shift() ?? 100;
      },
    };

    await scatterGatherQuorumTimeout(
      {
        workflowId: 'wf-trace-timeout',
        mode: 'quorum-timeout',
        tasks: buildTasks(),
        quorum: 3,
        timeoutMs: 50,
      },
      createExecutor(),
      clock,
      trace,
    );

    const events = trace.snapshot();
    const timeout = events.find((event) => event.name === 'workflow.timeout');
    expect(timeout).toBeDefined();
    expect(events[events.length - 1]?.name).toBe('workflow.end');
  });
});
