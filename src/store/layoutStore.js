import { useEffect } from 'react';
import { create } from 'zustand';

// Layout-level UI signals that pages declare deliberately (no DOM inspection).
// A page showing its own prominent "Add a prayer" call-to-action suppresses the
// floating Add button, so Grace only ever sees ONE prominent Add per viewport.
const useLayoutStore = create((set) => ({
  fabSuppressed: false,
  setFabSuppressed: (fabSuppressed) => set({ fabSuppressed }),
}));

// Declarative per-page control: the FAB is hidden while `suppressed` is true
// and always released on unmount, so other pages keep their floating button.
export function useSuppressFab(suppressed) {
  const setFabSuppressed = useLayoutStore((s) => s.setFabSuppressed);
  useEffect(() => {
    setFabSuppressed(!!suppressed);
    return () => setFabSuppressed(false);
  }, [suppressed, setFabSuppressed]);
}

export default useLayoutStore;
