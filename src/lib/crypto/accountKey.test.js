import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Minimal stateful in-memory Supabase (user_crypto_keys + prayers + auth) ────
// accountKey now consults the server before auto-provisioning, so the tests mock
// Supabase to model a brand-new user (empty) vs. one who already has encrypted
// data on the server (orphaned).
const db = { user_crypto_keys: new Map(), prayers: [] };
let currentUser = null;
function resetDb() { db.user_crypto_keys.clear(); db.prayers = []; currentUser = null; }

function makeQuery(table) {
  const q = { _f: [], _limit: null };
  const rows = () => {
    let r = table === 'user_crypto_keys' ? [...db.user_crypto_keys.values()] : (db[table] || []);
    r = r.filter((row) => q._f.every(([c, v]) => (c === '__notnull__' ? row[v] != null : row[c] === v)));
    return q._limit != null ? r.slice(0, q._limit) : r;
  };
  q.select = () => q;
  q.eq = (c, v) => { q._f.push([c, v]); return q; };
  q.not = (c) => { q._f.push(['__notnull__', c]); return q; };
  q.limit = (n) => { q._limit = n; return q; };
  q.maybeSingle = () => Promise.resolve({ data: rows()[0] || null, error: null });
  q.upsert = (r) => { if (table === 'user_crypto_keys') db.user_crypto_keys.set(r.user_id, { ...r }); return Promise.resolve({ data: null, error: null }); };
  return q;
}

vi.mock('../supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: currentUser ? { id: currentUser } : null } }) },
    from: (table) => makeQuery(table),
  },
}));

import { ensureAccountCryptoReady, startFreshEncryption, CRYPTO_STATUS } from './accountKey';
import { isUnlocked, isVaultInitialized, getMasterKey, lock, destroyVault, createVault } from './keyManager';
import { encryptJsonLegacy, decryptJson } from './e2ee';
import { clearUserKeyCache } from './userKeys';

// Minimal localStorage shim for the Node test env (keyManager reads it during
// hydrate). IndexedDB is absent here, so accountKey's per-user persistence
// no-ops and we exercise the pure in-memory auto-init path.
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
  clearUserKeyCache();
  await destroyVault(); // clears the cached record + in-memory key between tests
});

describe('ensureAccountCryptoReady', () => {
  it('auto-provisions an account key on first use — no vault, no passphrase', async () => {
    expect(isUnlocked()).toBe(false);
    expect(isVaultInitialized()).toBe(false);

    const status = await ensureAccountCryptoReady('user-1');

    expect(status).toBe(CRYPTO_STATUS.READY);
    expect(isUnlocked()).toBe(true);
    // Encryption is on, but recovery is NOT configured (transparent by default).
    expect(isVaultInitialized()).toBe(false);
  });

  it('is idempotent and keeps the SAME key (data stays readable)', async () => {
    await ensureAccountCryptoReady('user-1');
    const payload = await encryptJsonLegacy(getMasterKey(), { msg: 'hello account key' });

    await ensureAccountCryptoReady('user-1'); // must not rotate the key

    expect(await decryptJson(getMasterKey(), payload)).toEqual({ msg: 'hello account key' });
  });

  it('does not mint a new key when a recovery record exists but none is loaded', async () => {
    // Simulates a fresh device that pulled the wrapped recovery record but has no
    // local key: it must stay LOCKED for the recovery unlock UI, not auto-init a
    // NEW key that could never read the recovery-protected data.
    await createVault('pass'); // recovery configured (record present)
    lock(); // key not in memory, as on a new device

    const status = await ensureAccountCryptoReady('user-1');

    expect(status).toBe(CRYPTO_STATUS.LOCKED);
    expect(isUnlocked()).toBe(false);
  });

  it('does NOT silently mint a key when the server already holds encrypted data', async () => {
    // A device with no local key and no recovery record, but the user already
    // provisioned encryption elsewhere (an identity keypair exists server-side).
    // Minting here would orphan that data, so we surface the ORPHANED state.
    db.user_crypto_keys.set('user-1', { user_id: 'user-1', public_key_jwk: {}, encrypted_private_key: {} });

    const status = await ensureAccountCryptoReady('user-1');

    expect(status).toBe(CRYPTO_STATUS.ORPHANED);
    expect(isUnlocked()).toBe(false); // crucially, no new key was minted
  });
});

describe('startFreshEncryption', () => {
  it('mints a new key and re-publishes the identity keypair after an orphaned state', async () => {
    db.user_crypto_keys.set('user-1', { user_id: 'user-1', public_key_jwk: { old: true }, encrypted_private_key: { old: true } });
    expect(await ensureAccountCryptoReady('user-1')).toBe(CRYPTO_STATUS.ORPHANED);

    const ok = await startFreshEncryption('user-1');

    expect(ok).toBe(true);
    expect(isUnlocked()).toBe(true);
    // The orphaned identity keypair was overwritten with a fresh one.
    expect(db.user_crypto_keys.get('user-1').public_key_jwk).not.toEqual({ old: true });
  });
});
