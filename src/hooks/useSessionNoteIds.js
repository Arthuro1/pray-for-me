import { useEffect, useState } from 'react';
import { loadSessionNoteIds, subscribeSessionNotes } from '../lib/prayerNotes';

// Which of this prayer's updates were captured during a prayer session, so the
// timeline can label them "Prayer note · During prayer". The marker is
// device-local and content-free (see prayerNotes.js): a device that never saw
// the note simply renders the ordinary update it already is.
export function useSessionNoteIds() {
  const [ids, setIds] = useState(new Set());
  useEffect(() => {
    let live = true;
    loadSessionNoteIds().then((loaded) => { if (live) setIds(new Set(loaded)); });
    const unsubscribe = subscribeSessionNotes((next) => setIds(new Set(next)));
    return () => { live = false; unsubscribe(); };
  }, []);
  return ids;
}
