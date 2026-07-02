import { defineConfig } from 'vitest/config';

export const vitestBase = defineConfig({
  test: {
    environment: 'node',
    globals: true,
    reporters: ['default'],
  },
});
