import { afterAll, describe, expect, it } from 'vitest';
import { createTemporalRuntime } from '../runtime/createTemporalRuntime.js';

const runtime = createTemporalRuntime();

afterAll(async () => {
  await runtime.close();
});

describe('temporal runtime wrapper', () => {
  it('runs a basic workflow successfully', async () => {
    const result = await runtime.run({
      workflowId: 'runtime-temporal-basic',
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
      if (result.trace.nativeHistory) {
        expect(result.trace.nativeHistory.runtime).toBe('temporal');
      } else {
        expect(result.trace.warnings.join(' ')).toContain('history');
      }
    }
  });

  it('normalizes duplicate task id failures', async () => {
    const result = await runtime.run({
      workflowId: 'runtime-temporal-duplicate',
      mode: 'basic',
      tasks: [
        { id: 'dup', payload: 'alpha' },
        { id: 'dup', payload: 'beta' },
      ],
    });

    expect(result.kind).toBe('failure');
    if (result.kind === 'failure') {
      expect(result.error.toLowerCase()).toContain('duplicate task id');
      expect(result.trace.version).toBe(1);
    }
  });
});
