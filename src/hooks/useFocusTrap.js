import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Keeps keyboard focus inside an open modal: focuses the first control on open,
// cycles Tab/Shift+Tab within the dialog, and restores focus to the previously
// focused element on close. Returns a ref to attach to the modal container.
// Pass `active` so it engages only while the modal is actually mounted/open.
// An optional selector lets immersive capture flows put the cursor directly in
// the writing field while ordinary dialogs keep focusing their first control.
export function useFocusTrap(active = true, initialFocusSelector = null) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!active || !node) return undefined;

    const previouslyFocused = document.activeElement;
    const focusables = () => Array.from(node.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    const preferred = initialFocusSelector ? node.querySelector(initialFocusSelector) : null;
    (preferred || focusables()[0] || node).focus();

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    };
  }, [active, initialFocusSelector]);

  return ref;
}
