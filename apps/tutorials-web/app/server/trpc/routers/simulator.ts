import { runWorkflowInRuntime } from '../../../lib/runtimeClients.server.js';
import {
  workflowRunRequestSchema,
  workflowRunResponseSchema,
} from '../../../lib/validators.js';
import { enrichTraceWithOtelSpans } from '../../tracing/otel.js';
import { publicProcedure, router } from '../init.js';

export const simulatorRouter = router({
  runWorkflow: publicProcedure
    .input(workflowRunRequestSchema)
    .output(workflowRunResponseSchema)
    .mutation(async ({ input }) => {
      const response = await runWorkflowInRuntime(input.runtime, input.input);
      const trace = await enrichTraceWithOtelSpans(
        response.trace,
        `${input.runtime}:${input.input.mode}`,
      );

      return {
        ...response,
        trace,
      };
    }),
});
