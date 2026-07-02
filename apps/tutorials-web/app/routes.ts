import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('getting-started', 'routes/getting-started.tsx'),
  route('tutorials/hello-world', 'routes/tutorials.hello-world.tsx'),
  route('runtime/semantics', 'routes/runtime.semantics.tsx'),
  route('recipes/:slug', 'routes/recipes.$slug.tsx'),
  route('scenarios', 'routes/scenarios.tsx'),
  route('api/workflow/run', 'routes/api.workflow.run.ts'),
  route('api/scenario/run', 'routes/api.scenario.run.ts'),
] satisfies RouteConfig;
