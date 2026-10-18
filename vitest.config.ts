import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    pool: 'forks',
    include: ['__tests__/**/*.test.ts'],
    server: {
      deps: {
        external: ['better-sqlite3'],
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});
