import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => ({ records: new Map(), beforeSet: null }));
vi.mock('idb-keyval', () => ({
  get: async (key) => storage.records.get(key),
  set: async (key, value) => {
    if (storage.beforeSet) await storage.beforeSet(key, value);
    storage.records.set(key, value);
  },
  del: async (key) => { storage.records.delete(key); },
}));
vi.mock('../supabase', () => ({ supabase: {
  auth: { getUser: async () => ({ data: { user: null } }) },
  from: () => { throw new Error('Unexpected network lookup'); },
} }));
vi.mock('./userKeys', () => ({ regenerateIdentityKey: vi.fn() }));
vi.mock('./groupKeys', () => ({ clearGroupKeyDistributionCache: vi.fn() }));

import {
  configureAccountContext, createVault, destroyVault, exportRawMasterKey, autoInitAccountKey,
  exportVaultRecord, getDeviceProtectionPolicy, getLifecycleToken, getMasterKey,
  hydrate, importRawMasterKey, installCandidateMasterKey, isUnlocked,
  isVaultInitialized, lock, readUnassignedLegacyVaultRecord, setDeviceProtectionPolicy,
  recoverUnassignedLegacyVault, handleAccountSecurityStorageChange, unlock, verifyRecoveryCode,
} from './keyManager';
import { decryptJson, encryptJsonLegacy } from './e2ee';
import { rememberAccountKey, clearTransparentAccountKey, ensureAccountCryptoReady, forgetAccountKey, lockAccountKey, CRYPTO_STATUS } from './accountKey';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}

beforeEach(async () => {
  vi.restoreAllMocks();
  globalThis.indexedDB = {};
  globalThis.localStorage = memoryStorage();
  globalThis.sessionStorage = memoryStorage();
  storage.records.clear();
  storage.beforeSet = null;
  configureAccountContext('account-a');
  await destroyVault();
});

