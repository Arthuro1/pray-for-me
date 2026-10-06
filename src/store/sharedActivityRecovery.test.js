import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
  Object.defineProperty(globalThis, 'navigator', {
    value: { language: 'de', userLanguage: 'de', onLine: true }, configurable: true,
  });
});

const db = vi.hoisted(() => ({ selects: [] }));

vi.mock('../lib/supabase', () => {
  const rows = {
    community_prayers: [{
      id: 'cp1', group_id: 'g1',
      prayer_points: [{ id: 'pt1', title: 'Readable group point', verses: [] }],
      encrypted_payload: null, encryption_version: null, key_version: null,
    }],
    community_updates: [{
      id: 'cup1', community_prayer_id: 'cp1', text: 'Readable group update',
      author_name: 'Cabrel', created_at: '2026-06-29T10:00:00Z',
    }],
    testimonies: [],
  };
  const query = (table) => {
    const chain = {
      select: (columns) => { db.selects.push({ table, columns }); return chain; },
      eq: () => chain,
      in: () => chain,
      order: () => chain,
      then: (resolve) => resolve({ data: rows[table] || [], error: null }),
    };
    return chain;
  };
  return {
    supabase: {
      from: (table) => query(table),
      auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
    },
  };
});

vi.mock('../lib/crypto/groupKeys', () => ({
  groupKeyResolver: (groupId) => Object.assign(async () => null, { groupId }),
}));

vi.mock('../lib/crypto/communityCrypto', () => ({
  decryptCommunityRow: async (_resolver, row) => ({ ...row, _locked: false }),
}));

import usePrayerStore from './prayerStore';

describe('fetchSharedActivity recovery snapshots', () => {
  beforeEach(() => { db.selects.length = 0; });

  it('fetches group prayer points alongside the readable activity timeline', async () => {
    const result = await usePrayerStore.getState().fetchSharedActivity({ id: 'p1' });

    expect(result.prayers[0].prayer_points[0].title).toBe('Readable group point');
    expect(result.updates[0].text).toBe('Readable group update');
    expect(result.testimonies).toEqual([]);
    expect(db.selects.find(({ table }) => table === 'community_prayers')?.columns)
      .toContain('prayer_points');
  });
});
