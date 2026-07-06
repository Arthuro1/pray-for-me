// Task 5 — Vault migration/status. Proves that scanVaultCoverage() correctly
// reports how many of a user's PRIVATE prayers are still plaintext at rest, and
// that migrateToVault() re-encrypts exactly those (parents + nested rows),
// leaving shared / saved-from-community / already-encrypted rows untouched and
// never sending private plaintext to the server.
//
// Uses the same recording-Supabase harness as noPlaintextLeak.test.js, but here
// the mock also serves rows back from `select`, so the scan/migrate read path
// has data to work on.
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

// Mutable fixture the mock reads from; tests set the rows before acting.
const db = vi.hoisted(() => ({ prayersRows: [], sharedRows: [], writes: [] }));

vi.mock('../lib/supabase', () => {
  const dataFor = (table) => ({
    data: table === 'prayers' ? db.prayersRows : table === 'community_prayers' ? db.sharedRows : [],
    error: null,
    status: 200,
  });
  const makeQuery = (table) => {
    let pending = null; // an in-flight update/upsert awaiting its .eq() filter
    const chain = {
      select: () => chain,
      update: (payload) => { pending = { table, op: 'update', payload, match: null }; return chain; },
      upsert: (payload) => { pending = { table, op: 'upsert', payload, match: null }; return chain; },
      insert: () => chain,
      delete: () => chain,
      eq: (col, val) => { if (pending) { pending.match = { col, val }; db.writes.push(pending); pending = null; } return chain; },
      in: () => chain,
      not: () => chain,
      order: () => chain,
      single: () => Promise.resolve({ data: null, error: null, status: 200 }),
      maybeSingle: () => Promise.resolve({ data: null, error: null, status: 200 }),
      then: (resolve) => resolve(dataFor(table)),
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

import { createVault, lock, getMasterKey } from '../lib/crypto/keyManager';
import { decryptJson } from '../lib/crypto/e2ee';
import usePrayerStore from './prayerStore';

const SECRET_TITLE = 'SECRET_legacy_title_for_mum';
const SECRET_UPDATE = 'SECRET_legacy_update_surgery';
const SECRET_POINT = 'SECRET_legacy_point_healing';
const SECRET_TESTIMONY = 'SECRET_legacy_testimony_healed';
const SECRET_P5_UPDATE = 'SECRET_p5_nested_update';

// p1 private + fully plaintext; p2 private + fully encrypted; p3 shared;
// p4 saved-from-community; p5 private with an encrypted parent but a plaintext
// nested update (a formerly-shared prayer, now private).
function seed() {
  db.prayersRows = [
    {
      id: 'p1', community_origin_id: null, encryption_version: null,
      title: SECRET_TITLE, description: 'd', person_name: '', phone: '', scripture_guidance: null,
      prayer_updates: [{ id: 'u1', encryption_version: null, text: SECRET_UPDATE }],
      prayer_points: [{ id: 'pt1', encryption_version: null, title: SECRET_POINT, verses: [] }],
      prayer_testimonies: [{ id: 't1', encryption_version: null, content: SECRET_TESTIMONY }],
    },
    {
      id: 'p2', community_origin_id: null, encryption_version: 1,
      title: '', description: '', person_name: '', phone: '', scripture_guidance: null,
      prayer_updates: [], prayer_points: [], prayer_testimonies: [],
    },
    {
      id: 'p3', community_origin_id: null, encryption_version: null,
      title: 'shared prayer', description: '', person_name: '', phone: '', scripture_guidance: null,
      prayer_updates: [], prayer_points: [], prayer_testimonies: [],
    },
    {
      id: 'p4', community_origin_id: 'c-9', encryption_version: null,
      title: 'saved copy', description: '', person_name: '', phone: '', scripture_guidance: null,
      prayer_updates: [], prayer_points: [], prayer_testimonies: [],
    },
    {
      id: 'p5', community_origin_id: null, encryption_version: 1,
      title: '', description: '', person_name: '', phone: '', scripture_guidance: null,
      prayer_updates: [{ id: 'u5', encryption_version: null, text: SECRET_P5_UPDATE }],
      prayer_points: [], prayer_testimonies: [],
    },
  ];
  db.sharedRows = [{ source_prayer_id: 'p3' }];
}

const writesTo = (table) => db.writes.filter((w) => w.table === table);
const allWritesJson = () => db.writes.map((w) => JSON.stringify(w.payload)).join('\n');

beforeEach(async () => {
  lock();
  db.writes.length = 0;
  seed();
  usePrayerStore.setState({ userId: 'user-1', prayers: [] });
});

describe('scanVaultCoverage', () => {
  it('counts only PRIVATE prayers, flagging those still plaintext at rest', async () => {
    const res = await usePrayerStore.getState().scanVaultCoverage();
    // Private = p1, p2, p5 (p3 shared and p4 saved-from-community are excluded).
    // Pending = p1 (plaintext) + p5 (plaintext nested update); p2 is fully encrypted.
    expect(res).toEqual({ total: 3, pending: 2 });
  });

  it('reports zero pending once nothing private is plaintext', async () => {
    db.prayersRows = [db.prayersRows[1]]; // just p2 (fully encrypted)
    db.sharedRows = [];
    const res = await usePrayerStore.getState().scanVaultCoverage();
    expect(res).toEqual({ total: 1, pending: 0 });
  });

  it('returns 0/0 when there is no signed-in user', async () => {
    usePrayerStore.setState({ userId: null });
    expect(await usePrayerStore.getState().scanVaultCoverage()).toEqual({ total: 0, pending: 0 });
  });
});

describe('migrateToVault', () => {
  it('encrypts every plaintext private row and skips the rest', async () => {
    await createVault('correct horse battery staple');
    db.writes.length = 0; // ignore any vault-setup writes

    const res = await usePrayerStore.getState().migrateToVault();
    expect(res).toEqual({ migrated: 2, failed: 0 }); // p1 + p5

    // No plaintext secret reached the server.
    const json = allWritesJson();
    for (const secret of [SECRET_TITLE, SECRET_UPDATE, SECRET_POINT, SECRET_TESTIMONY, SECRET_P5_UPDATE]) {
      expect(json).not.toContain(secret);
    }

    // Parent p1 re-encrypted in place (title redacted, payload attached); p2/p5
    // parents are already encrypted so they are never rewritten.
    const prayerWrites = writesTo('prayers');
    expect(prayerWrites).toHaveLength(1);
    expect(prayerWrites[0].match).toEqual({ col: 'id', val: 'p1' });
    expect(prayerWrites[0].payload.title).toBe('');
    expect(prayerWrites[0].payload.encrypted_payload).toBeTruthy();

    // Nested rows: p1's update/point/testimony + p5's update.
    expect(writesTo('prayer_updates').map((w) => w.match.val).sort()).toEqual(['u1', 'u5']);
    expect(writesTo('prayer_points').map((w) => w.match.val)).toEqual(['pt1']);
    expect(writesTo('prayer_testimonies').map((w) => w.match.val)).toEqual(['t1']);

    // Every child write redacts its plaintext column and attaches ciphertext.
    for (const w of [...writesTo('prayer_updates'), ...writesTo('prayer_points'), ...writesTo('prayer_testimonies')]) {
      expect(w.payload.encrypted_payload).toBeTruthy();
    }
  });

  it('round-trips the parent ciphertext back to the original plaintext', async () => {
    await createVault('pass');
    db.writes.length = 0;
    await usePrayerStore.getState().migrateToVault();

    const parent = writesTo('prayers')[0];
    const data = await decryptJson(getMasterKey(), parent.payload.encrypted_payload);
    expect(data.title).toBe(SECRET_TITLE);
  });

  it('does nothing while the vault is locked (no key to encrypt with)', async () => {
    // No createVault → locked.
    const res = await usePrayerStore.getState().migrateToVault();
    expect(res).toEqual({ migrated: 0, failed: 0 });
    expect(db.writes).toHaveLength(0);
  });
});
