import { scenarioRunRequestSchema } from '../lib/validators.js';
import { createServerTrpcCaller } from '../server/trpc/caller.js';

export const action = async ({ request }: { request: Request }) => {
  const body = await request.json();
  const parsed = scenarioRunRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        summary: {
          total: 0,
          passed: 0,
          failed: 0,
          durationMs: 0,
        },
        results: [
          {
            scenarioName: 'validation-error',
            passed: false,
            details: parsed.error.issues
              .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
              .join('; '),
          },
        ],
      },
      { status: 400 },
    );
  }

  const caller = await createServerTrpcCaller();
  return Response.json(await caller.scenarios.runScenarioGroup(parsed.data));
};
