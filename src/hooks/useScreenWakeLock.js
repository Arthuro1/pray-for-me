import { useEffect } from 'react';

// Keeps the screen awake while `active`, so a long, still time of prayer is not
// cut short by the phone going dark. Failure-soft: where the Wake Lock API is
// missing or refused (battery saver, a hidden page), the screen may simply
// sleep. The browser drops the lock whenever the page is hidden, so it is taken
// again when the page comes back.
export function useScreenWakeLock(active) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !navigator.wakeLock?.request) return undefined;
    let lock = null;
    let done = false;

    const acquire = async () => {
      if (lock && !lock.released) return;
      try {
        const next = await navigator.wakeLock.request('screen');
        if (done) next.release().catch(() => {});
        else lock = next;
      } catch {
        // Refused: nothing to undo.
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      done = true;
      document.removeEventListener('visibilitychange', onVisibility);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
