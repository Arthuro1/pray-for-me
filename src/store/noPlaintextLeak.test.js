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
import { createVault, lock, autoInitAccountKey } from '../lib/crypto/keyManager';
import { decryptJson } from '../lib/crypto/e2ee';
import { getMasterKey } from '../lib/crypto/keyManager';
import usePrayerStore from './prayerStore';
import useCommunityStore from './communityStore';
import { decryptPrayerFromStorage, encryptPrayerForStorage, encryptPrayersForCache } from '../lib/crypto/prayerCrypto';
import { circleOf, groupByCircle } from '../lib/circles';

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

function prayerContext(row) {
  return {
    entityType: 'personal-prayer',
    ownerOrGroupId: row.user_id || 'user-1',
    recordId: row.id,
    keyVersion: row.key_version || 1,
    field: 'sensitive-payload',
  };
}

function childContext(entityType, row, prayerId) {
  return {
    entityType,
    ownerOrGroupId: 'user-1',
    recordId: row.id,
    parentId: prayerId,
    keyVersion: row.key_version || 1,
    field: 'sensitive-payload',
  };
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
  // The default model: encryption happens with the auto-provisioned account key,
  // WITHOUT the user ever creating a vault or entering a passphrase.
  it('encrypts by default via the auto-provisioned account key (no createVault)', async () => {
    await autoInitAccountKey(); // first authenticated use — no vault, no passphrase

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
      for (const secret of Object.values(SECRETS)) expect(json).not.toContain(secret);
      expect(json).toContain('encrypted_payload');
    }
  });

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
    const data = await decryptJson(getMasterKey(), write.payload.encrypted_payload, prayerContext(write.payload));
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

  it('does NOT encrypt when no account key is available (new device, locked)', async () => {
    // No key in memory (e.g. a new device with a recovery-protected key not yet
    // unlocked) → canEncrypt is false → the row is written as-is rather than
    // silently dropped. Normal use auto-provisions the key so this path is rare.
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
    const data = await decryptJson(
      getMasterKey(),
      w.payload.encrypted_payload,
      childContext('prayer-update', w.payload, id),
    );
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
    const data = await decryptJson(
      getMasterKey(),
      w.payload.encrypted_payload,
      childContext('prayer-testimony', w.payload, id),
    );
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

  it('a SHARED prayer now encrypts its PERSONAL testimony under the account key', async () => {
    const id = await freshPrivatePrayer();
    // Sharing no longer forces personal child rows to plaintext: the community copy
    // is a separate snapshot encrypted under the GROUP key, so the owner's personal
    // testimony stays private under the account key (canEncryptNested === canEncrypt).
    useCommunityStore.setState({ prayerShares: { [id]: ['group-1'] } });
    const SECRET = 'SECRET_shared_prayer_testimony';
    await usePrayerStore.getState().markAnswered(id, SECRET);
    await drainQueue();

    const writes = testimonyWrites();
    expect(writes.length).toBeGreaterThan(0);
    for (const w of writes) {
      expect(JSON.stringify(w.payload)).not.toContain(SECRET);
      expect(w.payload.encrypted_payload).toBeTruthy();
      expect(w.payload.content).toBe(''); // plaintext column redacted
    }
  });
});

