import { beforeEach, describe, expect, it } from 'vitest';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import {
  changePassphrase,
  createVault,
  destroyVault,
  exportVaultRecord,
  importVaultRecord,
  isUnlocked,
  lock,
  unlock,
} from './crypto/keyManager';
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
});
