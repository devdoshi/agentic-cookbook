import { afterAll, describe, expect, it } from 'vitest';
import { closeRuntimes } from '../../lib/runtimeClients.server.js';
import { action } from '../api.scenario.run.js';

describe('/api/scenario/run action', () => {
  afterAll(async () => {
    await closeRuntimes();
  });

  it('returns validation payload for malformed body', async () => {
    const request = new Request('http://example.test/api/scenario/run', {
      method: 'POST',
      body: JSON.stringify({ runtime: 'temporal' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await action({ request });
    const payload = (await response.json()) as {
      summary: { failed: number };
      results: Array<{ passed: boolean }>;
    };

    expect(response.status).toBe(400);
    expect(payload.summary.failed).toBe(0);
    expect(payload.results[0]?.passed).toBe(false);
  });

  it('runs recipe vector scenarios in aws durable runtime', async () => {
    const request = new Request('http://example.test/api/scenario/run', {
      method: 'POST',
      body: JSON.stringify({
        runtime: 'aws-durable',
        scenarioGroup: 'recipe-vectors',
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await action({ request });
    const payload = (await response.json()) as {
      summary: { total: number; passed: number };
      results: Array<{ trace?: { events: unknown[] } }>;
    };

    expect(response.status).toBe(200);
    expect(payload.summary.total).toBeGreaterThan(0);
    expect(payload.summary.passed).toBeGreaterThan(0);
    expect(payload.results[0]?.trace?.events.length).toBeGreaterThan(0);
  });
});
