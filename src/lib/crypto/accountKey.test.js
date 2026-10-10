import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Minimal stateful in-memory Supabase (user_crypto_keys + prayers + auth) ────
// accountKey now consults the server before auto-provisioning, so the tests mock
// Supabase to model a brand-new user (empty) vs. one who already has encrypted
// data on the server (orphaned).
const db = { user_crypto_keys: new Map(), prayers: [], prayer_updates: [], prayer_points: [], prayer_testimonies: [] };
let currentUser = null;
let queryFailure = null;
function resetDb() { db.user_crypto_keys.clear(); for (const table of ['prayers', 'prayer_updates', 'prayer_points', 'prayer_testimonies']) db[table] = []; currentUser = null; queryFailure = null; }

function makeQuery(table) {
  const q = { _f: [], _limit: null };
  const rows = () => {
    let r = table === 'user_crypto_keys' ? [...db.user_crypto_keys.values()] : (db[table] || []);
    r = r.filter((row) => q._f.every(([c, v]) => {
      if (c === '__notnull__') return row[v] != null;
      if (c === '__encrypted__') return row.encrypted_payload != null || row.encryption_version != null;
      if (c === '__attachments__') return JSON.stringify(row.attachments) !== '[]';
      if (c === 'prayers.user_id') return (row.prayers?.user_id ?? row.user_id) === v;
      return row[c] === v;
    }));
    return q._limit != null ? r.slice(0, q._limit) : r;
  };
  q.select = () => q;
  q.eq = (c, v) => { q._f.push([c, v]); return q; };
  q.not = (c) => { q._f.push(['__notnull__', c]); return q; };
  q.or = () => { q._f.push(['__encrypted__']); return q; };
  q.neq = () => { q._f.push(['__attachments__']); return q; };
  q.limit = (n) => { q._limit = n; return q; };
  q.order = () => q;
  q.range = (start, end) => Promise.resolve(queryFailure
    ? { data: null, error: queryFailure }
    : { data: rows().slice(start, end + 1), error: null });
  q.maybeSingle = () => Promise.resolve(queryFailure
    ? { data: null, error: queryFailure }
    : { data: rows()[0] || null, error: null });
  q.upsert = (r) => { if (table === 'user_crypto_keys') db.user_crypto_keys.set(r.user_id, { ...r }); return Promise.resolve({ data: null, error: null }); };
  return q;
}

vi.mock('../supabase', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: currentUser ? { id: currentUser } : null } }) },
    from: (table) => makeQuery(table),
  },
}));

