import { describe, it, expect } from 'vitest';
import { createAiCache, aiCacheKey, clearAllAiResultCaches } from './aiResultCache';

describe('aiCacheKey', () => {
  it('is a SHA-256 hex digest that contains no readable prayer text', async () => {
    const input = { title: 'PLEASE-HEAL-JANE', description: 'a private situation' };
    const key = await aiCacheKey({ userId: 'u1', task: 'scripture_guidance', model: 'm', lang: 'en', input });
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain('JANE');
    expect(key).not.toContain('private');
  });

  it('separates cache entries by user id (no cross-account reuse)', async () => {
    const base = { task: 'scripture_guidance', model: 'm', lang: 'en', input: { title: 'same', description: '' } };
    const a = await aiCacheKey({ ...base, userId: 'user-a' });
    const b = await aiCacheKey({ ...base, userId: 'user-b' });
    expect(a).not.toBe(b);
  });

  it('changes when language, model, or input change', async () => {
    const base = { userId: 'u', task: 'scripture_guidance', model: 'm', lang: 'en', input: { title: 't', description: '' } };
    const k = await aiCacheKey(base);
    expect(await aiCacheKey({ ...base, lang: 'fr' })).not.toBe(k);
    expect(await aiCacheKey({ ...base, model: 'other' })).not.toBe(k);
    expect(await aiCacheKey({ ...base, input: { title: 't2', description: '' } })).not.toBe(k);
  });
});

describe('createAiCache + clearAllAiResultCaches', () => {
  it('stores and retrieves values, and a global clear empties every cache', () => {
    const a = createAiCache();
    const b = createAiCache();
    a.set('k', 1);
    b.set('k', 2);
    expect(a.get('k')).toBe(1);
    expect(b.get('k')).toBe(2);
    clearAllAiResultCaches();
    expect(a.has('k')).toBe(false);
    expect(b.has('k')).toBe(false);
  });
});
