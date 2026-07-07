import { create } from 'zustand';
import * as vault from '../lib/crypto/keyManager';
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

  // First-time setup. Returns the one-time recovery code to show the user.
  createVault: async (passphrase) => {
    const code = await vault.createVault(passphrase);
    set({ initialized: true, unlocked: true });
    pushVaultRecord(); // sync the wrapped key to other devices (fire-and-forget)
    track(EVENTS.VAULT_ENABLED); // content-free: only that the vault was enabled
    return code;
  },

  // Turn on recovery / cross-device access for the account key that was already
  // auto-provisioned (encryption works before this). Wraps the SAME key under a
  // passphrase + recovery code, so existing ciphertext stays readable. Returns
  // the one-time recovery code, or null if no key is loaded.
  setUpRecovery: async (passphrase) => {
    const code = await vault.setUpRecovery(passphrase);
    if (code) {
      set({ initialized: true, unlocked: true });
      pushVaultRecord(); // sync the wrapped record so other devices can unlock
      track(EVENTS.VAULT_ENABLED); // content-free: only that recovery was enabled
    }
    return code;
  },

  unlock: async (passphrase) => {
    const ok = await vault.unlock(passphrase);
    if (ok) set({ unlocked: true });
    return ok;
  },

  lock: () => {
    vault.lock();
    set({ unlocked: false });
  },

  resetPassphrase: async (recoveryCode, newPassphrase) => {
    const ok = await vault.resetPassphrase(recoveryCode, newPassphrase);
    if (ok) { set({ unlocked: true }); pushVaultRecord(); } // re-wrapped under new passphrase
    return ok;
  },

  changePassphrase: async (current, next) => {
    const ok = await vault.changePassphrase(current, next);
    if (ok) { set({ unlocked: true }); pushVaultRecord(); } // re-wrapped under new passphrase
    return ok;
  },

  // Rotate the recovery code (vault must be unlocked). Returns the new code to
  // show once, or null on failure. Syncs the re-wrapped record to other devices.
  rotateRecoveryCode: async () => {
    const code = await vault.rotateRecoveryCode();
    if (code) pushVaultRecord(); // recovery wrapping changed
    return code;
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
