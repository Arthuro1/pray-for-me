import { useCallback, useEffect, useRef, useState } from 'react';
import { clearFormDraft, loadFormDraft, saveFormDraft } from '../lib/prayerFormDrafts';

// Debounce: long enough that ordinary typing doesn't encrypt on every keystroke,
// short enough that a mis-tapped backdrop a second later still finds the draft.
const SAVE_DELAY_MS = 600;

// Binds one form's value to the encrypted device-local draft slot
// (lib/prayerFormDrafts.js):
//
//   • On mount, an existing (non-expired) draft is handed to `restore`, which
//     puts it back into the form. This happens silently — reopening a form you
//     never finished should simply look like the form you left — and `restored`
//     lets the host show one quiet line saying so, with a way to start fresh.
//   • While the value changes, it is debounce-persisted. `serialize` decides
//     what is worth keeping; returning null means "this is empty, drop it".
//   • `commit()` is called once the prayer really exists: the slot is cleared
//     and this form stops persisting for good, so a keystroke's debounce still
//     in flight cannot resurrect the draft a moment after it was saved.
//   • `discard()` clears the slot but keeps protecting the form — the user is
//     starting over in it, not finishing with it.
//
// `enabled: false` (editing an existing prayer, or a community request) makes
// the hook completely inert: nothing is read, nothing is written, and no other
// flow's draft can leak into this form.
export function useFormDraft({ slot, enabled = true, value, serialize, restore }) {
  const [restored, setRestored] = useState(false);
  // Persisting only starts once the restore has run, so restoring can't echo
  // straight back out as a save — and so a save can never race ahead of the
  // read and clobber the very draft we are about to put on screen.
  const [ready, setReady] = useState(false);
  // Held in refs so redefining these callbacks between renders never re-runs
  // the one-shot restore (which would overwrite whatever was typed since).
  const restoreRef = useRef(restore);
  const serializeRef = useRef(serialize);
  restoreRef.current = restore;
  serializeRef.current = serialize;
  // Set by commit(): this form's work is done and nothing more may be written.
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !slot) return undefined;
    let cancelled = false;
    (async () => {
      const draft = await loadFormDraft(slot);
      if (cancelled) return;
      if (draft && restoreRef.current?.(draft)) setRestored(true);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [enabled, slot]);

  useEffect(() => {
    if (!enabled || !slot || !ready || finishedRef.current) return undefined;
    const fields = serializeRef.current?.(value);
    const timer = setTimeout(() => {
      // Saving happens AFTER the delay, by which time the prayer may already
      // have been created — writing then would leave an unfinished copy of a
      // prayer that is finished.
      if (finishedRef.current) return;
      // An emptied form is not a draft worth keeping — and clearing beats
      // storing a blank record that would later "restore" nothing.
      if (fields) saveFormDraft(slot, fields);
      else clearFormDraft(slot);
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled, slot, ready, value]);

  const forget = useCallback(() => {
    setRestored(false);
    if (slot) clearFormDraft(slot);
  }, [slot]);

  const commit = useCallback(() => {
    finishedRef.current = true;
    forget();
  }, [forget]);

  return { restored, commit, discard: forget };
}