describe('account-bound key lifecycle', () => {
  it.each(['sign-out', 'account switch'])('preserves the sole transparent ACK when %s races a redundant raw write', async (action) => {
    await autoInitAccountKey();
    expect(isVaultInitialized()).toBe(false); // no wrapped recovery backup
    const raw = await exportRawMasterKey();
    expect(await rememberAccountKey('account-a')).toBe(true);
    const ciphertext = await encryptJsonLegacy(getMasterKey(), { prayer: 'only original ACK can read me' });
    let finishWrite;
    storage.beforeSet = (key) => key === 'pfm_ak_account-a' ? new Promise((resolve) => { finishWrite = resolve; }) : undefined;
    const pending = rememberAccountKey('account-a');
    await vi.waitFor(() => expect(finishWrite).toBeTypeOf('function'));
    configureAccountContext(action === 'sign-out' ? null : 'account-b');
    finishWrite(); expect(await pending).toBe(false); storage.beforeSet = null;
    expect(storage.records.get('pfm_ak_account-a')).toBe(raw);
    expect(isUnlocked()).toBe(false);
    configureAccountContext('account-a');
    expect(await ensureAccountCryptoReady('account-a', 'absent')).toBe(CRYPTO_STATUS.READY);
    expect(await decryptJson(getMasterKey(), ciphertext)).toEqual({ prayer: 'only original ACK can read me' });
  });

  it.each(['explicit lock', 'account deletion'])('still drains and erases a late transparent write on %s', async (action) => {
    await autoInitAccountKey(); await rememberAccountKey('account-a');
    let finishWrite;
    storage.beforeSet = (key) => key === 'pfm_ak_account-a' ? new Promise((resolve) => { finishWrite = resolve; }) : undefined;
    const pending = rememberAccountKey('account-a');
    await vi.waitFor(() => expect(finishWrite).toBeTypeOf('function'));
    let cleanup;
    if (action === 'explicit lock') cleanup = lockAccountKey('account-a');
    else { configureAccountContext(null); cleanup = forgetAccountKey('account-a'); }
    finishWrite(); expect(await pending).toBe(false); await cleanup;
    expect(storage.records.has('pfm_ak_account-a')).toBe(false);
  });
  it.each(['snapshot', 'owned-queue', 'unassigned-queue'])('never replaces a missing key while encrypted %s history survives locally', async (source) => {
    const ciphertext = { encrypted_payload: { data: 'only remaining encrypted prayer' }, encryption_version: 2 };
    if (source === 'snapshot') storage.records.set('pfm_data_account-a', { prayers: [ciphertext] });
    else storage.records.set('pfm_mutation_queue', [{ id: 'pending', kind: 'write',
      ...(source === 'owned-queue' ? { accountId: 'account-a' } : {}), args: { row: ciphertext } }]);
    expect(await ensureAccountCryptoReady('account-a', 'absent')).toBe(CRYPTO_STATUS.ORPHANED);
    expect(isUnlocked()).toBe(false);
    expect(storage.records.has('pfm_ak_account-a')).toBe(false);
  });

  it.each(['pfm_data_account-a', 'pfm_mutation_queue', 'pfm_protected_device_v1:account-a'])('fails closed on unreadable local recovery evidence in %s', async (key) => {
    storage.records.set(key, 'unrecognized original metadata');
    expect(await ensureAccountCryptoReady('account-a', 'absent')).toBe(CRYPTO_STATUS.UNAVAILABLE);
    expect(storage.records.get(key)).toBe('unrecognized original metadata');
    expect(isUnlocked()).toBe(false);
  });
  it('keeps wrapped backups scoped and never restores a prior account session', async () => {
    await createVault('account a recovery');
    const record = exportVaultRecord();
    expect(storage.records.get('pfm_vault:account-a')).toEqual(JSON.parse(record));
    await exportRawMasterKey(); // drain the preceding session export

    configureAccountContext('account-b');
    await hydrate();
    expect(isUnlocked()).toBe(false);
    expect(isVaultInitialized()).toBe(false);
    expect(sessionStorage.getItem('pfm_vault_session:account-a')).toBeNull();

    configureAccountContext('account-a');
    await hydrate();
    expect(exportVaultRecord()).toBe(record);
    expect(await unlock('account a recovery')).toBe(true);
  });

  it('retains unassigned legacy recovery material without attributing it to a login', async () => {
    await createVault('legacy backup');
    const record = exportVaultRecord();
    storage.records.set('pfm_vault', JSON.parse(record));
    configureAccountContext('account-b');
    await hydrate();
    expect(exportVaultRecord()).toBeNull();
    expect(await readUnassignedLegacyVaultRecord()).toBe(record);
    expect(storage.records.has('pfm_vault')).toBe(true);
  });

  it.each(['passphrase', 'code'])('adopts an unassigned legacy backup only after historical key proof using %s', async (method) => {
    const code = await createVault('saved passphrase');
    const record = exportVaultRecord();
    const ciphertext = await encryptJsonLegacy(getMasterKey(), { prayer: 'existing history' });
    storage.records.set('pfm_vault', JSON.parse(record));
    storage.records.delete('pfm_vault:account-a');
    configureAccountContext('account-b');
    const secret = method === 'code' ? code : 'saved passphrase';
    expect(await recoverUnassignedLegacyVault(secret, { method, verifyCandidate: async () => false })).toBe(false);
    expect(isUnlocked()).toBe(false);
    expect(storage.records.has('pfm_vault:account-b')).toBe(false);
    configureAccountContext('account-a');
    const verifyCandidate = async (candidate) => {
      try { return (await decryptJson(candidate, ciphertext)).prayer === 'existing history'; } catch { return false; }
    };
    expect(await recoverUnassignedLegacyVault(secret, { method, verifyCandidate })).toBe(true);
    expect(await decryptJson(getMasterKey(), ciphertext)).toEqual({ prayer: 'existing history' });
    expect(storage.records.get('pfm_vault')).toEqual(JSON.parse(record));
    expect(storage.records.get('pfm_vault:account-a')).toEqual(JSON.parse(record));
  });

  it('does not rotate an already loaded account key when creating recovery', async () => {
    await createVault('first recovery');
    const original = await exportRawMasterKey();
    const ciphertext = await encryptJsonLegacy(getMasterKey(), { prayer: 'history' });
    await createVault('replacement recovery');
    expect(await exportRawMasterKey()).toBe(original);
    expect(await decryptJson(getMasterKey(), ciphertext)).toEqual({ prayer: 'history' });
  });

  it('checks the saved emergency code without changing the key or wrapper', async () => {
    const code = await createVault('recovery passphrase');
    const key = getMasterKey();
    const record = exportVaultRecord();
    expect(await verifyRecoveryCode(code, record)).toBe(true);
    expect(await verifyRecoveryCode('00000-00000-00000-00000-00000-0', record)).toBe(false);
    expect(getMasterKey()).toBe(key);
    expect(exportVaultRecord()).toBe(record);
  });

  it('rejects a valid unrelated candidate before replacing the original key', async () => {
    await createVault('correct history');
    const key = getMasterKey();
    const ciphertext = await encryptJsonLegacy(key, { prayer: 'history' });
    const wrong = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const verifyCandidate = async (candidate) => {
      try { await decryptJson(candidate, ciphertext); return true; } catch { return false; }
    };
    expect(await installCandidateMasterKey(wrong, { verifyCandidate })).toBe(false);
    expect(getMasterKey()).toBe(key);
    expect(await decryptJson(key, ciphertext)).toEqual({ prayer: 'history' });
  });

  it.each(['lock', 'account change'])('invalidates a pending candidate verification on %s', async (action) => {
    const candidate = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    let resolveVerification;
    const pending = installCandidateMasterKey(candidate, {
      token: getLifecycleToken(),
      verifyCandidate: () => new Promise((resolve) => { resolveVerification = resolve; }),
    });
    if (action === 'lock') lock();
    else configureAccountContext('account-b');
    resolveVerification(true);
    expect(await pending).toBe(false);
    expect(isUnlocked()).toBe(false);
  });

  it('prevents an in-flight session export from resurrecting a raw key after lock', async () => {
    const candidate = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const originalExport = crypto.subtle.exportKey.bind(crypto.subtle);
    let finishExport;
    vi.spyOn(crypto.subtle, 'exportKey').mockImplementationOnce((...args) => new Promise((resolve, reject) => {
      finishExport = () => originalExport(...args).then(resolve, reject);
    }));
    expect(await installCandidateMasterKey(candidate)).toBe(true);
    lock();
    await finishExport();
    await Promise.resolve();
    expect(sessionStorage.getItem('pfm_vault_session:account-a')).toBeNull();
    expect(isUnlocked()).toBe(false);
  });

  it('prevents an in-flight passphrase unwrap from unlocking after lock', async () => {
    await createVault('correct passphrase');
    lock();
    const originalDerive = crypto.subtle.deriveKey.bind(crypto.subtle);
    let finishDerivation;
    vi.spyOn(crypto.subtle, 'deriveKey').mockImplementationOnce((...args) => new Promise((resolve, reject) => {
      finishDerivation = () => originalDerive(...args).then(resolve, reject);
    }));
    const pending = unlock('correct passphrase');
    await vi.waitFor(() => expect(finishDerivation).toBeTypeOf('function'));
    lock();
    await finishDerivation();
    expect(await pending).toBe(false);
    expect(isUnlocked()).toBe(false);
  });

  it('enforces durable protected policy independently of feature flags', async () => {
    await createVault('original passphrase');
    const raw = await exportRawMasterKey();
    expect(setDeviceProtectionPolicy('account-a', true)).toBe(true);
    expect(getDeviceProtectionPolicy()).toBe('protected');
    expect(sessionStorage.getItem('pfm_vault_session:account-a')).toBeNull();
    lock();
    expect(await importRawMasterKey(raw)).toBe(false);
    expect(await unlock('original passphrase')).toBe(true);
    await exportRawMasterKey();
    expect(sessionStorage.getItem('pfm_vault_session:account-a')).toBeNull();
  });

  it.each(['protection', 'explicit lock'])('drops running/session keys when another tab changes %s', async (kind) => {
    const candidate = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    await installCandidateMasterKey(candidate);
    await exportRawMasterKey();
    let key;
    if (kind === 'protection') {
      setDeviceProtectionPolicy('account-a', true);
      key = 'pfm_device_protected_account-a';
      expect(isUnlocked()).toBe(true); // activation tab keeps authorized memory
    } else {
      key = 'pfm_ak_locked_account-a';
      localStorage.setItem(key, 'another-tab-lock-token');
    }
    handleAccountSecurityStorageChange(key);
    expect(isUnlocked()).toBe(false);
    expect(sessionStorage.getItem('pfm_vault_session:account-a')).toBeNull();
  });

  it('does not report protected raw-key cleanup complete while an earlier raw write is pending', async () => {
    await createVault('preserved recovery');
    let finishWrite;
    storage.beforeSet = (key) => key === 'pfm_ak_account-a'
      ? new Promise((resolve) => { finishWrite = resolve; }) : undefined;
    const pending = rememberAccountKey('account-a');
    await vi.waitFor(() => expect(finishWrite).toBeTypeOf('function'));
    setDeviceProtectionPolicy('account-a', true);
    let completed = false;
    const cleanup = clearTransparentAccountKey('account-a').then((ok) => { completed = true; return ok; });
    await Promise.resolve();
    expect(completed).toBe(false);
    finishWrite();
    expect(await pending).toBe(false);
    expect(await cleanup).toBe(true);
    expect(storage.records.has('pfm_ak_account-a')).toBe(false);
  });

  it('preserves a rejected raw candidate and never replaces it with a newly generated key', async () => {
    const candidate = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const raw = Buffer.from(await crypto.subtle.exportKey('raw', candidate)).toString('base64');
    storage.records.set('pfm_ak_account-a', raw);
    expect(await ensureAccountCryptoReady('account-a', 'absent', { verifyCandidate: async () => false })).toBe(CRYPTO_STATUS.UNAVAILABLE);
    expect(isUnlocked()).toBe(false);
    expect(storage.records.get('pfm_ak_account-a')).toBe(raw);
  });

  it.each(['scoped', 'legacy'])('preserves corrupt %s recovery metadata and fails closed before key creation', async (scope) => {
    const slot = scope === 'scoped' ? 'pfm_vault:account-a' : 'pfm_vault';
    const corrupt = { v: 2, passSalt: 'incomplete' };
    storage.records.set(slot, corrupt);
    expect(await ensureAccountCryptoReady('account-a', 'absent')).toBe(CRYPTO_STATUS.UNAVAILABLE);
    expect(isUnlocked()).toBe(false);
    expect(storage.records.get(slot)).toEqual(corrupt);
    expect(storage.records.has('pfm_ak_account-a')).toBe(false);
  });
});
