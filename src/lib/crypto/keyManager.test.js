import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createVault,
  unlock,
  lock,
  isUnlocked,
  isVaultInitialized,
  getMasterKey,
  resetPassphrase,
  changePassphrase,
  rotateRecoveryCode,
  destroyVault,
  exportVaultRecord,
  generateRecoveryCode,
} from './keyManager.ts';
import { encryptJson, decryptJson } from './e2ee.ts';

// Minimal localStorage shim for the Node test env.
function installStorage() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

// The record now lives in an in-memory cache (backed by IndexedDB in the
// browser; absent in this node env). destroyVault clears that cache, so it
// doubles as a per-test reset to keep tests isolated.
beforeEach(async () => {
  installStorage();
  await destroyVault();
});

describe('vault lifecycle', () => {
  it('creates, locks and unlocks with the passphrase', async () => {
    expect(isVaultInitialized()).toBe(false);
    const code = await createVault('correct horse battery staple');
    expect(typeof code).toBe('string');
    expect(isVaultInitialized()).toBe(true);
    expect(isUnlocked()).toBe(true);

    lock();
    expect(isUnlocked()).toBe(false);
    expect(() => getMasterKey()).toThrow();

    expect(await unlock('correct horse battery staple')).toBe(true);
    expect(isUnlocked()).toBe(true);
  });

  it('rejects a wrong passphrase without throwing', async () => {
    await createVault('right-pass');
    lock();
    expect(await unlock('wrong-pass')).toBe(false);
    expect(isUnlocked()).toBe(false);
  });

  it('keeps the SAME master key across lock/unlock (data stays readable)', async () => {
    await createVault('pass');
    const payload = await encryptJson(getMasterKey(), { msg: 'hello vault' });
    lock();
    await unlock('pass');
    expect(await decryptJson(getMasterKey(), payload)).toEqual({ msg: 'hello vault' });
  });

  it('never persists the key or passphrase in cleartext', async () => {
    await createVault('zebra-lantern-velvet');
    const stored = exportVaultRecord(); // the at-rest record (cache mirrors IndexedDB)
    const mkRaw = await crypto.subtle.exportKey('raw', getMasterKey());
    const mkB64 = Buffer.from(mkRaw).toString('base64');
    expect(stored).not.toContain(mkB64);
    expect(stored).not.toContain('zebra-lantern-velvet'); // passphrase isn't stored either
  });
});

describe('recovery code', () => {
  it('resets the passphrase and still decrypts old data', async () => {
    const code = await createVault('old-pass');
    const payload = await encryptJson(getMasterKey(), { v: 'survives reset' });
    lock();

    expect(await resetPassphrase(code, 'new-pass')).toBe(true);
    expect(await decryptJson(getMasterKey(), payload)).toEqual({ v: 'survives reset' });

    lock();
    expect(await unlock('old-pass')).toBe(false);
    expect(await unlock('new-pass')).toBe(true);
  });

  it('rejects a wrong recovery code', async () => {
    await createVault('pass');
    lock();
    expect(await resetPassphrase('WRONG-CODE-0000', 'new-pass')).toBe(false);
  });

  it('generates grouped, readable codes', () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[0-9A-HJ-NP-TV-Z]{5}(-[0-9A-HJ-NP-TV-Z]{1,5})+$/);
  });
});

describe('rotateRecoveryCode', () => {
  it('issues a new code that works and invalidates the old one', async () => {
    const oldCode = await createVault('pass');
    const payload = await encryptJson(getMasterKey(), { v: 'survives rotation' });

    const newCode = await rotateRecoveryCode();
    expect(typeof newCode).toBe('string');
    expect(newCode).not.toBe(oldCode);

    // Old code no longer resets; data still decrypts after a reset with the new one.
    lock();
    expect(await resetPassphrase(oldCode, 'x-pass')).toBe(false);
    expect(await resetPassphrase(newCode, 'new-pass')).toBe(true);
    expect(await decryptJson(getMasterKey(), payload)).toEqual({ v: 'survives rotation' });
  });

  it('leaves the passphrase untouched', async () => {
    await createVault('keep-me');
    await rotateRecoveryCode();
    lock();
    expect(await unlock('keep-me')).toBe(true);
  });

  it('returns null when the vault is locked', async () => {
    await createVault('pass');
    lock();
    expect(await rotateRecoveryCode()).toBe(null);
  });
});

describe('changePassphrase', () => {
  it('rotates the passphrase when the current one is correct', async () => {
    await createVault('p1');
    expect(await changePassphrase('p1', 'p2')).toBe(true);
    lock();
    expect(await unlock('p1')).toBe(false);
    expect(await unlock('p2')).toBe(true);
  });

  it('refuses with the wrong current passphrase', async () => {
    await createVault('p1');
    expect(await changePassphrase('nope', 'p2')).toBe(false);
  });
});

describe('destroyVault', () => {
  it('removes the record and locks', async () => {
    await createVault('pass');
    await destroyVault();
    expect(isVaultInitialized()).toBe(false);
    expect(isUnlocked()).toBe(false);
  });
});

describe('storage migration', () => {
  // A fresh module instance (resetModules) so hydrate() runs its one-time
  // migration against a pre-seeded legacy localStorage record.
  it('migrates a legacy localStorage record into the cache and clears localStorage', async () => {
    vi.resetModules();
    installStorage();
    const legacy = { v: 1, passSalt: 'ps', recoverySalt: 'rs', passWrapped: { iv: 'i', data: 'd' }, recoveryWrapped: { iv: 'i2', data: 'd2' } };
    globalThis.localStorage.setItem('pfm_vault', JSON.stringify(legacy));

    const km = await import('./keyManager.ts');
    await km.hydrate();

    expect(km.isVaultInitialized()).toBe(true);
    // The wrapped key no longer lives in localStorage after migration.
    expect(globalThis.localStorage.getItem('pfm_vault')).toBe(null);
    expect(km.exportVaultRecord()).toContain('passSalt');
  });
});
