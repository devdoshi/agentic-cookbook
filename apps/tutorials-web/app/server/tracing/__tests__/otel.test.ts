import type { WorkflowTraceBundle } from '@agentic-cookbook/workflow-spec';
import { describe, expect, it } from 'vitest';
import { enrichTraceWithOtelSpans } from '../otel.js';

describe('enrichTraceWithOtelSpans', () => {
  it('converts normalized events into in-memory OTel spans', async () => {
    const traceBundle: WorkflowTraceBundle = {
      version: 1,
      events: [
        {
          id: 'evt-1',
          seq: 1,
          lane: 'workflow',
          phase: 'start',
          name: 'workflow.start',
          attrs: {},
        },
        {
          id: 'evt-2',
          seq: 2,
          lane: 'task',
          phase: 'start',
          name: 'task.execute',
          taskId: 'a',
          attrs: {},
        },
        {
          id: 'evt-3',
          seq: 3,
          lane: 'task',
          phase: 'end',
          name: 'task.execute',
          taskId: 'a',
          attrs: { score: 5 },
        },
        {
          id: 'evt-4',
          seq: 4,
          lane: 'workflow',
          phase: 'end',
          name: 'workflow.end',
          attrs: { status: 'complete' },
        },
      ],
      spans: [],
      nativeHistory: null,
      durationMs: 20,
      warnings: [],
    };

    const enriched = await enrichTraceWithOtelSpans(traceBundle, 'test-run');

    expect(enriched.spans.length).toBeGreaterThan(0);
    expect(
      enriched.spans.some((span) => span.name.includes('task.execute')),
    ).toBe(true);
    expect(
      enriched.spans.find((span) => span.name.startsWith('run:')),
    ).toBeTruthy();
  });
});
