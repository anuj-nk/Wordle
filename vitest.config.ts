import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['shared/src/**/*.test.ts', 'server/src/**/*.test.ts'],
    environment: 'node'
  },
  resolve: {
    alias: {
      '@wordle/shared': new URL('./shared/src/index.ts', import.meta.url).pathname
    }
  }
});
