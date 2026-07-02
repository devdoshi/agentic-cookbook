import { describe, expect, it } from 'vitest';
import {
  scenarioRunRequestSchema,
  scenarioRunResponseSchema,
  workflowRunRequestSchema,
  workflowRunResponseSchema,
} from '../validators.js';

describe('request validators', () => {
  it('accepts valid workflow run payload', () => {
    const result = workflowRunRequestSchema.safeParse({
      runtime: 'temporal',
      input: {
        workflowId: 'wf-1',
        mode: 'basic',
        tasks: [{ id: 'a', payload: 'alpha' }],
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid workflow run payload', () => {
    const result = workflowRunRequestSchema.safeParse({
      runtime: 'temporal',
      input: {
        workflowId: '',
        mode: 'basic',
        tasks: [],
      },
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid scenario run payload', () => {
    const result = scenarioRunRequestSchema.safeParse({
      runtime: 'aws-durable',
      scenarioGroup: 'recipe-vectors',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid scenario group', () => {
    const result = scenarioRunRequestSchema.safeParse({
      runtime: 'aws-durable',
      scenarioGroup: 'made-up-group',
    });

    expect(result.success).toBe(false);
  });

  it('accepts workflow run response with trace', () => {
    const result = workflowRunResponseSchema.safeParse({
      kind: 'success',
      durationMs: 12,
      outcome: {
        workflowId: 'wf-1',
        mode: 'basic',
        status: 'complete',
        aggregate: {
          values: ['alpha-done'],
          totalScore: 10,
          averageScore: 10,
        },
        completedTaskIds: ['a'],
        pendingTaskIds: [],
        reason: 'all tasks completed',
      },
      trace: {
        version: 1,
        events: [],
        spans: [],
        nativeHistory: null,
        durationMs: 12,
        warnings: [],
      },
    });

    expect(result.success).toBe(true);
  });

  it('accepts scenario run response with trace items', () => {
    const result = scenarioRunResponseSchema.safeParse({
      summary: {
        total: 1,
        passed: 1,
        failed: 0,
        durationMs: 5,
      },
      results: [
        {
          scenarioName: 'recipe-basic',
          passed: true,
          details: 'status matched',
          trace: {
            version: 1,
            events: [],
            spans: [],
            nativeHistory: null,
            durationMs: 5,
            warnings: [],
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
