import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createVault,
  unlock,
  verifyRecoveryPassphrase,
  lock,
  isUnlocked,
  isVaultInitialized,
  getMasterKey,
  resetPassphrase,
  changePassphrase,
  rotateRecoveryCode,
  destroyVault,
  exportVaultRecord,
  importVaultRecord,
  inspectVaultRecord,
  generateRecoveryCode,
  encodeRecoveryBytes,
  normalizeRecoveryCode,
  RECOVERY_CODE_NORMALIZED_LENGTH,
} from './keyManager.ts';
import { encryptJsonLegacy, decryptJson } from './e2ee.ts';

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
    const payload = await encryptJsonLegacy(getMasterKey(), { msg: 'hello vault' });
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

describe('read-only migration recovery verification', () => {
  it('checks the server wrapper while preserving the running key, local wrapper and existing ciphertext', async () => {
    await createVault('old recovery passphrase');
    const originalRecord = exportVaultRecord();
    const ciphertext = await encryptJsonLegacy(getMasterKey(), { prayer: 'still readable' });
    await changePassphrase('old recovery passphrase', 'new recovery passphrase');
    const serverRecord = exportVaultRecord();
    await importVaultRecord(originalRecord, true); // stale local wrapper, same content key
    const runningKey = getMasterKey();

    expect(await verifyRecoveryPassphrase('new recovery passphrase', serverRecord)).toBe(true);
    expect(await verifyRecoveryPassphrase('old recovery passphrase', serverRecord)).toBe(false);
    expect(getMasterKey()).toBe(runningKey);
    expect(exportVaultRecord()).toBe(originalRecord);
    expect(await decryptJson(getMasterKey(), ciphertext)).toEqual({ prayer: 'still readable' });
  });

  it('rejects an unrelated wrapped key even when the passphrase is valid, without replacing the current key', async () => {
    await createVault('same passphrase');
    const unrelatedRecord = exportVaultRecord();
    await destroyVault();
    await createVault('same passphrase');
    const runningKey = getMasterKey();
    const currentRecord = exportVaultRecord();
    const ciphertext = await encryptJsonLegacy(runningKey, { prayer: 'my current prayer' });

    expect(await verifyRecoveryPassphrase('same passphrase', unrelatedRecord)).toBe(false);
    expect(await verifyRecoveryPassphrase('same passphrase', { invalid: true })).toBe(false);
    expect(getMasterKey()).toBe(runningKey);
    expect(exportVaultRecord()).toBe(currentRecord);
    expect(await decryptJson(getMasterKey(), ciphertext)).toEqual({ prayer: 'my current prayer' });
    lock();
    expect(await verifyRecoveryPassphrase('same passphrase', currentRecord)).toBe(false);
    expect(isUnlocked()).toBe(false);
  });
});

describe('recovery code', () => {
  it('resets the passphrase and still decrypts old data', async () => {
    const code = await createVault('old-pass');
    const payload = await encryptJsonLegacy(getMasterKey(), { v: 'survives reset' });
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
    const normalized = code.replaceAll('-', '');
    expect(normalized).toHaveLength(RECOVERY_CODE_NORMALIZED_LENGTH);
    expect(normalized).toMatch(/^[0-9A-HJKMNP-TV-Z]+$/);
    expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{5}(?:-[0-9A-HJKMNP-TV-Z]{5}){4}-[0-9A-HJKMNP-TV-Z]$/);
  });

  it('matches deterministic Crockford Base32 encoder vectors', () => {
    expect(encodeRecoveryBytes(new Uint8Array(16))).toBe('00000000000000000000000000');
    expect(encodeRecoveryBytes(new Uint8Array(16).fill(255))).toBe('ZZZZZZZZZZZZZZZZZZZZZZZZZW');
  });

  it('rejects malformed, ambiguous, or incorrectly-sized codes', async () => {
    await createVault('pass');
    lock();
    expect(normalizeRecoveryCode('OOOOO-OOOOO-OOOOO-OOOOO-OOOOO-O')).toBeNull();
    expect(normalizeRecoveryCode('AAAAA-AAAAA-AAAAA-AAAAA-AAAAA')).toBeNull();
    expect(await resetPassphrase('<script>bad</script>', 'new-pass')).toBe(false);
  });

  it('keeps legacy version-1 recovery records readable', async () => {
    const code = await createVault('old-pass');
    const legacyRecord = JSON.parse(exportVaultRecord());
    legacyRecord.v = 1;
    lock();
    await importVaultRecord(JSON.stringify(legacyRecord), true);
    expect(await resetPassphrase(code, 'migrated-pass')).toBe(true);
  });
});

