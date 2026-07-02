import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  WorkflowInput,
  WorkflowOutcome,
  WorkflowTraceBundle,
  WorkflowTraceEvent,
  WorkflowTraceNativeEvent,
  WorkflowTraceNativeHistory,
} from '@agentic-cookbook/workflow-spec';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import * as temporalActivities from '../activities/index.js';
import { runAgenticWorkflowWithTrace } from '../workflows/index.js';

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

export type TemporalRuntime = {
  run: (input: WorkflowInput) => Promise<RuntimeRunResult>;
  close: () => Promise<void>;
};

type SharedState = {
  env: TestWorkflowEnvironment | null;
  initPromise: Promise<TestWorkflowEnvironment> | null;
};

const sharedState: SharedState = {
  env: null,
  initPromise: null,
};

const runtimeFilePath = fileURLToPath(import.meta.url);
const workflowFileExtension =
  path.extname(runtimeFilePath) === '.ts' ? 'ts' : 'js';
const workflowsPath = path.join(
  path.dirname(runtimeFilePath),
  `../workflows/index.${workflowFileExtension}`,
);

const createTemporalEnvironment =
  async (): Promise<TestWorkflowEnvironment> => {
    const temporalAddress = process.env.TEMPORAL_ADDRESS;
    if (temporalAddress) {
      return TestWorkflowEnvironment.createFromExistingServer({
        address: temporalAddress,
      });
    }

    const temporalCliPath = process.env.TEMPORAL_CLI_PATH;
    if (temporalCliPath) {
      return TestWorkflowEnvironment.createLocal({
        server: {
          executable: {
            type: 'existing-path',
            path: temporalCliPath,
          },
        },
      });
    }

    return TestWorkflowEnvironment.createLocal();
  };

const getOrCreateEnvironment = async (): Promise<TestWorkflowEnvironment> => {
  if (sharedState.env) {
    return sharedState.env;
  }

  if (!sharedState.initPromise) {
    sharedState.initPromise = createTemporalEnvironment();
  }

  try {
    sharedState.env = await sharedState.initPromise;
    return sharedState.env;
  } finally {
    sharedState.initPromise = null;
  }
};

const stringifyError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const causeText = error.cause ? ` ${stringifyError(error.cause)}` : '';
  return `${error.message}${causeText}`;
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

  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const secondsValue =
    record.seconds ??
    (typeof record.toJSON === 'function'
      ? (record.toJSON() as { seconds?: unknown }).seconds
      : undefined);
  const nanosValue = record.nanos ?? 0;
  const seconds = Number(secondsValue);
  const nanos = Number(nanosValue);

  if (Number.isFinite(seconds) && Number.isFinite(nanos)) {
    return seconds * 1000 + Math.floor(nanos / 1_000_000);
  }

  return undefined;
};

const normalizeTemporalNativeHistory = (
  history: unknown,
): WorkflowTraceNativeHistory => {
  const historyRecord = toRecord(history);
  const rawEvents = Array.isArray(historyRecord.events)
    ? historyRecord.events
    : [];

  const events: WorkflowTraceNativeEvent[] = rawEvents.map((event, index) => {
    const record = toRecord(event);
    const rawId = record.eventId ?? record.id ?? index + 1;
    const rawType = record.eventType ?? record.type ?? 'TemporalEvent';
    const tsMs = toEpochMs(record.eventTime ?? record.timestamp);

    return {
      id: String(rawId),
      seq: index + 1,
      type: String(rawType),
      tsMs,
      attrs: toSerializable(record) as Record<string, unknown>,
    };
  });

  return {
    runtime: 'temporal',
    events,
  };
};

const createFailureTrace = (
  durationMs: number,
  error: string,
): WorkflowTraceBundle => {
  const events: WorkflowTraceEvent[] = [
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
    events,
    spans: [],
    nativeHistory: null,
    durationMs,
    warnings: [],
  };
};

const runTemporalWorkflow = async (
  env: TestWorkflowEnvironment,
  input: WorkflowInput,
): Promise<{
  outcome: WorkflowOutcome;
  events: WorkflowTraceEvent[];
  nativeHistory: WorkflowTraceNativeHistory | null;
  warnings: string[];
}> => {
  const taskQueue = `tq-${randomUUID()}`;

  const worker = await Worker.create({
    connection: env.nativeConnection,
    taskQueue,
    workflowsPath,
    activities: temporalActivities,
  });

  return worker.runUntil(async () => {
    const workflowId = `wf-${randomUUID()}`;
    const warnings: string[] = [];
    const handle = await env.client.workflow.start(
      runAgenticWorkflowWithTrace,
      {
        args: [input],
        taskQueue,
        workflowId,
        retry: {
          maximumAttempts: 1,
        },
      },
    );

    const result = (await handle.result()) as {
      outcome: WorkflowOutcome;
      events: WorkflowTraceEvent[];
    };

    let nativeHistory: WorkflowTraceNativeHistory | null = null;
    try {
      const history = await handle.fetchHistory();
      nativeHistory = normalizeTemporalNativeHistory(history);
    } catch (error) {
      warnings.push(
        `failed to fetch temporal history: ${stringifyError(error)}`,
      );
    }

    return {
      outcome: result.outcome,
      events: result.events ?? [],
      nativeHistory,
      warnings,
    };
  });
};

export const createTemporalRuntime = (): TemporalRuntime => {
  return {
    run: async (input) => {
      const startedAt = Date.now();
      try {
        const env = await getOrCreateEnvironment();
        const traced = await runTemporalWorkflow(env, input);
        const durationMs = Date.now() - startedAt;
        return {
          kind: 'success',
          durationMs,
          outcome: traced.outcome,
          trace: {
            version: 1,
            events: traced.events,
            spans: [],
            nativeHistory: traced.nativeHistory,
            durationMs,
            warnings: traced.warnings,
          },
        };
      } catch (error) {
        const durationMs = Date.now() - startedAt;
        const message = stringifyError(error);
        return {
          kind: 'failure',
          durationMs,
          error: message,
          trace: createFailureTrace(durationMs, message),
        };
      }
    },
    close: async () => {
      if (sharedState.env) {
        await sharedState.env.teardown();
        sharedState.env = null;
      }
      sharedState.initPromise = null;
    },
  };
};
