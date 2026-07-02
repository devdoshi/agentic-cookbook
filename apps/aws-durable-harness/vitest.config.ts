import { vitestBase } from '@agentic-cookbook/test-kit';
import { mergeConfig } from 'vitest/config';

export default mergeConfig(vitestBase, {
  test: {
    include: ['src/__tests__/**/*.test.ts'],
  },
});
