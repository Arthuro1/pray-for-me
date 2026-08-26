// Secure, device-local storage for prayer-session note DRAFTS — the text and the
// voice a user captures while praying, before it is promoted into that prayer's
// normal update history (see prayerNotes.js).
//
// A prayer note is personal content, so a draft never touches plaintext storage.
// This module upholds the same guarantees as guestPrayerDraft.js:
//   • The note text lives ONLY inside AES-GCM ciphertext; the recording lives
//     ONLY as encrypted bytes. Neither is ever written to localStorage.
//   • The key is a NON-EXTRACTABLE CryptoKey persisted per draft in IndexedDB
//     (structured clone): it decrypts on this device, but its raw bytes can't be
//     read back out, even by page JS.
//   • Plaintext metadata is limited to ids, timestamps and commit status —
//     never anything that could reveal what was written or recorded.
//   • CryptoKey persistence is feature-detected. Where it isn't available we
//     fall back to memory-only and fail safely (the draft simply won't survive a
//     reload) — we never downgrade to plaintext-at-rest.
//   • A draft has a version and a maximum lifetime; an expired, malformed or
//     unreadable draft is deleted on the next read.
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval';
import { encryptJson, decryptJson, encryptionAdditionalData } from './crypto/e2ee';

const DRAFT_VERSION = 1;
// Long enough to survive an interrupted session, a reboot, or a weekend away;
// short enough that a forgotten recording doesn't sit on the device forever.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const KEY_PREFIX = 'pfm_note_draft:';
const IV_BYTES = 12;

// Hard cap on one session recording. Well inside the attachment pipeline's
// 20 MB audio ceiling, and it keeps a forgotten open mic bounded.
export const MAX_VOICE_SECONDS = 300;

const hasIDB = () => typeof indexedDB !== 'undefined';
const slot = (prayerId) => `${KEY_PREFIX}${prayerId}`;

// Memory-only fallback when CryptoKey persistence is unavailable (or IDB fails).
// prayerId → { record, key }, the same shape persisted to IndexedDB otherwise.
const memory = new Map();

const draftContext = (prayerId, field) => ({
  entityType: 'prayer-note-draft',
  ownerOrGroupId: 'device',
  recordId: prayerId,
  keyVersion: 1,
  field,
});

async function freshKey() {
  // Non-extractable: usable for encrypt/decrypt on this device, but its raw
  // bytes can never be exported.
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

// Raw-bytes AES-GCM for the recording — JSON-encoding audio would inflate it by
// a third for nothing, and IndexedDB stores an ArrayBuffer natively.
async function encryptBytes(key, buffer, context) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encryptionAdditionalData(context) },
    key,
    buffer,
  );
  return { iv, ct };
}

async function decryptBytes(key, audio, context) {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: audio.iv, additionalData: encryptionAdditionalData(context) },
    key,
    audio.ct,
  );
  return new Blob([plain], { type: audio.mime || 'application/octet-stream' });
}

// The stored record + its key, from memory or IndexedDB. Never throws.
async function readRecord(prayerId) {
  if (memory.has(prayerId)) return memory.get(prayerId);
  if (!hasIDB()) return null;
  try {
    const stored = await idbGet(slot(prayerId));
    if (!stored?.key) return null;
    const { key, ...record } = stored;
    return { record, key };
  } catch {
    return null;
  }
}

async function writeRecord(prayerId, record, key) {
  if (hasIDB()) {
    try {
      // Structured clone persists the NON-EXTRACTABLE CryptoKey alongside the
      // ciphertext. A DataCloneError (environments that can't clone a CryptoKey)
      // throws here → we fall back to memory-only below.
      await idbSet(slot(prayerId), { ...record, key });
      memory.delete(prayerId); // persisted — subsequent reads go through IndexedDB
      return;
    } catch {
      try { await idbDel(slot(prayerId)); } catch { /* best-effort cleanup */ }
    }
  }
  memory.set(prayerId, { record, key });
}

// Decrypt just the text of an already-read record (used when a save keeps it).
async function readText(key, record, prayerId) {
  if (!record?.payload) return '';
  try {
    const data = await decryptJson(key, record.payload, draftContext(prayerId, 'note-text'));
    return typeof data?.text === 'string' ? data.text : '';
  } catch {
    return '';
  }
}

