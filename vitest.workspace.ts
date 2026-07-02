import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/workflow-spec/vitest.config.ts',
  'apps/temporal-harness/vitest.config.ts',
  'apps/aws-durable-harness/vitest.config.ts',
  'apps/tutorials-web/vitest.config.ts',
]);
