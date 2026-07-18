// @vitest-environment jsdom
//
// Low data mode defers NONESSENTIAL remote fetching: verse text not already on
// the device stays a reference (no shared-cache query, no YouVersion call),
// while bundled/cached text still serves instantly and offline.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const spy = vi.hoisted(() => ({ sharedQueries: 0 }));

vi.mock('./youversion', () => ({
  youVersionEnabled: vi.fn(() => true),
  fetchYouVersionPassage: vi.fn(async () => ({ data: { text: 'remote text', reference: 'John 3:16' } })),
}));
vi.mock('./bibleRef', () => ({
  versionForLang: vi.fn(() => 111),
  versionSupportsUsfm: vi.fn(() => true),
  referenceToUsfm: vi.fn(async () => 'JHN.3.16'),
  usfmFromReference: vi.fn(() => 'JHN.3.16'),
}));
vi.mock('./verseBundle', () => ({
  getBundledVerse: vi.fn(async () => null),
}));
vi.mock('./supabase', () => {
  const chain = {
    select() { spy.sharedQueries++; return this; },
    eq() { return this; },
    maybeSingle: async () => ({ data: null }),
    upsert() { return { then: (resolve) => resolve({}) }; },
  };
  return { supabase: { from: () => chain } };
});

import { fetchVerseText, fetchScriptureText } from './verseText';
import { fetchYouVersionPassage } from './youversion';
import { getBundledVerse } from './verseBundle';

const setLowData = (on) => localStorage.setItem('pfm_settings', JSON.stringify({ lowDataMode: on }));

beforeEach(() => {
  localStorage.clear();
  spy.sharedQueries = 0;
  vi.mocked(fetchYouVersionPassage).mockClear();
  vi.mocked(getBundledVerse).mockResolvedValue(null);
});

describe('verse text under low data mode', () => {
  it('defers every remote lookup — reference-only, no shared cache, no YouVersion', async () => {
    setLowData(true);
    const { data, error } = await fetchVerseText({ reference: 'John 3:16', lang: 'en' });
    expect(data).toBeNull();
    expect(error).toBeNull();
    expect(spy.sharedQueries).toBe(0);
    expect(fetchYouVersionPassage).not.toHaveBeenCalled();

    const res = await fetchScriptureText({ reference: 'John 3:16', lang: 'en' });
    expect(res).toBeNull();
    expect(fetchYouVersionPassage).not.toHaveBeenCalled();
  });

  it('still serves the offline bundle instantly', async () => {
    setLowData(true);
    vi.mocked(getBundledVerse).mockResolvedValue({ text: 'bundled text', ref: 'John 3:16', source: 'bundle' });
    const { data } = await fetchVerseText({ reference: 'John 3:16', lang: 'en' });
    expect(data?.text).toBe('bundled text');
    expect(fetchYouVersionPassage).not.toHaveBeenCalled();
  });

  it('still serves text already cached on this device', async () => {
    setLowData(true);
    localStorage.setItem('verseText:en:JHN.3.16', JSON.stringify({ text: 'cached text', ref: 'John 3:16', source: 'youversion' }));
    const { data } = await fetchVerseText({ reference: 'John 3:16', lang: 'en' });
    expect(data?.text).toBe('cached text');
    expect(fetchYouVersionPassage).not.toHaveBeenCalled();
  });

  it('fetches normally when low data mode is off', async () => {
    setLowData(false);
    const { data } = await fetchVerseText({ reference: 'John 3:16', lang: 'en' });
    expect(data?.text).toBe('remote text');
    expect(fetchYouVersionPassage).toHaveBeenCalled();
  });
});
