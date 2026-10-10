import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

// YouTube belongs only to this page. Removing its visible iframe stops the
// video without touching any prayer-session audio or remembered preferences.
export default function useLandingMusic() {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  const close = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    // Prayer callbacks can mount the guest flow immediately. Remove the player
    // before calling them, even when the parent keeps the landing page mounted.
    flushSync(() => setOpen(false));
  }, []);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden) close(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', close);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', close);
      // The component tree removes its iframe on unmount.
      openRef.current = false;
    };
  }, [close]);

  const toggle = () => {
    if (openRef.current) close();
    else {
      openRef.current = true;
      setOpen(true);
    }
  };

  const leave = (onContinue, ...args) => {
    close();
    onContinue?.(...args);
  };

  return { open, toggle, close, leave };
}
