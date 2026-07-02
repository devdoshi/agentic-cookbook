import { runScenarioRequest } from '../../../lib/scenarioRunner.server.js';
import {
  scenarioRunRequestSchema,
  scenarioRunResponseSchema,
} from '../../../lib/validators.js';
import { enrichTraceWithOtelSpans } from '../../tracing/otel.js';
import { publicProcedure, router } from '../init.js';

export const scenariosRouter = router({
  runScenarioGroup: publicProcedure
    .input(scenarioRunRequestSchema)
    .output(scenarioRunResponseSchema)
    .mutation(async ({ input }) => {
      const response = await runScenarioRequest(input);
      const tracedResults = await Promise.all(
        response.results.map(async (item) => {
          if (!item.trace) {
            return item;
          }

          return {
            ...item,
            trace: await enrichTraceWithOtelSpans(
              item.trace,
              `${input.runtime}:${input.scenarioGroup}:${item.scenarioName}`,
            ),
          };
        }),
      );

      return {
        ...response,
        results: tracedResults,
      };
    }),
});
