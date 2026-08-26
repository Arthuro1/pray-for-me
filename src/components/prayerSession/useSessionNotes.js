// Per-prayer state for prayer-session notes, and the two operations that give
// the session's navigation its meaning:
//
//   Next     → completeCurrentPrayer: commit what was captured, then advance.
//   Previous → preserveCurrentPrayerDraft: keep it safe, commit nothing.
//
// Drafts are keyed by prayer id, never by index, so changing prayer can't make
// one person's note appear under another's. Everything the user writes or
// records is persisted encrypted on-device BEFORE the session moves, and the
// permanent update is created only by Next.
import { useCallback, useEffect, useRef, useState } from 'react';
import { saveNoteDraft, loadNoteDraft, clearNoteDraft } from '../../lib/prayerNoteDrafts';
import { promoteNoteDraft, noteIsEmpty } from '../../lib/prayerNotes';
import usePrayerStore from '../../store/prayerStore';
import { plainText } from '../rich/plainText';
import { EVENTS, track } from '../../lib/analytics';

// How long after the last keystroke the draft is written to encrypted storage.
// Short enough that an app suspension loses nothing meaningful, long enough not
// to encrypt on every character.
const PERSIST_DELAY_MS = 700;

const BLANK = { text: '', voice: null, savedUpdateId: null, status: 'draft', committedText: '', restored: false };

//   draft   nothing committed yet — Next will create the update
//   saving  the promotion is in flight
//   saved   the update exists (or is queued through the offline mutation queue)
//   pending the promotion could not finish (a recording made offline); the
//           encrypted draft stands and is retried on reconnect
export const NOTE_STATUS = { DRAFT: 'draft', SAVING: 'saving', SAVED: 'saved', PENDING: 'pending' };

