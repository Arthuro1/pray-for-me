import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    include: ['src/**/*.browser.spec.{js,jsx}'],
    browser: {
      enabled: true,
      provider: playwright({
        launchOptions: {
          channel: 'chrome',
          headless: true,
        },
      }),
      instances: [
        { browser: 'chromium' },
      ],
    },
  },
});
