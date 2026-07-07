import { describe, it, expect, beforeEach } from 'vitest';
import { ensureAccountCryptoReady } from './accountKey';
import { isUnlocked, isVaultInitialized, getMasterKey, lock, destroyVault, createVault } from './keyManager';
import { encryptJson, decryptJson } from './e2ee';

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
  await destroyVault(); // clears the cached record + in-memory key between tests
});

describe('ensureAccountCryptoReady', () => {
  it('auto-provisions an account key on first use — no vault, no passphrase', async () => {
    expect(isUnlocked()).toBe(false);
    expect(isVaultInitialized()).toBe(false);

    await ensureAccountCryptoReady('user-1');

    expect(isUnlocked()).toBe(true);
    // Encryption is on, but recovery is NOT configured (transparent by default).
    expect(isVaultInitialized()).toBe(false);
  });

  it('is idempotent and keeps the SAME key (data stays readable)', async () => {
    await ensureAccountCryptoReady('user-1');
    const payload = await encryptJson(getMasterKey(), { msg: 'hello account key' });

    await ensureAccountCryptoReady('user-1'); // must not rotate the key

    expect(await decryptJson(getMasterKey(), payload)).toEqual({ msg: 'hello account key' });
  });

  it('does not mint a new key when a recovery record exists but none is loaded', async () => {
    // Simulates a fresh device that pulled the wrapped recovery record but has no
    // local key: it must stay LOCKED for the recovery unlock UI, not auto-init a
    // NEW key that could never read the recovery-protected data.
    await createVault('pass'); // recovery configured (record present)
    lock(); // key not in memory, as on a new device

    await ensureAccountCryptoReady('user-1');

    expect(isUnlocked()).toBe(false);
  });
});