// Persist (encrypt) one prayer's note draft. Fields left `undefined` keep their
// stored value, so saving text never re-encrypts an unchanged recording:
//   voice: { blob, mime, seconds } → replace | null → drop | undefined → keep
// Throws if the content could not be safely persisted — a caller must never
// treat a rejection as saved (the composer offers Try again / discard instead).
export async function saveNoteDraft({ prayerId, text, voice, savedUpdateId, status }) {
  if (!prayerId) throw new Error('prayerId required');
  const existing = await readRecord(prayerId);
  const key = existing?.key || (await freshKey());
  const prev = existing?.record;
  const now = Date.now();

  const nextText = text === undefined ? await readText(key, prev, prayerId) : text || '';
  const payload = await encryptJson(key, { text: nextText }, draftContext(prayerId, 'note-text'));

  let audio = prev?.audio ?? null;
  if (voice === null) audio = null;
  else if (voice?.blob) {
    const { iv, ct } = await encryptBytes(key, await voice.blob.arrayBuffer(), draftContext(prayerId, 'note-voice'));
    audio = { iv, ct, mime: voice.mime || voice.blob.type || '', seconds: voice.seconds || 0, size: voice.blob.size };
  }

  const record = {
    v: DRAFT_VERSION,
    prayerId,
    createdAt: prev?.createdAt || now,
    updatedAt: now,
    payload,
    audio,
    savedUpdateId: savedUpdateId === undefined ? (prev?.savedUpdateId ?? null) : savedUpdateId,
    status: status === undefined ? (prev?.status || 'draft') : status,
  };
  await writeRecord(prayerId, record, key);
  return true;
}

// Decrypt and return one prayer's draft, or null. Expired / malformed /
// undecryptable drafts are deleted as a side effect (fail closed).
export async function loadNoteDraft(prayerId) {
  const entry = await readRecord(prayerId);
  if (!entry) return null;
  const { record, key } = entry;
  if (record.v !== DRAFT_VERSION || !Number.isFinite(record.updatedAt) || Date.now() - record.updatedAt > MAX_AGE_MS) {
    await clearNoteDraft(prayerId);
    return null;
  }
  let text = '';
  try {
    const data = await decryptJson(key, record.payload, draftContext(prayerId, 'note-text'));
    text = typeof data?.text === 'string' ? data.text : '';
  } catch {
    await clearNoteDraft(prayerId); // corrupt / wrong key — delete rather than trust
    return null;
  }
  let voice = null;
  if (record.audio) {
    try {
      const blob = await decryptBytes(key, record.audio, draftContext(prayerId, 'note-voice'));
      voice = { blob, mime: record.audio.mime, seconds: record.audio.seconds, size: record.audio.size };
    } catch {
      voice = null; // unreadable audio — the written half of the note still stands
    }
  }
  return {
    prayerId,
    text,
    voice,
    savedUpdateId: record.savedUpdateId ?? null,
    status: record.status || 'draft',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

// Plaintext metadata only (no decryption) — enough to decide whether a draft
// still needs promoting, without touching its content.
export async function peekNoteDraft(prayerId) {
  const entry = await readRecord(prayerId);
  if (!entry) return null;
  const { record } = entry;
  return {
    prayerId,
    status: record.status || 'draft',
    savedUpdateId: record.savedUpdateId ?? null,
    updatedAt: record.updatedAt,
    hasVoice: !!record.audio,
  };
}

export async function clearNoteDraft(prayerId) {
  memory.delete(prayerId);
  if (hasIDB()) { try { await idbDel(slot(prayerId)); } catch { /* best-effort */ } }
}

// Every prayer id that currently holds a draft on this device.
export async function listNoteDraftIds() {
  const ids = new Set(memory.keys());
  if (hasIDB()) {
    try {
      for (const k of await idbKeys()) {
        if (typeof k === 'string' && k.startsWith(KEY_PREFIX)) ids.add(k.slice(KEY_PREFIX.length));
      }
    } catch { /* unreadable — the memory ids stand */ }
  }
  return [...ids];
}

// Test-only: drop the in-memory cache to simulate a fresh page load, leaving any
// persisted IndexedDB records untouched.
export function __resetMemoryForTests() {
  memory.clear();
}
