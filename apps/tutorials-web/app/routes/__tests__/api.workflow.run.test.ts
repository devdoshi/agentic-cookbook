import { afterAll, describe, expect, it } from 'vitest';
import { closeRuntimes } from '../../lib/runtimeClients.server.js';
import { action } from '../api.workflow.run.js';

describe('/api/workflow/run action', () => {
  afterAll(async () => {
    await closeRuntimes();
  });

  it('returns validation error for malformed payload', async () => {
    const request = new Request('http://example.test/api/workflow/run', {
      method: 'POST',
      body: JSON.stringify({ runtime: 'temporal' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await action({ request });
    const payload = (await response.json()) as { kind: string; error?: string };

    expect(response.status).toBe(400);
    expect(payload.kind).toBe('failure');
    expect(payload.error).toBeTruthy();
    expect((payload as { trace?: { version?: number } }).trace?.version).toBe(
      1,
    );
  });

  it('runs a basic workflow in aws durable runtime', async () => {
    const request = new Request('http://example.test/api/workflow/run', {
      method: 'POST',
      body: JSON.stringify({
        runtime: 'aws-durable',
        input: {
          workflowId: 'api-aws-basic',
          mode: 'basic',
          tasks: [
            { id: 'a', payload: 'alpha' },
            { id: 'b', payload: 'beta' },
          ],
        },
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await action({ request });
    const payload = (await response.json()) as {
      kind: string;
      outcome?: { status: string };
      error?: string;
      trace?: { events?: unknown[] };
    };

    expect(response.status).toBe(200);
    if (payload.kind === 'success') {
      expect(payload.outcome?.status).toBe('complete');
      expect(payload.trace?.events?.length).toBeGreaterThan(0);
    } else {
      throw new Error(`workflow run failed unexpectedly: ${payload.error}`);
    }
  });
});
