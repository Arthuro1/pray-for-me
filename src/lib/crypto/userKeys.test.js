import { describe, it, expect, beforeEach, vi } from 'vitest';

// In-memory stand-in for the user_crypto_keys table + the public_keys view.
// Rows persist across tests, so each test uses a distinct user id to stay
// isolated (a row wrapped under one test's account key can't be unwrapped under
// another's).
vi.mock('../supabase', () => {
  const rows = new Map();
  const make = (table) => {
    const q = { _table: table, _id: null };
    q.select = () => q;
    q.eq = (_col, val) => { q._id = val; return q; };
    q.upsert = (row) => { rows.set(row.user_id, { ...row }); return Promise.resolve({ data: null, error: null }); };
    q.maybeSingle = () => {
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
import { autoInitAccountKey, destroyVault } from './keyManager';

beforeEach(async () => {
  installStorage();
  await destroyVault();
  clearUserKeyCache();
  await autoInitAccountKey(); // an account key must be ready to wrap the private key
});

describe('user identity keypair', () => {
  it('generates, publishes and caches an RSA identity keypair', async () => {
    const jwk = await ensureUserPublicKey('u-gen');
    expect(jwk).toBeTruthy();
    expect(jwk.kty).toBe('RSA');
    expect(getMyPrivateKey()).toBeTruthy();
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
});
