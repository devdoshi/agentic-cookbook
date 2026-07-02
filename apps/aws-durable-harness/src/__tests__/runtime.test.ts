import { afterAll, describe, expect, it } from 'vitest';
import { createAwsDurableRuntime } from '../runtime/createAwsDurableRuntime.js';

const runtime = createAwsDurableRuntime();

afterAll(async () => {
  await runtime.close();
});

describe('aws durable runtime wrapper', () => {
  it('runs a basic workflow successfully', async () => {
    const result = await runtime.run({
      workflowId: 'runtime-aws-basic',
      mode: 'basic',
      tasks: [
        { id: 'a', payload: 'alpha' },
        { id: 'b', payload: 'beta' },
      ],
    });

    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.kind).toBe('success');
    if (result.kind === 'success') {
      expect(result.outcome.status).toBe('complete');
      expect(result.trace.version).toBe(1);
      expect(result.trace.events.length).toBeGreaterThan(0);
      expect(result.trace.nativeHistory?.runtime).toBe('aws-durable');
      expect(result.trace.nativeHistory?.events.length).toBeGreaterThan(0);
    }
  });

  it('captures task execution failures', async () => {
    const result = await runtime.run({
      workflowId: 'runtime-aws-fail',
      mode: 'basic',
      tasks: [{ id: 'bad', payload: 'fail:explode' }],
    });

    expect(result.kind).toBe('failure');
    if (result.kind === 'failure') {
      expect(result.error).toContain('simulated task failure');
      expect(result.trace.version).toBe(1);
    }
  });
});
