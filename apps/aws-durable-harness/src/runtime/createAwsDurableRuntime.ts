import type {
  WorkflowInput,
  WorkflowOutcome,
  WorkflowTraceBundle,
  WorkflowTraceEvent,
  WorkflowTraceNativeEvent,
  WorkflowTraceNativeHistory,
} from '@agentic-cookbook/workflow-spec';
import {
  ExecutionStatus,
  LocalDurableTestRunner,
} from '@aws/durable-execution-sdk-js-testing';
import { durableWorkflowWithTraceHandler } from '../handlers/index.js';

export type RuntimeRunResult =
  | {
      kind: 'success';
      durationMs: number;
      outcome: WorkflowOutcome;
      trace: WorkflowTraceBundle;
    }
  | {
      kind: 'failure';
      durationMs: number;
      error: string;
      trace: WorkflowTraceBundle;
    };

export type AwsDurableRuntime = {
  run: (input: WorkflowInput) => Promise<RuntimeRunResult>;
  close: () => Promise<void>;
};

const setupState: {
  ready: boolean;
  setupPromise: Promise<void> | null;
} = {
  ready: false,
  setupPromise: null,
};

const ensureSetup = async () => {
  if (setupState.ready) {
    return;
  }

  if (!setupState.setupPromise) {
    setupState.setupPromise = LocalDurableTestRunner.setupTestEnvironment({
      skipTime: true,
    });
  }

  await setupState.setupPromise;
  setupState.ready = true;
  setupState.setupPromise = null;
};

const toRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }

  return { value };
};

const toSerializable = (value: unknown, depth = 0): unknown => {
  if (depth > 6) {
    return String(value);
  }

  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toSerializable(item, depth + 1));
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>,
    )) {
      output[key] = toSerializable(nested, depth + 1);
    }
    return output;
  }

  return String(value);
};

const toEpochMs = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return undefined;
};

const normalizeDurableNativeHistory = (
  historyEvents: unknown[],
): WorkflowTraceNativeHistory => {
  const events: WorkflowTraceNativeEvent[] = historyEvents.map(
    (event, index) => {
      const record = toRecord(event);
      const rawId = record.id ?? record.eventId ?? index + 1;
      const rawType =
        record.eventType ??
        record.type ??
        record.operationType ??
        'DurableEvent';

      return {
        id: String(rawId),
        seq: index + 1,
        type: String(rawType),
        tsMs: toEpochMs(
          record.eventTimestamp ??
            record.timestamp ??
            record.startTime ??
            record.endTime,
        ),
        attrs: toSerializable(record) as Record<string, unknown>,
      };
    },
  );

  return {
    runtime: 'aws-durable',
    events,
  };
};

const createFailureTrace = (
  durationMs: number,
  error: string,
  events: WorkflowTraceEvent[] = [],
  nativeHistory: WorkflowTraceNativeHistory | null = null,
): WorkflowTraceBundle => {
  const traceEvents: WorkflowTraceEvent[] =
    events.length > 0
      ? events
      : [
          {
            id: 'evt-1',
            seq: 1,
            lane: 'system',
            phase: 'point',
            name: 'runtime.error',
            attrs: { error },
          },
        ];

  return {
    version: 1,
    events: traceEvents,
    spans: [],
    nativeHistory,
    durationMs,
    warnings: [],
  };
};

const runDurableWorkflow = async (input: WorkflowInput) => {
  const runner = new LocalDurableTestRunner<{
    outcome: WorkflowOutcome;
    events: WorkflowTraceEvent[];
  }>({
    handlerFunction: durableWorkflowWithTraceHandler,
  });

  return runner.run({ payload: input });
};

export const createAwsDurableRuntime = (): AwsDurableRuntime => {
  return {
    run: async (input) => {
      const startedAt = Date.now();
      try {
        await ensureSetup();
        const result = await runDurableWorkflow(input);
        const history = result.getHistoryEvents();
        const nativeHistory = normalizeDurableNativeHistory(history);

        if (result.getStatus() === ExecutionStatus.SUCCEEDED) {
          const payload = result.getResult();
          if (!payload) {
            return {
              kind: 'failure',
              durationMs: Date.now() - startedAt,
              error: 'durable execution succeeded without result payload',
              trace: createFailureTrace(
                Date.now() - startedAt,
                'durable execution succeeded without result payload',
                [],
                nativeHistory,
              ),
            };
          }

          const durationMs = Date.now() - startedAt;
          return {
            kind: 'success',
            durationMs,
            outcome: payload.outcome,
            trace: {
              version: 1,
              events: payload.events ?? [],
              spans: [],
              nativeHistory,
              durationMs,
              warnings: [],
            },
          };
        }

        const error = result.getError();
        const errorMessage =
          `${error.errorType ?? ''} ${error.errorMessage ?? ''}`.trim();
        const durationMs = Date.now() - startedAt;
        return {
          kind: 'failure',
          durationMs,
          error: errorMessage,
          trace: createFailureTrace(
            durationMs,
            errorMessage,
            [],
            nativeHistory,
          ),
        };
      } catch (error) {
        const durationMs = Date.now() - startedAt;
        const message = error instanceof Error ? error.message : String(error);
        return {
          kind: 'failure',
          durationMs,
          error: message,
          trace: createFailureTrace(durationMs, message),
        };
      }
    },
    close: async () => {
      if (!setupState.ready) {
        setupState.setupPromise = null;
        return;
      }

      await LocalDurableTestRunner.teardownTestEnvironment();
      setupState.ready = false;
      setupState.setupPromise = null;
    },
  };
};
