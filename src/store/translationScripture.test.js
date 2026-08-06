// Canonical Scripture must NEVER travel through the AI translation path —
// verse text is localized only via the offline bundle / YouVersion
// (useLocalizedVerse); prayer wording is what AI translation may touch.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.hoisted(() => {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
});

const calls = vi.hoisted(() => ({ requests: [] }));

vi.mock('../lib/aiClient', () => ({
  aiEnabled: true,
  aiFetch: vi.fn(async (task, input) => {
    calls.requests.push({ task, input });
    const translations = Object.fromEntries(input.texts.map((_, index) => [index, `translated-${index}`]));
    return { ok: true, json: async () => ({ data: { translations } }) };
  }),
}));

vi.mock('../lib/supabase', () => {
  const chain = {
    upsert: () => Promise.resolve({ data: null, error: null }),
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    then: (resolve) => resolve({ data: [], error: null }),
  };
  return { supabase: { from: () => chain } };
});

import useTranslationStore from './translationStore';

beforeEach(() => { calls.requests.length = 0; });

describe('translateContent — Scripture exclusion', () => {
  it('sends prayer wording but never verse text to the AI', async () => {
    const prayers = [{
      title: 'Pour la paix de Marc',
      description: 'Une situation difficile au travail',
      prayer_updates: [{ text: 'Des nouvelles encourageantes' }],
      prayer_points: [{
        title: 'Prier pour la confiance',
        verse_text: 'L\'Éternel est mon berger: je ne manquerai de rien.',
        verses: [{ ref: 'Psaume 23:1', text: 'L\'Éternel est mon berger: je ne manquerai de rien.' }],
      }],
    }];
    await useTranslationStore.getState().translateContent(prayers, [], 'en', 'user-1');
    const sent = JSON.stringify(calls.requests);
    expect(calls.requests[0]?.task).toBe('translate_texts');
    expect(sent).toContain('Pour la paix de Marc');
    expect(sent).toContain('Prier pour la confiance');
    expect(sent).not.toContain('mon berger');
  });
});
