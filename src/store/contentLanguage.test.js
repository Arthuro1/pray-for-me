// Source-language metadata (content_language): stamped at creation from the
// active language, preserved when sharing a personal prayer to groups and when
// saving a community request personally, and carried through the OFFLINE write
// queue — it is metadata beside the E2EE envelope, never inside it, so legacy
// rows without it keep working (heuristic fallback, see langHint tests).
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.hoisted(() => {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true });
});

const rec = vi.hoisted(() => ({ writes: [] }));

vi.mock('../lib/supabase', () => {
  const result = { data: [], error: null, status: 200 };
  const makeQuery = (table) => {
    const chain = {
      upsert: (payload) => { rec.writes.push({ table, op: 'upsert', payload }); return chain; },
      update: (payload) => { rec.writes.push({ table, op: 'update', payload }); return chain; },
      insert: (payload) => { rec.writes.push({ table, op: 'insert', payload }); return chain; },
      delete: () => chain,
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      not: () => chain,
      order: () => chain,
      single: () => Promise.resolve({ ...result, data: { id: 'row-1' } }),
      maybeSingle: () => Promise.resolve({ ...result, data: null }),
      then: (resolve) => resolve(result),
    };
    return chain;
  };
  return {
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }),
        getUser: async () => ({ data: { user: { id: 'user-1' } } }),
      },
      from: (table) => makeQuery(table),
      rpc: async () => ({ data: null, error: null, status: 200 }),
    },
  };
});

// No group key in this test → community writes pass plaintext columns through,
// which lets us inspect the metadata beside them.
vi.mock('../lib/crypto/groupKeys', () => ({
  ensureGroupKey: async () => null,
  groupKeyResolver: () => async () => null,
}));

import '../lib/mutationExecutors';
import { pendingCount, flushQueue } from '../lib/mutationQueue';
import usePrayerStore from './prayerStore';
import useCommunityStore from './communityStore';
import { communityToPersonalInsert } from '../utils/prayer';

async function drainQueue() {
  for (let i = 0; i < 50 && pendingCount() > 0; i++) {
    await flushQueue();
    await new Promise((r) => setTimeout(r, 0));
  }
}

const writesTo = (table) => rec.writes.filter((w) => w.table === table);

beforeEach(() => {
  localStorage.clear();
  rec.writes.length = 0;
  usePrayerStore.setState({ prayers: [], userId: 'user-1', settings: { ...usePrayerStore.getState().settings, language: 'sw' } });
});

describe('content_language — creation and offline replay', () => {
  it('addPrayer stamps the active language and the stamp survives the queued (offline) write', async () => {
    await usePrayerStore.getState().addPrayer({ title: 'Maombi kwa ndugu' });
    // The optimistic in-memory prayer carries it immediately.
    expect(usePrayerStore.getState().prayers[0].content_language).toBe('sw');
    await drainQueue();
    const insert = writesTo('prayers').find((w) => w.op === 'insert' || w.op === 'upsert');
    expect(insert).toBeTruthy();
    expect(JSON.stringify(insert.payload)).toContain('"content_language":"sw"');
  });

  it('an explicit contentLanguage wins over the interface language', async () => {
    await usePrayerStore.getState().addPrayer({ title: 'Oración', contentLanguage: 'es' });
    expect(usePrayerStore.getState().prayers[0].content_language).toBe('es');
  });

  it('a CORRECTED language survives the queued (offline) create exactly like the default', async () => {
    await usePrayerStore.getState().addPrayer({ title: 'Oración', contentLanguage: 'es' });
    await drainQueue();
    const insert = writesTo('prayers').find((w) => w.op === 'insert' || w.op === 'upsert');
    expect(JSON.stringify(insert.payload)).toContain('"content_language":"es"');
  });
});

