import { create } from 'zustand';
import * as vault from '../lib/crypto/keyManager';
import { lockAccountKey, rememberAccountKey } from '../lib/crypto/accountKey';
import { pushVaultRecord } from '../lib/vaultSync';
import { track, EVENTS } from '../lib/analytics';

// Reactive wrapper around the keyManager singleton so React can render the
// vault's locked/unlocked state. The keyManager owns the crypto + the in-memory
// master key; this store only mirrors its booleans and forwards actions.
const useVaultStore = create((set) => ({
  initialized: vault.isVaultInitialized(),
  unlocked: vault.isUnlocked(),

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
    track(EVENTS.VAULT_ENABLED); // content-free: only that recovery was enabled
    return { code, synced };
  },

  unlock: async (passphrase, userId) => {
    const ok = await vault.unlock(passphrase);
    if (ok) {
      // Clear an explicit-lock marker and restore this account's convenient
      // device copy before reporting the action complete.
      if (userId) await rememberAccountKey(userId, { clearLock: true });
      set({ unlocked: true });
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
    const ok = await vault.resetPassphrase(recoveryCode, newPassphrase);
    if (ok) {
      if (userId) await rememberAccountKey(userId, { clearLock: true });
      set({ unlocked: true });
      await pushVaultRecord(); // finish persistence before the success UI closes
    }
    return ok;
  },

  changePassphrase: async (current, next, userId) => {
    const ok = await vault.changePassphrase(current, next);
    if (ok) {
      if (userId) await rememberAccountKey(userId);
      set({ unlocked: true });
      await pushVaultRecord(); // do not strand the new wrapper on tab close
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
    return { code, synced: await pushVaultRecord() };
  },

  // Destroys the vault record — encrypted data becomes unrecoverable. Callers
  // must confirm with the user first (see ConfirmDialog).
  destroy: async () => {
    await vault.destroyVault();
    set({ initialized: false, unlocked: false });
  },
}));

// Mirror auto-lock / external lock transitions back into the store.
vault.onLockChange((unlocked) => useVaultStore.setState({ unlocked }));

// Keep the vault open while the user is active; the idle timer in keyManager
// locks it after inactivity. resetAutoLock is a no-op while locked.
if (typeof window !== 'undefined') {
  const onActivity = () => vault.resetAutoLock();
  for (const evt of ['pointerdown', 'keydown', 'visibilitychange']) {
    window.addEventListener(evt, onActivity, { passive: true });
  }
}

export default useVaultStore;
