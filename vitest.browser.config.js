import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  // Browser mode pre-bundles deps per-package, which can give @testing-library
  // its own React copy separate from the app's — leaving the hooks dispatcher
  // null ("Cannot read properties of null (reading 'useState')"). Dedupe React
  // and co-bundle it with RTL so component specs share one React instance.
  resolve: { dedupe: ['react', 'react-dom'] },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-dev-runtime', '@testing-library/react'],
  },
  test: {
    include: ['src/**/*.browser.spec.{js,jsx}'],
    // Placeholder Supabase creds so any module that constructs the client at
    // import time doesn't throw. Browser specs exercise secret-free flows (the
    // guest prayer path makes no server calls) — these are never used on the wire.
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
    browser: {
      enabled: true,
      provider: playwright({
        launchOptions: {
          channel: 'chrome',
          headless: true,
          // Required to launch Chrome in CI containers / sandboxes; harmless on a
          // developer machine.
          args: ['--no-sandbox', '--disable-dev-shm-usage'],
        },
      }),
      instances: [
        { browser: 'chromium' },
      ],
    },
  },
});
