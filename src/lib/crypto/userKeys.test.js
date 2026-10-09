import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ rows: new Map(), readError: null, beforeInsert: null, writes: vi.fn() }));

// In-memory stand-in for the user_crypto_keys table + the public_keys view.
// Rows persist across tests, so each test uses a distinct user id to stay
// isolated (a row wrapped under one test's account key can't be unwrapped under
// another's).
vi.mock('../supabase', () => {
  const rows = fixture.rows;
  const make = (table) => {
    const q = { _table: table, _id: null };
    q.select = () => q;
    q.eq = (_col, val) => { q._id = val; return q; };
    q.upsert = (row) => { fixture.writes('upsert'); rows.set(row.user_id, { ...row }); return Promise.resolve({ data: null, error: null }); };
    q.insert = (row) => {
      fixture.writes('insert');
      fixture.beforeInsert?.();
      fixture.beforeInsert = null;
      if (rows.has(row.user_id)) return Promise.resolve({ data: null, error: { code: '23505' } });
      rows.set(row.user_id, { ...row });
      return Promise.resolve({ data: null, error: null });
    };
    q.maybeSingle = () => {
      if (fixture.readError) return Promise.resolve({ data: null, error: fixture.readError });
      const r = rows.get(q._id) || null;
      if (!r) return Promise.resolve({ data: null, error: null });
      if (q._table === 'public_keys') return Promise.resolve({ data: { public_key_jwk: r.public_key_jwk }, error: null });
      return Promise.resolve({ data: { public_key_jwk: r.public_key_jwk, encrypted_private_key: r.encrypted_private_key }, error: null });
    };
    return q;
  };
  return { supabase: { from: make } };
});

function installStorage() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

import { ensureUserPublicKey, getMyPrivateKey, getMemberPublicKey, clearUserKeyCache } from './userKeys';
import { autoInitAccountKey, destroyVault, lock, exportRawMasterKey, importRawMasterKey } from './keyManager';

beforeEach(async () => {
  installStorage();
  fixture.readError = null;
  fixture.beforeInsert = null;
  fixture.writes.mockClear();
  await destroyVault();
  clearUserKeyCache();
  await autoInitAccountKey(); // an account key must be ready to wrap the private key
});

afterEach(() => vi.restoreAllMocks());

describe('user identity keypair', () => {
  it('generates, publishes and caches an RSA identity keypair', async () => {
    const jwk = await ensureUserPublicKey('u-gen');
    expect(jwk).toBeTruthy();
    expect(jwk.kty).toBe('RSA');
    expect(getMyPrivateKey()).toBeTruthy();
  });

  it('coalesces concurrent first-use initialisation to one identity', async () => {
    const [first, second, third] = await Promise.all([
      ensureUserPublicKey('u-concurrent'),
      ensureUserPublicKey('u-concurrent'),
      ensureUserPublicKey('u-concurrent'),
    ]);

    expect(first).toEqual(second);
    expect(second).toEqual(third);

    const published = await getMemberPublicKey('u-concurrent');
    const secret = new TextEncoder().encode('same-identity');
    const ciphertext = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, published, secret);
    const plaintext = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, getMyPrivateKey(), ciphertext);
    expect(new TextDecoder().decode(plaintext)).toBe('same-identity');
  });

  it('the published public key wraps to the matching private key (RSA-OAEP round-trip)', async () => {
    await ensureUserPublicKey('u-rsa');
    const pub = await getMemberPublicKey('u-rsa');
    expect(pub).toBeTruthy();

    const secret = new TextEncoder().encode('a-group-content-key');
    const ct = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, pub, secret);
    const pt = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, getMyPrivateKey(), ct);
    expect(new TextDecoder().decode(pt)).toBe('a-group-content-key');
  });

  it('reloads the same key from the server, unwrapping the private key with the account key', async () => {
    const jwk1 = await ensureUserPublicKey('u-reload');
    clearUserKeyCache();
    const jwk2 = await ensureUserPublicKey('u-reload'); // fetched + unwrapped, not regenerated
    expect(jwk2).toEqual(jwk1);
    expect(getMyPrivateKey()).toBeTruthy();
  });

  it('returns null when the account key is locked (cannot wrap the private key)', async () => {
    await destroyVault(); // drop the account key
    clearUserKeyCache();
    expect(await ensureUserPublicKey('u-locked')).toBe(null);
  });

  it('drops the cached private key synchronously on lock', async () => {
    await ensureUserPublicKey('u-lock-cached');
    expect(getMyPrivateKey()).toBeTruthy();
    lock();
    expect(getMyPrivateKey()).toBeNull();
  });

  it('never publishes over an identity when its lookup fails', async () => {
    const jwk = await ensureUserPublicKey('u-read-error');
    const original = fixture.rows.get('u-read-error');
    clearUserKeyCache();
    fixture.writes.mockClear();
    fixture.readError = { code: 'network_error' };
    expect(await ensureUserPublicKey('u-read-error')).toBeNull();
    expect(fixture.writes).not.toHaveBeenCalled();
    expect(fixture.rows.get('u-read-error')).toBe(original);
    fixture.readError = null;
    expect(await ensureUserPublicKey('u-read-error')).toEqual(jwk);
  });

  it('adopts the identity published by a competing first-use writer without overwriting it', async () => {
    const winner = await ensureUserPublicKey('u-insert-race');
    const winnerRow = fixture.rows.get('u-insert-race');
    clearUserKeyCache();
    fixture.rows.delete('u-insert-race');
    fixture.beforeInsert = () => fixture.rows.set('u-insert-race', winnerRow);
    fixture.writes.mockClear();
    expect(await ensureUserPublicKey('u-insert-race')).toEqual(winner);
    expect(fixture.rows.get('u-insert-race')).toBe(winnerRow);
    expect(fixture.writes.mock.calls).toEqual([['insert']]);
    expect(getMyPrivateKey()).toBeTruthy();
  });

  it('preserves incomplete identity metadata rather than replacing it', async () => {
    const partial = { public_key_jwk: { kty: 'RSA' }, encrypted_private_key: null };
    fixture.rows.set('u-partial', partial);
    expect(await ensureUserPublicKey('u-partial')).toBeNull();
    expect(fixture.rows.get('u-partial')).toBe(partial);
    expect(fixture.writes).not.toHaveBeenCalled();
  });

  it('rejects an identity unwrap that completes after lock and subsequent unlock', async () => {
    const originalJwk = await ensureUserPublicKey('u-stale-unwrap');
    const ack = await exportRawMasterKey();
    clearUserKeyCache();
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    const originalImport = crypto.subtle.importKey.bind(crypto.subtle);
    const importSpy = vi.spyOn(crypto.subtle, 'importKey').mockImplementation(async (...args) => {
      if (args[0] === 'pkcs8') await gate;
      return originalImport(...args);
    });
    const pending = ensureUserPublicKey('u-stale-unwrap');
    await vi.waitFor(() => expect(importSpy.mock.calls.some(([format]) => format === 'pkcs8')).toBe(true));
    lock();
    await importRawMasterKey(ack);
    release();
    expect(await pending).toBeNull();
    expect(getMyPrivateKey()).toBeNull();
    importSpy.mockRestore();
    expect(await ensureUserPublicKey('u-stale-unwrap')).toEqual(originalJwk);
  });
});
