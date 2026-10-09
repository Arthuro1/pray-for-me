import { create } from 'zustand';
import * as vault from '../lib/crypto/keyManager';
import { lockAccountKey, rememberAccountKey } from '../lib/crypto/accountKey';
import { pushVaultRecord } from '../lib/vaultSync';
import { track, EVENTS } from '../lib/analytics';
import { clearTranslationCache } from './translationStore';
import { clearAllAiResultCaches } from '../lib/aiResultCache';
import { resetAiRequestState } from '../lib/aiCore';

async function candidateOptions(userId, mandatory = false) {
  if (!userId || (!mandatory && globalThis.navigator?.onLine === false)) return {};
  const token = vault.getLifecycleToken();
  const { verifyHistoricalAccountKey } = await import('../lib/prayerProtection');
  return { token, verifyCandidate: async (key) => {
    try { return await verifyHistoricalAccountKey(userId, key, token); }
    catch (error) {
      // An existing account-scoped legacy wrapper is sufficient for a verified
      // empty account. Unassigned legacy records always require historical proof.
      return !mandatory && error?.message === 'no_history';
    }
  } };
}

// Reactive wrapper around the keyManager singleton so React can render the
// vault's locked/unlocked state. The keyManager owns the crypto + the in-memory
// master key; this store only mirrors its booleans and forwards actions.
const useVaultStore = create((set) => ({
  initialized: vault.isVaultInitialized(),
  unlocked: vault.isUnlocked(),
  recoverySync: 'unknown',
  syncRecovery: async () => {
    const synced = await pushVaultRecord();
    set({ recoverySync: synced ? 'synced' : 'pending' });
    return synced;
  },

  // Re-sync from the keyManager (e.g. after a destroy from elsewhere).
  refresh: () => set({ initialized: vault.isVaultInitialized(), unlocked: vault.isUnlocked() }),

  // First-time setup. Returns { code, synced }: the one-time recovery code to
  // show the user, and whether the wrapped record reached the server. `synced`
  // is awaited rather than fired and forgotten — a code that only exists on this
  // device unlocks nothing on the next one, and the user has to be told.
  createVault: async (passphrase) => {
    const code = await vault.createVault(passphrase);
    set({ initialized: true, unlocked: true });
    const synced = await pushVaultRecord(); // sync the wrapped key to other devices
    set({ recoverySync: synced ? 'synced' : 'pending' });
    track(EVENTS.VAULT_ENABLED); // content-free: only that the vault was enabled
    return { code, synced };
  },

  // Turn on recovery / cross-device access for the account key that was already
  // auto-provisioned (encryption works before this). Wraps the SAME key under a
  // passphrase + recovery code, so existing ciphertext stays readable. Returns
  // { code, synced } — code is null if no key is loaded.
  setUpRecovery: async (passphrase) => {
    const code = await vault.setUpRecovery(passphrase);
    if (!code) return { code: null, synced: false };
    set({ initialized: true, unlocked: true });
    const synced = await pushVaultRecord(); // so other devices can unlock
    set({ recoverySync: synced ? 'synced' : 'pending' });
    track(EVENTS.VAULT_ENABLED); // content-free: only that recovery was enabled
    return { code, synced };
  },

  unlock: async (passphrase, userId) => {
    const unassigned = userId && !vault.isVaultInitialized();
    const options = await candidateOptions(userId, !!unassigned);
    const ok = unassigned
      ? await vault.recoverUnassignedLegacyVault(passphrase, { ...options, method: 'passphrase' })
      : await vault.unlock(passphrase, options);
    if (ok) {
      // Clear an explicit-lock marker and restore this account's convenient
      // device copy before reporting the action complete.
      if (userId) await rememberAccountKey(userId, { clearLock: true });
      set({ initialized: vault.isVaultInitialized(), unlocked: true });
    }
    return ok;
  },

  lock: async (userId) => {
    // With a user id this is a durable, intentional lock: it also removes the
    // raw device copy so a refresh cannot silently reopen the vault.
    if (userId) await lockAccountKey(userId);
    else vault.lock();
    set({ unlocked: false });
    return true;
  },

  resetPassphrase: async (recoveryCode, newPassphrase, userId) => {
    const unassigned = userId && !vault.isVaultInitialized();
    const options = await candidateOptions(userId, !!unassigned);
    if (unassigned && !await vault.recoverUnassignedLegacyVault(recoveryCode, { ...options, method: 'code' })) return false;
    const ok = await vault.resetPassphrase(recoveryCode, newPassphrase, await candidateOptions(userId));
    if (ok) {
      if (userId) await rememberAccountKey(userId, { clearLock: true });
      set({ unlocked: true });
      const synced = await pushVaultRecord();
      set({ recoverySync: synced ? 'synced' : 'pending' });
    }
    return ok;
  },

  changePassphrase: async (current, next, userId) => {
    const ok = await vault.changePassphrase(current, next, await candidateOptions(userId));
    if (ok) {
      if (userId) await rememberAccountKey(userId);
      set({ unlocked: true });
      const synced = await pushVaultRecord();
      set({ recoverySync: synced ? 'synced' : 'pending' });
    }
    return ok;
  },

  // Rotate the recovery code (vault must be unlocked). Returns { code, synced };
  // code is null on failure. The re-wrapped record replaces the synced one, so
  // an unsynced rotation leaves other devices on the PREVIOUS code — same lie,
  // same reason to surface `synced`.
  rotateRecoveryCode: async () => {
    const code = await vault.rotateRecoveryCode();
    if (!code) return { code: null, synced: false };
    const synced = await pushVaultRecord();
    set({ recoverySync: synced ? 'synced' : 'pending' });
    return { code, synced };
  },

  // Destroys the vault record — encrypted data becomes unrecoverable. Callers
  // must confirm with the user first (see ConfirmDialog).
  destroy: async () => {
    await vault.destroyVault();
    set({ initialized: false, unlocked: false });
  },
}));

// Mirror auto-lock / external lock transitions back into the store.
vault.onLockChange((unlocked) => {
  if (!unlocked) {
    // Includes automatic/external locks, not just the store's lock action.
    // Abort queued translations before any captured plaintext can be sent.
    clearTranslationCache();
    clearAllAiResultCaches();
    resetAiRequestState();
  }
  useVaultStore.setState({ unlocked });
});

// Keep the vault open while the user is active; the idle timer in keyManager
// locks it after inactivity. resetAutoLock is a no-op while locked.
if (typeof window !== 'undefined') {
  const onActivity = () => vault.resetAutoLock();
  for (const evt of ['pointerdown', 'keydown', 'focus']) {
    window.addEventListener(evt, onActivity, { passive: true });
  }
  // Hiding a tab is not activity. On return, keyManager checks the previous
  // wall-clock deadline before a focus/visibility event may extend it.
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onActivity();
    }, { passive: true });
  }
}

export default useVaultStore;
