import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock every external source so the tests exercise ONLY the fallback ordering
// and the "no AI-generated Scripture" guarantee — no network, no storage.
vi.mock('./youversion', () => ({
  youVersionEnabled: vi.fn(() => false),
  fetchYouVersionPassage: vi.fn(async () => ({ data: null })),
}));
vi.mock('./bibleRef', () => ({
  versionForLang: vi.fn(() => 111),
  referenceToUsfm: vi.fn(async () => 'JHN.3.16'),
}));
vi.mock('./supabase', () => {
  // Chainable stub: verse_cache lookups always miss; upsert is a no-op.
  const chain = {
    select() { return this; },
    eq() { return this; },
    maybeSingle: async () => ({ data: null }),
    upsert() { return { then: (resolve) => resolve({}) }; },
  };
  return { supabase: { from: () => chain } };
});

import { youVersionEnabled, fetchYouVersionPassage } from './youversion';
import { fetchVerseText } from './verseText';

describe('fetchVerseText — authoritative-only Scripture', () => {
  beforeEach(() => {
    vi.mocked(youVersionEnabled).mockReturnValue(false);
    vi.mocked(fetchYouVersionPassage).mockResolvedValue({ data: null });
    try { localStorage.clear?.(); } catch { /* no storage in node env */ }
  });

  it('returns reference-only (no text, no error) when no authoritative source is available', async () => {
    // The critical safety regression: with YouVersion off and nothing cached, we
    // must NOT invent verse text — data is null so the reader shows the reference.
    const { data, error } = await fetchVerseText({ reference: 'John 3:16', lang: 'en' });
    expect(data).toBeNull();
    expect(error).toBeNull();
  });

  it('never returns AI-sourced text', async () => {
    const { data } = await fetchVerseText({ reference: 'Psalm 23:1', lang: 'en' });
    // Either null (reference-only) or, if a source served it, never 'ai'.
    expect(data?.source).not.toBe('ai');
  });

  it('serves authoritative YouVersion text when configured, labelled as youversion', async () => {
    vi.mocked(youVersionEnabled).mockReturnValue(true);
    vi.mocked(fetchYouVersionPassage).mockResolvedValue({ data: { text: 'For God so loved the world', reference: 'John 3:16' } });
    const { data } = await fetchVerseText({ reference: 'John 3:16', lang: 'en' });
    expect(data?.text).toMatch(/loved the world/);
    expect(data?.source).toBe('youversion');
  });

  it('returns empty (no error) for a missing reference', async () => {
    const { data, error } = await fetchVerseText({ reference: '', lang: 'en' });
    expect(data).toBeNull();
    expect(error).toBeNull();
  });
});
