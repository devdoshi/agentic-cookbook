import { router } from './init.js';
import { scenariosRouter } from './routers/scenarios.js';
import { simulatorRouter } from './routers/simulator.js';

export const appRouter = router({
  simulator: simulatorRouter,
  scenarios: scenariosRouter,
});

export type AppRouter = typeof appRouter;
