// The encrypted import: a saved guest prayer becomes an account prayer through
// the NORMAL encrypted path — never plaintext, never before the key is ready, and
// exactly once even under repeated (StrictMode) effects. A prayed guest prayer
// also records today's completion.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Shims installed before the store/crypto modules import (they read localStorage
// at init). A truthy `indexedDB` routes the guest draft through its persistent
// path; navigator.onLine keeps the mutation queue flushing.
const idbStore = vi.hoisted(() => new Map());
vi.hoisted(() => {
  globalThis.indexedDB = {};
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true });
});

vi.mock('idb-keyval', () => ({
  get: async (k) => idbStore.get(k),
  set: async (k, v) => { idbStore.set(k, v); },
  del: async (k) => { idbStore.delete(k); },
}));

// Recording Supabase double — captures every table write so we can prove what did
// (and did not) reach the server.
const rec = vi.hoisted(() => ({ writes: [], rpcs: [] }));
vi.mock('./supabase', () => {
  const result = { data: [], error: null, status: 200 };
  const makeQuery = (table) => {
    const chain = {
      upsert: (payload) => { rec.writes.push({ table, op: 'upsert', payload }); return chain; },
      update: (payload) => { rec.writes.push({ table, op: 'update', payload }); return chain; },
      insert: (payload) => { rec.writes.push({ table, op: 'insert', payload }); return chain; },
      delete: () => chain, select: () => chain, eq: () => chain, in: () => chain, not: () => chain, order: () => chain,
      single: () => Promise.resolve({ ...result, data: null }),
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
      rpc: async (name, args) => { rec.rpcs.push({ name, args }); return { data: null, error: null, status: 200 }; },
    },
  };
});

import '../lib/mutationExecutors';
import { pendingCount, flushQueue } from '../lib/mutationQueue';
import { autoInitAccountKey, lock } from '../lib/crypto/keyManager';
import usePrayerStore from '../store/prayerStore';
import { saveGuestDraft, clearGuestDraft, __resetMemoryForTests } from './guestPrayerDraft';
import { importGuestPrayerOnce, __resetImportForTests } from './guestPrayerImport';

async function drainQueue() {
  for (let i = 0; i < 50 && pendingCount() > 0; i++) {
    await flushQueue();
    await new Promise((r) => setTimeout(r, 0));
  }
}

const prayersWrites = () => rec.writes.filter((w) => w.table === 'prayers');
const SECRET = 'SECRET_pray_for_my_marriage';

beforeEach(async () => {
  idbStore.clear();
  localStorage.clear();
  rec.writes.length = 0;
  rec.rpcs.length = 0;
  lock();
  __resetMemoryForTests();
  __resetImportForTests();
  usePrayerStore.setState({ prayers: [], completions: {}, userId: 'user-1' });
});

describe('importGuestPrayerOnce', () => {
  it('waits for the account key — no server write while the vault is locked', async () => {
    await saveGuestDraft({ title: SECRET, completed: true, contentLanguage: 'en' });
    const res = await importGuestPrayerOnce(); // vault is locked
    await drainQueue();

    expect(res).toMatchObject({ imported: false, reason: 'locked' });
    expect(prayersWrites().length).toBe(0);
    // The draft is untouched, so a later (unlocked) attempt can still import it.
    expect(localStorage.getItem('pfm_guest_draft')).not.toBeNull();
  });

  it('imports through the encrypted path once the key is ready (no plaintext leaves)', async () => {
    const { id } = await saveGuestDraft({ title: SECRET, completed: false, contentLanguage: 'en' });
    await autoInitAccountKey(); // first authenticated use — key ready, no passphrase

    const res = await importGuestPrayerOnce();
    await drainQueue();

    expect(res).toMatchObject({ imported: true, id });
    const writes = prayersWrites();
    expect(writes.length).toBeGreaterThan(0);
    for (const w of writes) {
      const json = JSON.stringify(w.payload);
      expect(json).not.toContain(SECRET);        // never plaintext
      expect(json).toContain('encrypted_payload'); // the normal encrypted path
    }
    // The prayer uses the draft's own UUID and the default new-prayer schedule.
    const upsert = writes.find((w) => w.op === 'upsert');
    expect(upsert.payload.id).toBe(id);
    expect(upsert.payload.schedule).toMatchObject({ type: 'recurring', freq: 'weekly' });
    // The draft is cleared and onboarding is marked complete.
    expect(localStorage.getItem('pfm_guest_draft')).toBeNull();
    expect(localStorage.getItem('pfm_onboarded')).toBe('1');
  });

  it('runs exactly once under repeated (StrictMode-style) effects', async () => {
    const { id } = await saveGuestDraft({ title: SECRET, completed: false });
    await autoInitAccountKey();

    // Two synchronous calls, as a double-invoked effect would produce.
    const [a, b] = await Promise.all([importGuestPrayerOnce(), importGuestPrayerOnce()]);
    await drainQueue();

    expect(a).toBe(b); // the same coalesced promise
    // Only ONE create reached the server, and the store holds a single prayer.
    expect(prayersWrites().filter((w) => w.op === 'upsert').length).toBe(1);
    expect(usePrayerStore.getState().prayers.filter((p) => p.id === id).length).toBe(1);
  });

  it('records today\'s completion for a prayer that was prayed as a guest', async () => {
    const { id } = await saveGuestDraft({ title: SECRET, completed: true });
    await autoInitAccountKey();
    await importGuestPrayerOnce();
    await drainQueue();

    // A completion row for this prayer reached prayer_completions...
    const completion = rec.writes.find((w) => w.table === 'prayer_completions');
    expect(completion).toBeTruthy();
    // ...and the store reflects that it was prayed today (so Today shows it done,
    // never asking the person to pray the same prayer again).
    expect(usePrayerStore.getState().completions[id]?.length).toBe(1);
  });

  it('does nothing when there is no draft', async () => {
    await autoInitAccountKey();
    const res = await importGuestPrayerOnce();
    await drainQueue();
    expect(res).toMatchObject({ imported: false, reason: 'none' });
    expect(prayersWrites().length).toBe(0);
  });

  it('is a no-op create when the prayer already exists (refresh / replay)', async () => {
    const { id } = await saveGuestDraft({ title: SECRET, completed: false });
    await autoInitAccountKey();
    // Pretend a prior import already created the prayer in the store.
    usePrayerStore.setState({ prayers: [{ id, title: 'x', prayer_categories: [], prayer_points: [] }] });

    const res = await importGuestPrayerOnce();
    await drainQueue();

    expect(res.imported).toBe(false);
    expect(prayersWrites().filter((w) => w.op === 'upsert').length).toBe(0);
    // But the draft is still tidied up.
    await clearGuestDraft();
    expect(localStorage.getItem('pfm_guest_draft')).toBeNull();
  });
});
