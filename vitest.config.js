import { defineConfig } from 'vitest/config';

// Standalone test config so the app's Vite plugins (PWA, etc.) don't load.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}', 'api/**/*.test.js'],
    // Placeholder Supabase creds so the client constructs at import time.
    // Tests never make real network calls — the vault suite only exercises
    // local crypto — so these values just need to be syntactically valid.
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
});
