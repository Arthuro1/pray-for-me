import { beforeEach, describe, expect, it } from 'vitest';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import {
  autoInitAccountKey,
  changePassphrase,
  createVault,
  destroyVault,
  exportVaultRecord,
  getMasterKey,
  importVaultRecord,
  isUnlocked,
  lock,
  resetPassphrase,
  setUpRecovery,
  unlock,
} from './crypto/keyManager';
import { decryptJson, encryptJson } from './crypto/e2ee';
import {
  CRYPTO_STATUS,
  ensureAccountCryptoReady,
  forgetAccountKey,
  lockAccountKey,
  rememberAccountKey,
} from './crypto/accountKey';
import { VAULT_SYNC } from './vaultSync';

const USER_ID = 'vault-browser-user';

describe('vault lifecycle in a real browser', () => {
  beforeEach(async () => {
    await destroyVault();
    await forgetAccountKey(USER_ID);
    localStorage.removeItem(`pfm_ak_locked_${USER_ID}`);
    sessionStorage.clear();
  });

  it('keeps an explicit lock across startup and restores the device key after unlock', async () => {
    await createVault('durable passphrase');
    await rememberAccountKey(USER_ID);
    expect(await idbGet(`pfm_ak_${USER_ID}`)).toBeTruthy();

    await lockAccountKey(USER_ID);
    expect(isUnlocked()).toBe(false);
    expect(await idbGet(`pfm_ak_${USER_ID}`)).toBeUndefined();
    expect(localStorage.getItem(`pfm_ak_locked_${USER_ID}`)).toBeTruthy();
    expect(await ensureAccountCryptoReady(USER_ID, VAULT_SYNC.PRESENT)).toBe(CRYPTO_STATUS.LOCKED);

    expect(await unlock('durable passphrase')).toBe(true);
    await rememberAccountKey(USER_ID, { clearLock: true });
    expect(await idbGet(`pfm_ak_${USER_ID}`)).toBeTruthy();
    expect(localStorage.getItem(`pfm_ak_locked_${USER_ID}`)).toBeNull();
  });

  it('uses a newer wrapper written by another tab before checking a passphrase', async () => {
    await createVault('old passphrase');
    const stale = exportVaultRecord();
    expect(await changePassphrase('old passphrase', 'new passphrase')).toBe(true);
    const fresh = JSON.parse(exportVaultRecord());

    await importVaultRecord(stale, true); // this tab still has the old wrapper
    await idbSet('pfm_vault', fresh); // another tab persisted the newer wrapper
    lock();

    expect(await unlock('old passphrase')).toBe(false);
    expect(await unlock('new passphrase')).toBe(true);
  });

  it('lets an explicit lock win a race with background device-key persistence', async () => {
    await createVault('race-safe passphrase');
    await rememberAccountKey(USER_ID);

    const backgroundWrite = rememberAccountKey(USER_ID);
    const explicitLock = lockAccountKey(USER_ID);
    await Promise.all([backgroundWrite, explicitLock]);

    expect(isUnlocked()).toBe(false);
    expect(localStorage.getItem(`pfm_ak_locked_${USER_ID}`)).toBeTruthy();
    expect(await idbGet(`pfm_ak_${USER_ID}`)).toBeUndefined();
  });

  // Exercise the recovery boundary with real IndexedDB and Web Crypto. Removing
  // the disposable account's local state models the new origin's empty storage;
  // only the wrapped record (as returned by the server) survives the boundary.
  // This does not substitute for a deployed, two-origin sign-in/TWA smoke test.
  for (const method of ['passphrase', 'recovery code']) {
    it(`reads existing ciphertext on a fresh device using the ${method}`, async () => {
      await autoInitAccountKey();
      await rememberAccountKey(USER_ID);
      const context = {
        entityType: 'personal-prayer', ownerOrGroupId: USER_ID,
        recordId: 'migration-prayer', keyVersion: 1,
      };
      const content = { title: 'Synthetic migration prayer', description: 'Saved before recovery setup' };
      const ciphertext = await encryptJson(getMasterKey(), content, context);
      const code = await setUpRecovery('migration recovery passphrase');
      const serverRecord = exportVaultRecord();
      expect(await decryptJson(getMasterKey(), ciphertext, context)).toEqual(content);

      await forgetAccountKey(USER_ID);
      await destroyVault();
      expect(await idbGet(`pfm_ak_${USER_ID}`)).toBeUndefined();
      expect(isUnlocked()).toBe(false);

      expect(await importVaultRecord(serverRecord)).toBe(true);
      expect(await ensureAccountCryptoReady(USER_ID, VAULT_SYNC.PRESENT)).toBe(CRYPTO_STATUS.LOCKED);
      if (method === 'passphrase') {
        expect(await unlock('migration recovery passphrase')).toBe(true);
      } else {
        expect(await resetPassphrase(code, 'replacement recovery passphrase')).toBe(true);
      }
      expect(await decryptJson(getMasterKey(), ciphertext, context)).toEqual(content);
      expect(await rememberAccountKey(USER_ID)).toBe(true);
      expect(await idbGet(`pfm_ak_${USER_ID}`)).toBeTruthy();
    });
  }
});
