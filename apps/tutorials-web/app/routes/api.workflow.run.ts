import { workflowRunRequestSchema } from '../lib/validators.js';
import { createServerTrpcCaller } from '../server/trpc/caller.js';

export const action = async ({ request }: { request: Request }) => {
  const body = await request.json();
  const parsed = workflowRunRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        kind: 'failure',
        durationMs: 0,
        error: parsed.error.issues.map((issue) => issue.message).join('; '),
        trace: {
          version: 1,
          events: [],
          spans: [],
          nativeHistory: null,
          durationMs: 0,
          warnings: ['validation failed before workflow dispatch'],
        },
      },
      { status: 400 },
    );
  }

  const caller = await createServerTrpcCaller();
  const response = await caller.simulator.runWorkflow(parsed.data);
  return Response.json(response);
};
