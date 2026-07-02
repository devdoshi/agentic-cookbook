import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [reactRouter()],
  ssr: {
    external: [
      '@agentic-cookbook/aws-durable-harness',
      '@agentic-cookbook/temporal-harness',
      '@agentic-cookbook/test-kit',
    ],
  },
});