describe('rotateRecoveryCode', () => {
  it('issues a new code that works and invalidates the old one', async () => {
    const oldCode = await createVault('pass');
    const payload = await encryptJsonLegacy(getMasterKey(), { v: 'survives rotation' });

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
    const before = inspectVaultRecord(exportVaultRecord());
    expect(await changePassphrase('p1', 'p2')).toBe(true);
    const after = inspectVaultRecord(exportVaultRecord());
    expect(after.revision).toBe(before.revision + 1);
    expect(after.updatedAt).toBeGreaterThanOrEqual(before.updatedAt);
    lock();
    expect(await unlock('p1')).toBe(false);
    expect(await unlock('p2')).toBe(true);
  });

  it('refuses with the wrong current passphrase', async () => {
    await createVault('p1');
    expect(await changePassphrase('nope', 'p2')).toBe(false);
  });

  it('does not let a malformed synced record replace a usable vault', async () => {
    await createVault('still-works');
    const original = exportVaultRecord();

    expect(await importVaultRecord('{"v":2}', true)).toBe(false);
    expect(exportVaultRecord()).toBe(original);

    lock();
    expect(await unlock('still-works')).toBe(true);
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
    await createVault('migration-pass');
    const payload = await encryptJsonLegacy(getMasterKey(), { prayer: 'original legacy ciphertext' });
    const legacy = { ...JSON.parse(exportVaultRecord()), v: 1 };
    await destroyVault();
    vi.resetModules();
    installStorage();
    globalThis.localStorage.setItem('pfm_vault', JSON.stringify(legacy));

    const km = await import('./keyManager.ts');
    await km.hydrate();

    expect(km.isVaultInitialized()).toBe(true);
    // The wrapped key no longer lives in localStorage after migration.
    expect(globalThis.localStorage.getItem('pfm_vault')).toBe(null);
    expect(km.exportVaultRecord()).toContain('passSalt');
    expect(await km.unlock('migration-pass')).toBe(true);
    expect(await decryptJson(km.getMasterKey(), payload)).toEqual({ prayer: 'original legacy ciphertext' });
  });
});

describe('legacy recovery record validation', () => {
  it('retains v1/v2 ciphertext and historical metadata with standard padded or unpadded Base64', async () => {
    const code = await createVault('compatible-pass');
    const encrypted = await encryptJsonLegacy(getMasterKey(), { prayer: 'unchanged original' });
    const original = JSON.parse(exportVaultRecord());
    const unpad = (value) => value.replace(/=+$/, '');
    const compatible = { ...original, v: 1, historicalMetadata: 'retained',
      passSalt: unpad(original.passSalt), recoverySalt: unpad(original.recoverySalt),
      passWrapped: { iv: unpad(original.passWrapped.iv), data: unpad(original.passWrapped.data) },
      recoveryWrapped: { iv: unpad(original.recoveryWrapped.iv), data: unpad(original.recoveryWrapped.data) } };
    delete compatible.revision; delete compatible.updatedAt;
    expect(inspectVaultRecord(compatible)).toMatchObject({ revision: 0, updatedAt: 0 });
    lock();
    expect(await importVaultRecord(compatible, true)).toBe(true);
    expect(await unlock('compatible-pass')).toBe(true);
    expect(await decryptJson(getMasterKey(), encrypted)).toEqual({ prayer: 'unchanged original' });
    expect(JSON.parse(exportVaultRecord()).historicalMetadata).toBe('retained');
    expect(await resetPassphrase(code, 'new-compatible-pass')).toBe(true);
    expect(await decryptJson(getMasterKey(), encrypted)).toEqual({ prayer: 'unchanged original' });
  });

  it('rejects malformed binary parameters and unsafe metadata without replacing a usable vault', async () => {
    await createVault('preserved-pass');
    const original = exportVaultRecord();
    const record = JSON.parse(original);
    const b64 = (bytes) => Buffer.alloc(bytes).toString('base64');
    const invalid = [[], { ...record, passSalt: 'x' }, { ...record, recoverySalt: b64(15) },
      { ...record, passWrapped: { iv: b64(11), data: b64(48) } },
      { ...record, recoveryWrapped: { iv: b64(12), data: b64(47) } },
      { ...record, revision: Number.MAX_SAFE_INTEGER + 1 }, { ...record, updatedAt: 'invalid timestamp' },
      { ...record, extra: 'x'.repeat(16_384) }];
    for (const value of invalid) {
      expect(inspectVaultRecord(value)).toBeNull();
      expect(await importVaultRecord(value, true)).toBe(false);
      expect(exportVaultRecord()).toBe(original);
    }
    lock();
    expect(await unlock('preserved-pass')).toBe(true);
  });

  it('keeps genuine version-1 16-character recovery credentials usable', async () => {
    await createVault('historical-pass');
    const encrypted = await encryptJsonLegacy(getMasterKey(), { prayer: 'historical sixteen-character code' });
    const record = { ...JSON.parse(exportVaultRecord()), v: 1 };
    const code = '0123456789ABCDEF';
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']);
    const wrapping = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', iterations: 310_000,
      salt: new Uint8Array(Buffer.from(record.recoverySalt, 'base64')) }, base, { name: 'AES-GCM', length: 256 }, false, ['wrapKey']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const wrapped = await crypto.subtle.wrapKey('raw', getMasterKey(), wrapping, { name: 'AES-GCM', iv });
    record.recoveryWrapped = { iv: Buffer.from(iv).toString('base64'), data: Buffer.from(wrapped).toString('base64') };
    delete record.revision; delete record.updatedAt;
    lock();
    expect(await importVaultRecord(record, true)).toBe(true);
    expect(await resetPassphrase('01234-56789-ABCDE-F', 'restored-pass')).toBe(true);
    expect(await decryptJson(getMasterKey(), encrypted)).toEqual({ prayer: 'historical sixteen-character code' });
  }, 30_000);
});
