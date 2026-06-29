// End-to-end proof that a vault (E2E-encrypted) prayer never sends its private
// SCALAR plaintext (title / description / person_name / phone) to Supabase.
//
// This drives the REAL write path — prayerStore action → mutationQueue →
// mutationExecutors → supabase client — with the Supabase client replaced by a
// recorder. We then scan every payload that hit the `prayers` table and assert
// the secrets appear nowhere in cleartext, only inside an opaque encrypted_payload
// that round-trips back under the master key.
//
// Scope note: writes to `community_prayers` are intentionally plaintext (sharing
// publishes a readable copy by design), and the nested server tables
// (prayer_updates / prayer_points / testimonies) are Phase 3b — both are out of
// scope here and asserted separately where relevant.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// prayerStore reads localStorage at module-init time, so the shim must exist
// before the imports below execute — install it in a hoisted block. We also
// pin navigator.onLine: Node exposes a `navigator` without `onLine`, which would
// make the queue's isOnline() falsy and stop it from ever flushing.
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

// ── Recording Supabase mock (hoisted so vi.mock can see it) ──────────────────
const rec = vi.hoisted(() => ({ writes: [], rpcs: [] }));

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

// localStorage shim for keyManager (vault record lives here).
function installStorage() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

// Importing the executors registers them with the queue. prayerStore + crypto
// are imported after the mock is in place (vi.mock is hoisted above all imports).
import '../lib/mutationExecutors';
import { pendingCount, flushQueue } from '../lib/mutationQueue';
import { createVault, lock } from '../lib/crypto/keyManager';
import { decryptJson } from '../lib/crypto/e2ee';
import { getMasterKey } from '../lib/crypto/keyManager';
import usePrayerStore from './prayerStore';

// The flush is kicked off (un-awaited) by enqueue; drain it deterministically.
async function drainQueue() {
  for (let i = 0; i < 50 && pendingCount() > 0; i++) {
    await flushQueue();
    await new Promise((r) => setTimeout(r, 0));
  }
}

const SECRETS = {
  title: 'SECRET_TITLE_for_my_brother',
  description: 'SECRET_DESC_struggling_health',
  person_name: 'SECRET_NAME_john_doe',
  phone: 'SECRET_PHONE_0612345678',
};

// Every payload that hit the `prayers` table, serialized.
function prayersWritesJson() {
  return rec.writes.filter((w) => w.table === 'prayers').map((w) => JSON.stringify(w.payload));
}

beforeEach(() => {
  installStorage();
  lock();
  rec.writes.length = 0;
  rec.rpcs.length = 0;
  usePrayerStore.setState({ prayers: [] });
});

describe('no private plaintext reaches Supabase (prayers table)', () => {
  it('addPrayer encrypts scalar fields before they leave the client', async () => {
    await createVault('correct horse battery staple');

    await usePrayerStore.getState().addPrayer({
      title: SECRETS.title,
      description: SECRETS.description,
      personName: SECRETS.person_name,
      phone: SECRETS.phone,
    });
    await drainQueue();

    const writes = prayersWritesJson();
    expect(writes.length).toBeGreaterThan(0);
    for (const json of writes) {
      for (const secret of Object.values(SECRETS)) {
        expect(json).not.toContain(secret);
      }
      expect(json).toContain('encrypted_payload');
    }
  });

  it('the encrypted_payload round-trips back to the original plaintext', async () => {
    await createVault('pass');
    await usePrayerStore.getState().addPrayer({
      title: SECRETS.title,
      description: SECRETS.description,
      personName: SECRETS.person_name,
      phone: SECRETS.phone,
    });
    await drainQueue();

    const write = rec.writes.find((w) => w.table === 'prayers' && w.payload?.encrypted_payload);
    expect(write).toBeTruthy();
    const data = await decryptJson(getMasterKey(), write.payload.encrypted_payload);
    expect(data.title).toBe(SECRETS.title);
    expect(data.phone).toBe(SECRETS.phone);
    // The plaintext columns themselves are redacted to ''.
    expect(write.payload.title).toBe('');
    expect(write.payload.phone).toBe('');
  });

  it('updatePrayer re-encrypts and redacts the edited scalar fields', async () => {
    await createVault('pass');
    await usePrayerStore.getState().addPrayer({ title: 'orig', description: 'orig' });
    await drainQueue();
    const id = usePrayerStore.getState().prayers[0].id;
    rec.writes.length = 0;

    await usePrayerStore.getState().updatePrayer(id, {
      title: SECRETS.title,
      phone: SECRETS.phone,
    });
    await drainQueue();

    const writes = prayersWritesJson();
    expect(writes.length).toBeGreaterThan(0);
    for (const json of writes) {
      expect(json).not.toContain(SECRETS.title);
      expect(json).not.toContain(SECRETS.phone);
      expect(json).toContain('encrypted_payload');
    }
  });

  it('does NOT encrypt when the vault is locked (legacy plaintext path)', async () => {
    // No vault → canEncrypt is false → the row is written as-is. This documents
    // the boundary: encryption is opt-in via the vault, not silently assumed.
    await usePrayerStore.getState().addPrayer({ title: 'plain title', description: 'plain' });
    await drainQueue();

    const write = rec.writes.find((w) => w.table === 'prayers');
    expect(write).toBeTruthy();
    expect(write.payload.encrypted_payload).toBeUndefined();
    expect(write.payload.title).toBe('plain title');
  });
});