export function useSessionNotes(enabled) {
  const [drafts, setDrafts] = useState({});
  // A mirror of the same map, so an operation triggered from a click reads the
  // latest draft rather than the value captured by its render.
  const draftsRef = useRef({});
  const timerRef = useRef(null);
  const dirtyRef = useRef(null); // prayerId whose text hasn't been written yet
  const recorderRef = useRef(null);
  const captureRef = useRef(null); // an in-flight recording capture, if any
  const hydratedRef = useRef(new Set());

  const write = useCallback((prayerId, patch) => {
    const next = { ...(draftsRef.current[prayerId] || BLANK), ...patch };
    draftsRef.current = { ...draftsRef.current, [prayerId]: next };
    setDrafts(draftsRef.current);
    return next;
  }, []);

  const draftFor = useCallback((prayerId) => draftsRef.current[prayerId] || BLANK, []);

  // ── Encrypted local persistence ────────────────────────────────────────────
  const persistNow = useCallback(async (prayerId) => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
    if (dirtyRef.current === prayerId) dirtyRef.current = null;
    const entry = draftsRef.current[prayerId];
    if (!entry) return;
    // Nothing worth a stored record: drop any earlier one rather than leaving an
    // empty encrypted husk behind.
    if (noteIsEmpty(entry) && !entry.savedUpdateId) {
      await clearNoteDraft(prayerId);
      return;
    }
    await saveNoteDraft({ prayerId, text: entry.text });
  }, []);

  const schedulePersist = useCallback((prayerId) => {
    dirtyRef.current = prayerId;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { persistNow(prayerId).catch(() => {}); }, PERSIST_DELAY_MS);
  }, [persistNow]);

  // A suspending app (backgrounded tab, PWA swipe-away) gets no unmount, so
  // flush the pending draft on the last event we reliably see.
  useEffect(() => {
    if (!enabled) return undefined;
    const flush = () => { if (dirtyRef.current) persistNow(dirtyRef.current).catch(() => {}); };
    const onHide = () => { if (document.hidden) flush(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      flush();
      clearTimeout(timerRef.current);
    };
  }, [enabled, persistNow]);

  // ── Draft recovery ─────────────────────────────────────────────────────────
  // Restore an unfinished note when the session reopens on the same prayer.
  const hydrate = useCallback(async (prayerId) => {
    if (!enabled || !prayerId || hydratedRef.current.has(prayerId)) return;
    hydratedRef.current.add(prayerId);
    const stored = await loadNoteDraft(prayerId);
    if (!stored || draftsRef.current[prayerId]) return;
    if (noteIsEmpty(stored)) { await clearNoteDraft(prayerId); return; }
    write(prayerId, {
      text: stored.text || '',
      voice: stored.voice,
      savedUpdateId: stored.savedUpdateId,
      status: stored.status === 'committing' ? NOTE_STATUS.PENDING : NOTE_STATUS.DRAFT,
      restored: true,
    });
  }, [enabled, write]);

  // ── Editing ────────────────────────────────────────────────────────────────
  const setText = useCallback((prayerId, text) => {
    const before = draftsRef.current[prayerId];
    write(prayerId, { text });
    if (!before || !plainText(before.text)) {
      if (plainText(text)) track(EVENTS.PRAYER_NOTE_STARTED);
    }
    schedulePersist(prayerId);
  }, [schedulePersist, write]);

  // The recording is durably persisted the moment it stops — a completed
  // recording must never live only in React state. Encrypting it takes a beat,
  // so the in-flight capture is tracked: tapping Next in that window has to WAIT
  // for it, not walk past a draft that doesn't hold the audio yet.
  const setVoice = useCallback(async (prayerId, voice) => {
    const capture = (async () => {
      await saveNoteDraft({ prayerId, text: draftFor(prayerId).text, voice });
      write(prayerId, { voice });
      track(EVENTS.PRAYER_NOTE_VOICE_USED);
    })();
    captureRef.current = capture;
    try {
      await capture;
    } finally {
      if (captureRef.current === capture) captureRef.current = null;
    }
  }, [draftFor, write]);

  const deleteVoice = useCallback(async (prayerId) => {
    write(prayerId, { voice: null });
    const entry = draftsRef.current[prayerId];
    if (noteIsEmpty(entry) && !entry.savedUpdateId) await clearNoteDraft(prayerId);
    else await saveNoteDraft({ prayerId, text: entry.text, voice: null });
  }, [write]);

  const discard = useCallback(async (prayerId) => {
    write(prayerId, { ...BLANK });
    await clearNoteDraft(prayerId);
  }, [write]);

  // Is there anything to finish for this prayer? A user who never takes notes
  // must pay nothing at all for the feature — not even an awaited tick — so the
  // session only enters the asynchronous leave-this-prayer path when this is
  // true.
  const hasWork = useCallback((prayerId) => {
    if (recorderRef.current?.isRecording?.() || captureRef.current) return true;
    const entry = draftsRef.current[prayerId];
    return !!entry && (!noteIsEmpty(entry) || !!entry.savedUpdateId);
  }, []);

  // Stop an in-flight recording and wait until it has been safely captured —
  // including one the user stopped a moment ago that is still being encrypted.
  const finalizeRecording = useCallback(async () => {
    const wasRecording = !!recorderRef.current?.isRecording?.();
    if (wasRecording) await recorderRef.current.finalize();
    if (captureRef.current) await captureRef.current;
    return wasRecording;
  }, []);

  // ── Previous: preserve, commit nothing ─────────────────────────────────────
  const preserveCurrentPrayerDraft = useCallback(async (prayerId) => {
    if (!enabled || !prayerId) return { ok: true };
    try {
      await finalizeRecording();
      await persistNow(prayerId);
      return { ok: true };
    } catch {
      return { ok: false, reason: 'persist' };
    }
  }, [enabled, finalizeRecording, persistNow]);

  // ── Next: commit, then the caller advances ─────────────────────────────────
  // Resolves only once the note is SAFELY held (encrypted on-device and handed
  // to the durable pipeline). The server round-trip happens afterwards, so the
  // session never waits on the network.
  const completeCurrentPrayer = useCallback(async (prayerId) => {
    if (!enabled || !prayerId) return { ok: true };
    try {
      await finalizeRecording();
      await persistNow(prayerId);
    } catch {
      return { ok: false, reason: 'persist' };
    }

    const entry = draftsRef.current[prayerId];
    if (!entry) return { ok: true };

    // Nothing captured — a prayer without a note is exactly as it was before.
    if (noteIsEmpty(entry)) {
      if (entry.savedUpdateId && entry.status === NOTE_STATUS.SAVED && plainText(entry.committedText)) {
        // The user emptied a note they had already saved this session: reuse the
        // ordinary "remove an update's text" behaviour (which deletes the whole
        // row when no attachment is left).
        await usePrayerStore.getState().removeUpdateText(prayerId, entry.savedUpdateId);
        write(prayerId, { ...BLANK });
      }
      await clearNoteDraft(prayerId);
      return { ok: true };
    }

    // Already saved this session and revisited: edit that same update rather
    // than creating a second one.
    if (entry.savedUpdateId && entry.status === NOTE_STATUS.SAVED) {
      if (entry.text.trim() !== (entry.committedText || '').trim()) {
        await usePrayerStore.getState().editUpdate(prayerId, entry.savedUpdateId, entry.text);
        write(prayerId, { committedText: entry.text });
      }
      return { ok: true };
    }

    // First commit (or a retry of one that couldn't finish). The id is minted and
    // persisted before the write so a retry upserts the same row.
    const updateId = entry.savedUpdateId || crypto.randomUUID();
    try {
      await saveNoteDraft({ prayerId, text: entry.text, savedUpdateId: updateId, status: 'committing' });
    } catch {
      return { ok: false, reason: 'persist' };
    }
    write(prayerId, { savedUpdateId: updateId, status: NOTE_STATUS.SAVING, committedText: entry.text });

    // Safely held — hand the promotion to the background and let the session go.
    promoteNoteDraft(prayerId)
      .then((result) => {
        write(prayerId, { status: result.ok ? NOTE_STATUS.SAVED : NOTE_STATUS.PENDING });
        if (result.ok && result.promoted) track(EVENTS.PRAYER_NOTE_SAVED);
      })
      .catch(() => write(prayerId, { status: NOTE_STATUS.PENDING }));

    return { ok: true };
  }, [enabled, finalizeRecording, persistNow, write]);

  const savedCount = Object.values(drafts).filter(
    (d) => d.status === NOTE_STATUS.SAVING || d.status === NOTE_STATUS.SAVED || d.status === NOTE_STATUS.PENDING,
  ).length;

  return {
    drafts,
    draftFor,
    hydrate,
    setText,
    setVoice,
    deleteVoice,
    discard,
    recorderRef,
    hasWork,
    completeCurrentPrayer,
    preserveCurrentPrayerDraft,
    savedCount,
  };
}
