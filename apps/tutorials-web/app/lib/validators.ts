import { z } from 'zod';
import type { ScenarioRunRequest, WorkflowRunRequest } from '../types.js';

const taskSchema = z.object({
  id: z.string().min(1),
  payload: z.string(),
  metadata: z.record(z.string(), z.string()).optional(),
});

const workflowInputSchema = z.object({
  workflowId: z.string().min(1),
  mode: z.enum(['basic', 'ai-complete', 'quorum-timeout']),
  tasks: z.array(taskSchema),
  quorum: z.number().int().positive().optional(),
  timeoutMs: z.number().int().positive().optional(),
  minimumJudgeScore: z.number().min(0).max(1).optional(),
});

const traceAttrSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

const traceEventSchema = z.object({
  id: z.string().min(1),
  seq: z.number().int().positive(),
  lane: z.enum(['workflow', 'task', 'judge', 'runtime', 'system']),
  phase: z.enum(['start', 'end', 'point']),
  name: z.string().min(1),
  tsMs: z.number().optional(),
  taskId: z.string().optional(),
  attrs: z.record(z.string(), traceAttrSchema),
});

const traceSpanSchema = z.object({
  id: z.string().min(1),
  parentId: z.string().optional(),
  name: z.string().min(1),
  lane: z.enum(['workflow', 'task', 'judge', 'runtime', 'system']),
  startTimeMs: z.number(),
  endTimeMs: z.number(),
  status: z.enum(['ok', 'error']),
  attrs: z.record(z.string(), z.unknown()),
});

const nativeTraceEventSchema = z.object({
  id: z.string().min(1),
  seq: z.number().int().positive(),
  type: z.string().min(1),
  tsMs: z.number().optional(),
  attrs: z.record(z.string(), z.unknown()),
});

const traceBundleSchema = z.object({
  version: z.literal(1),
  events: z.array(traceEventSchema),
  spans: z.array(traceSpanSchema),
  nativeHistory: z
    .object({
      runtime: z.enum(['temporal', 'aws-durable', 'unknown']),
      events: z.array(nativeTraceEventSchema),
    })
    .nullable(),
  durationMs: z.number().min(0),
  warnings: z.array(z.string()),
});

const aggregateSchema = z.object({
  values: z.array(z.string()),
  totalScore: z.number(),
  averageScore: z.number(),
});

const workflowOutcomeSchema = z.object({
  workflowId: z.string(),
  mode: z.enum(['basic', 'ai-complete', 'quorum-timeout']),
  status: z.enum(['complete', 'partial', 'timeout']),
  aggregate: aggregateSchema,
  completedTaskIds: z.array(z.string()),
  pendingTaskIds: z.array(z.string()),
  reason: z.string(),
  judgeScore: z.number().optional(),
});

export const workflowRunResponseSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('success'),
    durationMs: z.number().min(0),
    outcome: workflowOutcomeSchema,
    trace: traceBundleSchema,
  }),
  z.object({
    kind: z.literal('failure'),
    durationMs: z.number().min(0),
    error: z.string(),
    trace: traceBundleSchema,
  }),
]);

const scenarioRunItemSchema = z.object({
  scenarioName: z.string().min(1),
  passed: z.boolean(),
  details: z.string(),
  trace: traceBundleSchema.optional(),
});

export const scenarioRunResponseSchema = z.object({
  summary: z.object({
    total: z.number().int().nonnegative(),
    passed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    durationMs: z.number().min(0),
  }),
  results: z.array(scenarioRunItemSchema),
});

export const workflowRunRequestSchema = z.object({
  runtime: z.enum(['temporal', 'aws-durable']),
  input: workflowInputSchema,
  presetId: z.string().optional(),
}) satisfies z.ZodType<WorkflowRunRequest>;

export const scenarioRunRequestSchema = z.object({
  runtime: z.enum(['temporal', 'aws-durable']),
  scenarioGroup: z.enum([
    'recipe-vectors',
    'durable-determinism',
    'durable-errors',
  ]),
  scenarioName: z.string().optional(),
}) satisfies z.ZodType<ScenarioRunRequest>;
