import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Minimal stateful in-memory Supabase (vault_keys + auth) ──────────────────
// The real client builds its realtime layer at construct time, so it is stubbed
// here; what matters is that PostgREST reports RLS / constraint failures in the
// returned `error` field rather than throwing, which is exactly how a "recovery
// is set up" write used to fail silently.
const db = { vault_keys: new Map() };
let currentUser = 'user-1';
let selectError = null;
let upsertError = null;

function resetDb() {
  db.vault_keys.clear();
  currentUser = 'user-1';
  selectError = null;
  upsertError = null;
}

function makeQuery(table) {
  const q = { _id: null };
  q.select = () => q;
  q.eq = (_col, value) => { q._id = value; return q; };
  q.maybeSingle = () => Promise.resolve(selectError
    ? { data: null, error: selectError }
    : { data: db[table].get(q._id) || null, error: null });
  q.upsert = (row) => {
    if (upsertError) return Promise.resolve({ data: null, error: upsertError });
    db[table].set(row.user_id, row);
    return Promise.resolve({ data: row, error: null });
  };
  return q;
}

vi.mock('./supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: currentUser ? { id: currentUser } : null } }) },
    from: (table) => makeQuery(table),
  },
}));

import { pushVaultRecord, pullVaultRecord, VAULT_SYNC } from './vaultSync';
import { createVault, destroyVault, isVaultInitialized, exportVaultRecord } from './crypto/keyManager';

// keyManager reads localStorage during hydrate; IndexedDB is absent in Node, so
// the wrapped record lives in the module cache for the duration of a test.
function installStorage() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

beforeEach(async () => {
  installStorage();
  resetDb();
  await destroyVault();
});

describe('pushVaultRecord', () => {
  it('reports failure when the write is rejected (no silent success)', async () => {
    await createVault('passphrase-1');
    upsertError = { code: '42501', message: 'new row violates row-level security policy' };

    expect(await pushVaultRecord()).toBe(false);
    expect(db.vault_keys.size).toBe(0); // nothing to recover from on another device
  });

  it('uploads the wrapped record and reports success', async () => {
    await createVault('passphrase-1');

    expect(await pushVaultRecord()).toBe(true);
    expect(db.vault_keys.get('user-1').record).toEqual(JSON.parse(exportVaultRecord()));
  });

  it('does nothing when this device has no record', async () => {
    expect(await pushVaultRecord()).toBe(false);
    expect(db.vault_keys.size).toBe(0);
  });
});

describe('pullVaultRecord', () => {
  it('imports the synced record onto a device that has none', async () => {
    await createVault('passphrase-1');
    await pushVaultRecord();
    const uploaded = exportVaultRecord();
    await destroyVault(); // a different device: no local record, no key

    expect(await pullVaultRecord()).toBe(VAULT_SYNC.PRESENT);
    expect(isVaultInitialized()).toBe(true);
    expect(exportVaultRecord()).toBe(uploaded);
  });

  it('re-pushes a record an earlier failed sync stranded on this device', async () => {
    upsertError = { code: '42501', message: 'denied' };
    await createVault('passphrase-1'); // recovery set up…
    await pushVaultRecord();           // …but the upload never landed
    expect(db.vault_keys.size).toBe(0);

    upsertError = null; // next launch, back online
    expect(await pullVaultRecord()).toBe(VAULT_SYNC.PRESENT);
    expect(db.vault_keys.get('user-1').record).toEqual(JSON.parse(exportVaultRecord()));
  });

  it('reports UNKNOWN — never ABSENT — when the lookup fails', async () => {
    // ABSENT here would tell the caller "this user never set up recovery", which
    // routes a new device to the screen offering to discard their prayers.
    selectError = { code: 'PGRST301', message: 'network unavailable' };

    expect(await pullVaultRecord()).toBe(VAULT_SYNC.UNKNOWN);
    expect(isVaultInitialized()).toBe(false);
  });

  it('reports ABSENT when the server definitively holds no record', async () => {
    expect(await pullVaultRecord()).toBe(VAULT_SYNC.ABSENT);
  });

  it('reports UNKNOWN when there is no signed-in user to look up', async () => {
    currentUser = null;

    expect(await pullVaultRecord()).toBe(VAULT_SYNC.UNKNOWN);
  });
});
