// Promotion pipeline for prayer-session notes: takes a draft captured while
// praying (prayerNoteDrafts.js) and turns it into an ORDINARY entry in that
// prayer's update history, through the store's existing addUpdate path — the
// same encryption, the same offline mutation queue, the same rendering and the
// same edit/delete semantics as any other update. There is no separate notes
// table and no parallel sync path.
//
// Order matters and is the whole point: the draft is already durably persisted
// (encrypted, on-device) BEFORE the session advances, so a suspension, a crash
// or a network transition mid-promotion can never lose what someone captured.
// A promotion that can't finish (a voice note recorded offline — the attachment
// pipeline needs the network) leaves the draft in place and is retried on the
// next reconnect; the draft is deleted only once the update genuinely exists.
import { get as idbGet, set as idbSet } from 'idb-keyval';
import usePrayerStore from '../store/prayerStore';
import { uploadAttachment } from './attachments';
import { plainText } from '../components/rich/plainText';
import { loadNoteDraft, saveNoteDraft, clearNoteDraft, listNoteDraftIds, peekNoteDraft } from './prayerNoteDrafts';

// Which updates came from a prayer session, so the timeline can label them
// "Prayer note · During prayer". Deliberately CLIENT-SIDE and content-free: it
// holds update ids and nothing else, which keeps the label a presentation
// detail instead of a schema migration (and another prod SQL step). A device
// that has never seen the note simply renders it as the ordinary update it is.
const SESSION_NOTE_KEY = 'pfm_session_note_ids';
const MAX_REMEMBERED = 500;

let sessionNoteIds = new Set();
let loadedIds = false;
let initialised = false;
const idListeners = new Set();

const hasIDB = () => typeof indexedDB !== 'undefined';

// Generic, content-free filename — an attachment name must never echo a prayer
// title, a person, or anything the user wrote.
const voiceFileName = (mime) => `prayer-note.${String(mime || '').includes('mp4') ? 'm4a' : 'webm'}`;

// Formatted text that normalises to nothing (empty list bullets, stray markers,
// whitespace) counts as empty — it must not create an update.
export function noteIsEmpty(draft) {
  return !plainText(draft?.text || '') && !draft?.voice?.blob;
}

export async function loadSessionNoteIds() {
  if (loadedIds) return sessionNoteIds;
  loadedIds = true;
  if (hasIDB()) {
    try {
      const stored = await idbGet(SESSION_NOTE_KEY);
      if (Array.isArray(stored)) sessionNoteIds = new Set(stored.filter((id) => typeof id === 'string'));
    } catch { /* unreadable — labels simply don't show */ }
  }
  idListeners.forEach((fn) => fn(sessionNoteIds));
  return sessionNoteIds;
}

export function isSessionNote(updateId) {
  return sessionNoteIds.has(updateId);
}

// Notified whenever the remembered set changes, so an open timeline picks up a
// note the user just captured without a reload.
export function subscribeSessionNotes(fn) {
  idListeners.add(fn);
  return () => idListeners.delete(fn);
}

async function rememberSessionNote(updateId) {
  await loadSessionNoteIds();
  if (sessionNoteIds.has(updateId)) return;
  sessionNoteIds = new Set([...sessionNoteIds, updateId]);
  // Keep the newest ids only — an unbounded list would grow forever for a
  // marker that is a nicety, not data.
  if (sessionNoteIds.size > MAX_REMEMBERED) {
    sessionNoteIds = new Set([...sessionNoteIds].slice(-MAX_REMEMBERED));
  }
  idListeners.forEach((fn) => fn(sessionNoteIds));
  if (hasIDB()) { try { await idbSet(SESSION_NOTE_KEY, [...sessionNoteIds]); } catch { /* best-effort */ } }
}

// Promote one persisted draft into the prayer's update history.
//   { ok: true, promoted, updateId }  — the update exists (or was queued) and
//                                       the draft has been cleared
//   { ok: false, error }              — nothing was lost: the draft stands and
//                                       will be retried on the next reconnect
export async function promoteNoteDraft(prayerId) {
  const store = usePrayerStore.getState();
  const draft = await loadNoteDraft(prayerId);
  if (!draft) return { ok: true, promoted: false };

  if (noteIsEmpty(draft)) {
    await clearNoteDraft(prayerId);
    return { ok: true, promoted: false };
  }

  // The id is minted (and persisted) BEFORE the write, so a retry after a failed
  // upload upserts the same row instead of creating a second note.
  const updateId = draft.savedUpdateId || crypto.randomUUID();
  if (draft.savedUpdateId !== updateId || draft.status !== 'committing') {
    await saveNoteDraft({ prayerId, savedUpdateId: updateId, status: 'committing' });
  }

  let attachments = [];
  if (draft.voice?.blob) {
    const file = new File([draft.voice.blob], voiceFileName(draft.voice.mime), { type: draft.voice.mime });
    const { attachment, error } = await uploadAttachment(file, store.userId);
    if (error) return { ok: false, error, updateId }; // offline / failed — draft kept
    attachments = [attachment];
  }

  await store.addUpdate(prayerId, draft.text || '', '', attachments, { id: updateId });
  await rememberSessionNote(updateId);
  await clearNoteDraft(prayerId);
  return { ok: true, promoted: true, updateId };
}

// Retry every draft whose promotion was already started but couldn't finish
// (voice recorded offline). Drafts still being written — status 'draft' — are
// left alone: the user hasn't finished with that prayer yet.
export async function flushPendingNoteDrafts() {
  const ids = await listNoteDraftIds();
  for (const prayerId of ids) {
    const meta = await peekNoteDraft(prayerId);
    if (meta?.status !== 'committing') continue;
    const result = await promoteNoteDraft(prayerId);
    if (!result.ok) break; // still offline / failing — try again on the next trigger
  }
}

// Wire the retry to the same triggers the mutation queue uses, so a note held
// back by an offline recording lands as soon as the connection returns.
export function initPrayerNotes() {
  if (initialised) return;
  initialised = true;
  loadSessionNoteIds();
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { flushPendingNoteDrafts(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) flushPendingNoteDrafts(); });
  }
  flushPendingNoteDrafts();
}

// Test-only: forget the in-memory marker set and the init latch.
export function __resetForTests() {
  sessionNoteIds = new Set();
  loadedIds = false;
  initialised = false;
  idListeners.clear();
}
