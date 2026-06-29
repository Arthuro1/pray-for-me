import { create } from 'zustand';
import * as vault from '../lib/crypto/keyManager';
import { pushVaultRecord } from '../lib/vaultSync';

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

  // Destroys the vault record — encrypted data becomes unrecoverable. Callers
  // must confirm with the user first (see ConfirmDialog).
  destroy: () => {
    vault.destroyVault();
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