// The Intercession Circle (lib/circles.js) is private metadata about what a
// prayer is about. It has NO column: it must exist only inside the ciphertext.
// A column write would also be rejected by the server and dropped by the queue,
// losing the whole prayer — so this guard covers privacy and data safety at once.
describe('the Intercession Circle never reaches Supabase in plaintext', () => {
  const columnWrites = () => rec.writes.filter((w) => w.table === 'prayers');

  it('addPrayer carries the circle inside encrypted_payload only', async () => {
    await createVault('pass');
    await usePrayerStore.getState().addPrayer({ title: 'For my nation', circle: 'nations' });
    await drainQueue();

    const writes = columnWrites();
    expect(writes.length).toBeGreaterThan(0);
    for (const w of writes) {
      expect(w.payload).not.toHaveProperty('circle');
      expect(JSON.stringify(w.payload)).not.toContain('nations');
    }
    const write = writes.find((w) => w.payload?.encrypted_payload);
    const data = await decryptJson(getMasterKey(), write.payload.encrypted_payload, prayerContext(write.payload));
    expect(data.circle).toBe('nations');
    // The in-memory prayer knows its circle straight away.
    expect(usePrayerStore.getState().prayers[0].circle).toBe('nations');
  });

  it('an edit that changes something else keeps the circle in the new ciphertext', async () => {
    await createVault('pass');
    await usePrayerStore.getState().addPrayer({ title: 'My household', circle: 'household' });
    await drainQueue();
    const id = usePrayerStore.getState().prayers[0].id;
    rec.writes.length = 0;

    await usePrayerStore.getState().updatePrayer(id, { title: 'My household, renamed' });
    await drainQueue();

    const write = columnWrites().find((w) => w.payload?.encrypted_payload);
    expect(write.payload).not.toHaveProperty('circle');
    const data = await decryptJson(getMasterKey(), write.payload.encrypted_payload, prayerContext({ id, user_id: 'user-1' }));
    expect(data.title).toBe('My household, renamed');
    expect(data.circle).toBe('household');
  });

  it('placing and clearing a circle re-encrypts without ever naming a column', async () => {
    await createVault('pass');
    await usePrayerStore.getState().addPrayer({ title: 'Unplaced prayer' });
    await drainQueue();
    const id = usePrayerStore.getState().prayers[0].id;
    expect(usePrayerStore.getState().prayers[0].circle).toBeUndefined();
    rec.writes.length = 0;

    await usePrayerStore.getState().updatePrayer(id, { circle: 'church' });
    await drainQueue();
    for (const w of columnWrites()) expect(w.payload).not.toHaveProperty('circle');
    expect(usePrayerStore.getState().prayers[0].circle).toBe('church');

    await usePrayerStore.getState().updatePrayer(id, { circle: null });
    await drainQueue();
    expect(usePrayerStore.getState().prayers[0].circle).toBeNull();
  });

  it('a prayer saved without the account key cannot hold a circle at all', async () => {
    // No key in memory → the row is written as-is; a circle would have to be a
    // plaintext column, so it is dropped instead of leaked or rejected.
    await usePrayerStore.getState().addPrayer({ title: 'plain', circle: 'authorities' });
    await drainQueue();

    for (const w of columnWrites()) {
      expect(w.payload).not.toHaveProperty('circle');
      expect(JSON.stringify(w.payload)).not.toContain('authorities');
    }
    expect(usePrayerStore.getState().prayers[0].circle).toBeUndefined();
  });

  it('rejects a value that is not one of the seven circles', async () => {
    await createVault('pass');
    await usePrayerStore.getState().addPrayer({ title: 'odd', circle: 'top-intercessor' });
    await drainQueue();
    expect(usePrayerStore.getState().prayers[0].circle).toBeUndefined();
  });

  it('comes back from the stored row on the load path', async () => {
    await createVault('pass');
    await usePrayerStore.getState().addPrayer({ title: 'For our city', circle: 'nations' });
    await drainQueue();

    const stored = columnWrites().find((w) => w.payload?.encrypted_payload).payload;
    const loaded = await decryptPrayerFromStorage(stored);
    expect(loaded._locked).toBe(false);
    expect(circleOf(loaded)).toBe('nations');
  });

  it('is never written in plaintext to the on-device cache', async () => {
    await createVault('pass');
    await usePrayerStore.getState().addPrayer({ title: 'Kept on this phone', circle: 'household' });
    const [prayer] = usePrayerStore.getState().prayers;

    const [cached] = await encryptPrayersForCache([prayer]);
    expect(cached).not.toHaveProperty('circle');
    expect(JSON.stringify(cached)).not.toContain('household');
    expect(circleOf(await decryptPrayerFromStorage(cached))).toBe('household');
  });

  it('survives an offline queue replay without ever becoming a column', async () => {
    await createVault('pass');
    globalThis.navigator.onLine = false;
    try {
      await usePrayerStore.getState().addPrayer({ title: 'Written on the train', circle: 'people' });
      await flushQueue();
      expect(pendingCount()).toBeGreaterThan(0);
      expect(columnWrites()).toHaveLength(0);
    } finally {
      globalThis.navigator.onLine = true;
    }
    await drainQueue();

    const write = columnWrites().find((w) => w.payload?.encrypted_payload);
    expect(write.payload).not.toHaveProperty('circle');
    expect(circleOf(await decryptPrayerFromStorage(write.payload))).toBe('people');
  });

  it('reads an unknown value back as unplaced without rewriting it', async () => {
    await createVault('pass');
    // A circle from a newer build, or a damaged payload.
    const row = await encryptPrayerForStorage({ id: 'p-future', user_id: 'user-1', title: 'Later', circle: 'galaxies' });
    const loaded = await decryptPrayerFromStorage(row);

    expect(loaded.circle).toBe('galaxies'); // the stored value is kept as it was…
    expect(circleOf(loaded)).toBeNull(); // …but this build treats it as unplaced
    expect(groupByCircle([loaded])).toEqual([{ circle: null, prayers: [loaded] }]);
  });

  it('changes independently of categories and the prayer rhythm', async () => {
    await createVault('pass');
    const schedule = { type: 'weekly', days: [1] };
    await usePrayerStore.getState().addPrayer({ title: 'Our marriage', circle: 'household', categoryIds: ['cat-1'], schedule });
    await drainQueue();
    const id = usePrayerStore.getState().prayers[0].id;
    rec.writes.length = 0;

    // A new circle leaves labels and rhythm untouched…
    await usePrayerStore.getState().updatePrayer(id, { circle: 'self' });
    await drainQueue();
    let prayer = usePrayerStore.getState().prayers[0];
    expect(prayer.prayer_categories).toEqual([{ category_id: 'cat-1' }]);
    expect(prayer.schedule).toEqual(schedule);
    expect(rec.writes.some((w) => w.table === 'prayer_categories')).toBe(false);
    for (const w of columnWrites()) expect(w.payload).not.toHaveProperty('schedule');

    // …and new labels leave the circle where it is.
    await usePrayerStore.getState().updatePrayer(id, { categoryIds: ['cat-2'] });
    await drainQueue();
    prayer = usePrayerStore.getState().prayers[0];
    expect(prayer.circle).toBe('self');
    expect(prayer.prayer_categories).toEqual([{ category_id: 'cat-2' }]);
  });
});
