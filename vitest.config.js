import { defineConfig } from 'vitest/config';

// Standalone test config so the app's Vite plugins (PWA, etc.) don't load.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}', 'api/**/*.test.js'],
  },
});
