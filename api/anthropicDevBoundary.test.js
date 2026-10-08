import { describe, expect, it } from 'vitest';
import configFactory from '../vite.config.js';

describe('Vite self-hosted AI development boundary', () => {
  it('uses the shared server handler instead of a direct provider proxy', () => {
    const config = configFactory({ mode: 'test' });
    expect(config.plugins.some((plugin) => plugin?.name === 'pray4me-ai-api')).toBe(true);
    expect(config.server?.proxy?.['/api/ai']).toBeUndefined();
    expect(config.server?.proxy?.['/api/anthropic']).toBeUndefined();
  });
});
