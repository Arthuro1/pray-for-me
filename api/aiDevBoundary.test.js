import { describe, expect, it } from 'vitest';
import configFactory from '../vite.config.js';

describe('Vite AI development boundary', () => {
  it('routes /api/ai through the shared same-origin forwarder, not a direct provider proxy', () => {
    const config = configFactory({ mode: 'test' });
    // The forwarder middleware is installed…
    expect(config.plugins.some((plugin) => plugin?.name === 'pray4me-ai-api')).toBe(true);
    // …and there is no direct browser proxy to /api/ai or any AI provider.
    expect(config.server?.proxy?.['/api/ai']).toBeUndefined();
    expect(config.server?.proxy?.['/api/anthropic']).toBeUndefined();
  });
});
