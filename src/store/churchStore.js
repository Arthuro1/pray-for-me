import { create } from 'zustand';
import { EMPTY_ANCHOR, fetchChurchAnchor, normalizeAnchor, saveChurchAnchor } from '../lib/churchAnchor';

// The decrypted church anchor, in memory only (see lib/churchAnchor.js). It is
// loaded once the vault is unlocked and cleared on sign-out or lock.
const useChurchStore = create((set, get) => ({
  userId: null,
  anchor: { ...EMPTY_ANCHOR },
  loaded: false,

  load: async (userId) => {
    if (!userId) return;
    set({ userId });
    const anchor = await fetchChurchAnchor(userId);
    if (get().userId !== userId || !anchor) return;
    set({ anchor, loaded: true });
  },

  // Optimistic: the names show at once; the encrypted write follows.
  save: async (userId, next) => {
    const anchor = normalizeAnchor(next);
    const previous = get().anchor;
    set({ anchor });
    const ok = await saveChurchAnchor(userId, anchor);
    if (!ok && get().userId === userId) set({ anchor: previous });
    return ok;
  },

  reset: () => set({ userId: null, anchor: { ...EMPTY_ANCHOR }, loaded: false }),
}));

export default useChurchStore;