describe('content_language — correcting it later', () => {
  it('an edit writes the new language, in memory and through the queue', async () => {
    await usePrayerStore.getState().addPrayer({ title: 'Oración' }); // stamped 'sw'
    const id = usePrayerStore.getState().prayers[0].id;
    rec.writes.length = 0;

    await usePrayerStore.getState().updatePrayer(id, { contentLanguage: 'es' });
    expect(usePrayerStore.getState().prayers[0].content_language).toBe('es');
    await drainQueue();
    const update = writesTo('prayers').find((w) => w.op === 'update' || w.op === 'upsert');
    expect(JSON.stringify(update.payload)).toContain('"content_language":"es"');
  });

  it('an unrelated edit leaves the existing stamp alone', async () => {
    await usePrayerStore.getState().addPrayer({ title: 'Oración', contentLanguage: 'es' });
    const id = usePrayerStore.getState().prayers[0].id;
    await usePrayerStore.getState().updatePrayer(id, { title: 'Oración por mamá' });
    expect(usePrayerStore.getState().prayers[0].content_language).toBe('es');
  });

  it('a corrected personal prayer shares into the group under the corrected language', async () => {
    await useCommunityStore.getState().setPrayerShares({
      prayer: { id: 'p1', title: 'Oración', content_language: 'es', prayer_categories: [], prayer_points: [], prayer_updates: [] },
      groupIds: ['g1'],
      userId: 'user-1',
      authorName: 'A',
      isAnonymous: false,
    });
    expect(writesTo('community_prayers').find((w) => w.op === 'insert').payload.content_language).toBe('es');
  });

  it('editing a community request can correct its language, and omitting it never wipes the stamp', async () => {
    useCommunityStore.setState({ prayers: [{ id: 'cp1', group_id: 'g1', title: 'T', description: '', prayer_points: [], content_language: 'ko' }] });

    await useCommunityStore.getState().updatePrayer({ prayerId: 'cp1', title: 'T', description: '', isAnonymous: false, categoryIds: [], contentLanguage: 'es' });
    expect(writesTo('community_prayers').find((w) => w.op === 'update').payload.content_language).toBe('es');
    expect(useCommunityStore.getState().prayers[0].content_language).toBe('es');

    rec.writes.length = 0;
    await useCommunityStore.getState().updatePrayer({ prayerId: 'cp1', title: 'T2', description: '', isAnonymous: false, categoryIds: [] });
    expect(writesTo('community_prayers').find((w) => w.op === 'update').payload).not.toHaveProperty('content_language');
    expect(useCommunityStore.getState().prayers[0].content_language).toBe('es');
  });
});

describe('content_language — sharing and saving preserve the source language', () => {
  it('sharing a personal prayer to a group copies its content_language into the community row', async () => {
    await useCommunityStore.getState().setPrayerShares({
      prayer: { id: 'p1', title: 'Bön för mor', content_language: 'de', prayer_categories: [], prayer_points: [], prayer_updates: [] },
      groupIds: ['g1'],
      userId: 'user-1',
      authorName: 'A',
      isAnonymous: false,
    });
    const insert = writesTo('community_prayers').find((w) => w.op === 'insert');
    expect(insert.payload.content_language).toBe('de');
  });

  it('a new community request stamps the writer’s language; group updates and testimonies do too', async () => {
    await useCommunityStore.getState().addPrayer({ groupId: 'g1', userId: 'user-1', authorName: 'A', title: 'T', description: '', isAnonymous: false, categoryIds: [], contentLanguage: 'ko' });
    expect(writesTo('community_prayers').find((w) => w.op === 'insert').payload.content_language).toBe('ko');

    await useCommunityStore.getState().addUpdate({ prayerId: 'cp1', userId: 'user-1', authorName: 'A', text: 'news', isAnonymous: false, contentLanguage: 'ko' });
    expect(writesTo('community_updates').find((w) => w.op === 'insert').payload.content_language).toBe('ko');

    await useCommunityStore.getState().addTestimony({ groupId: 'g1', userId: 'user-1', authorName: 'A', content: 'praise', isAnonymous: false, communityPrayerId: 'cp1', contentLanguage: 'ko' });
    expect(writesTo('testimonies').find((w) => w.op === 'insert').payload.content_language).toBe('ko');
  });

  it('saving a community request personally keeps the AUTHOR’s language, not the saver’s', () => {
    const row = communityToPersonalInsert({ id: 'c1', title: '기도', content_language: 'ko', is_anonymous: false, author_name: 'B' }, 'Groupe', 'user-1');
    expect(row.content_language).toBe('ko');
  });

  it('a legacy community row without metadata saves as null (heuristic fallback applies)', () => {
    const row = communityToPersonalInsert({ id: 'c2', title: 'Old row', is_anonymous: false, author_name: 'B' }, 'Groupe', 'user-1');
    expect(row.content_language).toBeNull();
  });
});
