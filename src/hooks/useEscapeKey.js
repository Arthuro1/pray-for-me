import { useEffect } from 'react';

// Calls `onEscape` when the user presses Esc — so modals can be dismissed from
// the keyboard, not just by clicking the backdrop.
export function useEscapeKey(onEscape) {
  useEffect(() => {
    if (!onEscape) return undefined;
    const handler = (e) => { if (e.key === 'Escape') onEscape(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onEscape]);
}
