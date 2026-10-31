import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    'import.meta.env.SITE': JSON.stringify('http://localhost:4321/')
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    include: ['tests/unit/**/*.test.ts']
  }
});
