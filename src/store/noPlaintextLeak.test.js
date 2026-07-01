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
// publishes a readable copy by design). The nested server tables
// (prayer_updates / prayer_points) are encrypted for PRIVATE prayers (Phase 3b)
// and testimonies now live in their own `prayer_testimonies` table, also
// encrypted for PRIVATE prayers (Phase 3c) — both asserted in dedicated blocks
// at the bottom of this file.
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
import useCommunityStore from './communityStore';

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
  useCommunityStore.setState({ prayerShares: {} });
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

// Phase 3b: a PRIVATE prayer's nested rows (prayer_updates / prayer_points) must
// also reach the server only as ciphertext, and bypass the plaintext fan-out
// RPCs (a private prayer has no community copies to fan out to).
describe('no private plaintext reaches Supabase (nested tables: Phase 3b)', () => {
  const UPDATE_SECRET = 'SECRET_UPDATE_surgery_went_well';
  const POINT_SECRET = 'SECRET_POINT_healing_request';
  const VERSE_SECRET = 'SECRET_VERSE_psalm_23';
  const VERSE_SECRET_2 = 'SECRET_VERSE_isaiah_41';

  async function freshPrivatePrayer() {
    await createVault('pass');
    await usePrayerStore.getState().addPrayer({ title: 'host prayer' });
    await drainQueue();
    const id = usePrayerStore.getState().prayers[0].id;
    rec.writes.length = 0;
    rec.rpcs.length = 0;
    return id;
  }

  it('addUpdate encrypts the text and skips the sync_add_update fan-out', async () => {
    const id = await freshPrivatePrayer();
    await usePrayerStore.getState().addUpdate(id, UPDATE_SECRET, 'me');
    await drainQueue();

    const writes = rec.writes.filter((w) => w.table === 'prayer_updates');
    expect(writes.length).toBeGreaterThan(0);
    for (const w of writes) {
      const json = JSON.stringify(w.payload);
      expect(json).not.toContain(UPDATE_SECRET);
      expect(json).toContain('encrypted_payload');
    }
    expect(rec.rpcs.find((r) => r.name === 'sync_add_update')).toBeUndefined();

    const w = writes.find((w) => w.payload?.encrypted_payload);
    const data = await decryptJson(getMasterKey(), w.payload.encrypted_payload);
    expect(data.text).toBe(UPDATE_SECRET);
  });

  it('addPrayerPoint + addVerse keep the title and verses encrypted, no fan-out', async () => {
    const id = await freshPrivatePrayer();
    await usePrayerStore.getState().addPrayerPoint(id, {
      title: POINT_SECRET,
      verses: [{ ref: VERSE_SECRET, text: 'the Lord is my shepherd' }],
    });
    await drainQueue();
    const pointId = usePrayerStore.getState().prayers.find((p) => p.id === id).prayer_points[0].id;
    await usePrayerStore.getState().addVerseToPoint(id, pointId, { ref: VERSE_SECRET_2, text: 'fear not' });
    await drainQueue();

    const writes = rec.writes.filter((w) => w.table === 'prayer_points');
    expect(writes.length).toBeGreaterThan(0);
    for (const w of writes) {
      const json = JSON.stringify(w.payload);
      for (const secret of [POINT_SECRET, VERSE_SECRET, VERSE_SECRET_2]) {
        expect(json).not.toContain(secret);
      }
      expect(json).toContain('encrypted_payload');
    }
    expect(rec.rpcs.find((r) => r.name === 'sync_add_point')).toBeUndefined();
    expect(rec.rpcs.find((r) => r.name === 'sync_add_verse')).toBeUndefined();
  });
});

// Phase 3c: a PRIVATE prayer's testimonies (now their own prayer_testimonies
// rows) must reach the server only as ciphertext, and never via the legacy
// answer_prayer RPC. Shared prayers keep testimonies plaintext.
describe('no private plaintext reaches Supabase (prayer_testimonies: Phase 3c)', () => {
  const TESTIMONY_SECRET = 'SECRET_TESTIMONY_healed_completely';
  const THANKS_SECRET = 'SECRET_THANKS_still_grateful';

  async function freshPrivatePrayer() {
    await createVault('pass');
    await usePrayerStore.getState().addPrayer({ title: 'host prayer' });
    await drainQueue();
    const id = usePrayerStore.getState().prayers[0].id;
    rec.writes.length = 0;
    rec.rpcs.length = 0;
    return id;
  }

  function testimonyWrites() {
    return rec.writes.filter((w) => w.table === 'prayer_testimonies');
  }

  it('markAnswered encrypts the testimony and never calls answer_prayer', async () => {
    const id = await freshPrivatePrayer();
    await usePrayerStore.getState().markAnswered(id, TESTIMONY_SECRET);
    await drainQueue();

    const writes = testimonyWrites();
    expect(writes.length).toBeGreaterThan(0);
    for (const w of writes) {
      const json = JSON.stringify(w.payload);
      expect(json).not.toContain(TESTIMONY_SECRET);
      expect(json).toContain('encrypted_payload');
    }
    expect(rec.rpcs.find((r) => r.name === 'answer_prayer')).toBeUndefined();

    const w = writes.find((w) => w.payload?.encrypted_payload);
    const data = await decryptJson(getMasterKey(), w.payload.encrypted_payload);
    expect(data.content).toBe(TESTIMONY_SECRET);
    expect(w.payload.content).toBe(''); // plaintext column redacted
  });

  it('addTestimony (word of thanks) encrypts the content', async () => {
    const id = await freshPrivatePrayer();
    await usePrayerStore.getState().addTestimony(id, THANKS_SECRET);
    await drainQueue();

    const writes = testimonyWrites();
    expect(writes.length).toBeGreaterThan(0);
    for (const w of writes) {
      expect(JSON.stringify(w.payload)).not.toContain(THANKS_SECRET);
      expect(w.payload.encrypted_payload).toBeTruthy();
    }
  });

  it('a SHARED prayer keeps its testimony plaintext (never fans out, but not gated for encryption)', async () => {
    const id = await freshPrivatePrayer();
    // Mark the prayer as shared to a group → canEncryptNested is false.
    useCommunityStore.setState({ prayerShares: { [id]: ['group-1'] } });
    await usePrayerStore.getState().markAnswered(id, 'PUBLIC_testimony_ok');
    await drainQueue();

    const w = testimonyWrites().find((w) => w.payload?.content === 'PUBLIC_testimony_ok');
    expect(w).toBeTruthy();
    expect(w.payload.encrypted_payload).toBeUndefined();
  });
});