import {
  ensureAccountCryptoReady,
  lockAccountKey,
  rememberAccountKey,
  startFreshEncryption,
  CRYPTO_STATUS,
} from './accountKey';
import { VAULT_SYNC } from '../vaultSync';
import {
  isUnlocked, isVaultInitialized, getMasterKey, lock, unlock, destroyVault, createVault,
  configureAccountContext, setDeviceProtectionPolicy,
} from './keyManager';
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
  configureAccountContext('user-1');
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

  it('never initializes a protected device with missing protected metadata or legacy wrappers', async () => {
    expect(setDeviceProtectionPolicy('user-1', true)).toBe(true);
    expect(await ensureAccountCryptoReady('user-1', VAULT_SYNC.ABSENT)).toBe(CRYPTO_STATUS.LOCKED);
    expect(isUnlocked()).toBe(false);
  });

  it('fails closed on an unknown durable protection policy', async () => {
    localStorage.setItem('pfm_device_protected_user-1', 'unrecognized-future-format');
    expect(await ensureAccountCryptoReady('user-1', VAULT_SYNC.ABSENT)).toBe(CRYPTO_STATUS.UNAVAILABLE);
    expect(isUnlocked()).toBe(false);
  });

  it('cannot remember or reuse another account key after an external account transition', async () => {
    await ensureAccountCryptoReady('user-1', VAULT_SYNC.ABSENT);
    configureAccountContext('user-2');
    expect(isUnlocked()).toBe(false);
    expect(await rememberAccountKey('user-1')).toBe(false);
    expect(await ensureAccountCryptoReady('user-1', VAULT_SYNC.ABSENT)).toBe(CRYPTO_STATUS.UNAVAILABLE);
    expect(isUnlocked()).toBe(false);
  });

  it('does not recreate a transparent copy while device protection is enabled', async () => {
    await ensureAccountCryptoReady('user-1', VAULT_SYNC.ABSENT);
    setDeviceProtectionPolicy('user-1', true);
    expect(await rememberAccountKey('user-1', { clearLock: true })).toBe(false);
    expect(await startFreshEncryption('user-1')).toBe(false);
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

  it('keeps an explicit account lock in force until a successful passphrase unlock', async () => {
    await createVault('lock-me');
    await lockAccountKey('user-1');
    expect(globalThis.localStorage.getItem('pfm_ak_locked_user-1')).toBeTruthy();

    expect(await ensureAccountCryptoReady('user-1', VAULT_SYNC.PRESENT)).toBe(CRYPTO_STATUS.LOCKED);
    expect(isUnlocked()).toBe(false);

    expect(await unlock('lock-me')).toBe(true);
    await rememberAccountKey('user-1', { clearLock: true });
    expect(globalThis.localStorage.getItem('pfm_ak_locked_user-1')).toBe(null);
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

  it('does NOT mint a key when server encryption state cannot be verified', async () => {
    queryFailure = { message: 'network unavailable' };

    const status = await ensureAccountCryptoReady('user-1');

    expect(status).toBe(CRYPTO_STATUS.UNAVAILABLE);
    expect(isUnlocked()).toBe(false);
  });

  it.each(['prayer_updates', 'prayer_points', 'prayer_testimonies'])('preserves child-only encrypted history in %s', async (collection) => {
    db.prayers = [{ id: 'p', user_id: 'user-1', [collection]: [{ encrypted_payload: { data: 'original' }, encryption_version: 2 }] }];
    expect(await ensureAccountCryptoReady('user-1', VAULT_SYNC.ABSENT)).toBe(CRYPTO_STATUS.ORPHANED);
    expect(isUnlocked()).toBe(false);
  });

  it('checks history beyond the first page before minting a key', async () => {
    db.prayers = Array.from({ length: 500 }, (_, id) => ({ id: String(id), user_id: 'user-1' }));
    db.prayers.push({ id: 'last', user_id: 'user-1', prayer_updates: [{ encryption_version: 2 }] });
    expect(await ensureAccountCryptoReady('user-1', VAULT_SYNC.ABSENT)).toBe(CRYPTO_STATUS.ORPHANED);
    expect(isUnlocked()).toBe(false);
  });

  it('checks filtered child history beyond a nested response limit', async () => {
    db.prayers = [{ id: 'p', user_id: 'user-1', prayer_updates: [] }];
    db.prayer_updates = Array.from({ length: 1000 }, (_, id) => ({ id: String(id), prayers: { user_id: 'user-1' } }));
    db.prayer_updates.push({ id: 'last', prayers: { user_id: 'user-1' }, encrypted_payload: '' });
    expect(await ensureAccountCryptoReady('user-1', VAULT_SYNC.ABSENT)).toBe(CRYPTO_STATUS.ORPHANED);
    expect(isUnlocked()).toBe(false);
  });

  it('retains recovery protection when attachment history survives alone', async () => {
    db.prayers = [{ id: 'p', user_id: 'user-1', prayer_testimonies: [{ attachments: [{ path: 'private/file', key: 'key', iv: 'iv' }] }] }];
    expect(await ensureAccountCryptoReady('user-1', VAULT_SYNC.ABSENT)).toBe(CRYPTO_STATUS.ORPHANED);
    expect(isUnlocked()).toBe(false);
  });

  it('does NOT offer to start fresh when the recovery lookup failed', async () => {
    // Same shape as the ORPHANED case, except the caller could not read
    // vault_keys. A recovery record may well exist, so the honest answer is the
    // retry screen — not the one that says none was set up and offers to
    // discard everything encrypted under the missing key.
    db.user_crypto_keys.set('user-1', { user_id: 'user-1', public_key_jwk: {}, encrypted_private_key: {} });

    const status = await ensureAccountCryptoReady('user-1', VAULT_SYNC.UNKNOWN);

    expect(status).toBe(CRYPTO_STATUS.UNAVAILABLE);
    expect(isUnlocked()).toBe(false);
  });

  it('still surfaces ORPHANED when the server confirms there is no recovery record', async () => {
    db.user_crypto_keys.set('user-1', { user_id: 'user-1', public_key_jwk: {}, encrypted_private_key: {} });

    const status = await ensureAccountCryptoReady('user-1', VAULT_SYNC.ABSENT);

    expect(status).toBe(CRYPTO_STATUS.ORPHANED);
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
