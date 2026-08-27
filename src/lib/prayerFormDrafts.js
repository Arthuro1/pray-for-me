// Secure, device-local storage for an UNFINISHED prayer — what someone has typed
// into the Add-prayer form (or the first-prayer capture screen) but not yet
// saved. A half-written prayer is often the most personal thing in the app, and
// losing it to a stray backdrop tap, a swipe-away, or a reload is a real harm.
//
// This module upholds exactly the guarantees guestPrayerDraft.js and
// prayerNoteDrafts.js do:
//   • The prayer's words (subject, note, the person it is for) live ONLY inside
//     AES-GCM ciphertext. Nothing is ever written to localStorage, and nothing
//     is ever sent to the server — an unfinished prayer is not a prayer yet.
//   • The key is a NON-EXTRACTABLE CryptoKey persisted per slot in IndexedDB
//     (structured clone): it decrypts on this device, but its raw bytes cannot
//     be read back out, even by page JS.
//   • Plaintext metadata is limited to the slot name, timestamps and a random
//     writer id — never anything that hints at what was written.
//   • CryptoKey persistence is feature-detected. Where it is unavailable we fall
//     back to memory-only and fail safely (the draft simply won't survive a
//     reload) — we never downgrade to plaintext-at-rest.
//   • A draft has a version and a maximum lifetime; anything expired, malformed
//     or undecryptable is deleted on the next read rather than surfaced.
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval';
import { encryptJson, decryptJson } from './crypto/e2ee';

const DRAFT_VERSION = 1;
// Long enough to survive an interrupted evening, a reboot or a night's sleep;
// short enough that an abandoned draft doesn't linger on the device. (The guest
// draft's window is 24h because it is one prayer awaiting a decision; a form
// draft is resumed work, so it gets the longer end of the 24–72h range.)
const MAX_AGE_MS = 48 * 60 * 60 * 1000;
const KEY_PREFIX = 'pfm_form_draft:';

// The two places an unfinished prayer can be typed. Separate slots so the
// onboarding capture and a later Add-prayer form never restore into each other.
export const DRAFT_SLOTS = Object.freeze({
  NEW_PRAYER: 'new-prayer',
  FIRST_PRAYER: 'first-prayer',
});

// A second open tab must never silently destroy what the first one is writing.
// Each page load gets a random writer id; a write only takes a slot that is
// free, already ours, or has gone quiet — see writeAllowed() below.
const WRITER_ID = typeof crypto?.randomUUID === 'function'
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const TAKEOVER_MS = 60 * 1000;

const hasIDB = () => typeof indexedDB !== 'undefined';
const storageKey = (slot) => `${KEY_PREFIX}${slot}`;

// Memory-only fallback when CryptoKey persistence is unavailable (or IDB fails).
// slot → { record, key }, the same shape persisted to IndexedDB otherwise.
const memory = new Map();

// Encrypting takes several turns of the event loop, so two keystrokes in flight
// at once would race and the slower one would win. Writes per slot are queued.
const writeQueues = new Map();

function serialize(slot, operation) {
  const previous = writeQueues.get(slot) || Promise.resolve();
  // The queue must advance even when an operation rejects, so one failed save
  // can never wedge every later write for that slot.
  const run = previous.catch(() => {}).then(operation);
  const settled = run.catch(() => {});
  writeQueues.set(slot, settled);
  settled.then(() => {
    if (writeQueues.get(slot) === settled) writeQueues.delete(slot);
  });
  return run;
}

const draftContext = (slot) => ({
  entityType: 'prayer-form-draft',
  ownerOrGroupId: 'device',
  recordId: slot,
  keyVersion: 1,
  field: 'draft-payload',
});

async function freshKey() {
  // Non-extractable: usable for encrypt/decrypt on this device, but its raw
  // bytes can never be exported.
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

// The stored record + its key, from memory or IndexedDB. Never throws.
async function readRecord(slot) {
  if (memory.has(slot)) return memory.get(slot);
  if (!hasIDB()) return null;
  try {
    const stored = await idbGet(storageKey(slot));
    if (!stored?.key) return null;
    const { key, ...record } = stored;
    return { record, key };
  } catch {
    return null;
  }
}

async function writeRecord(slot, record, key) {
  if (hasIDB()) {
    try {
      // Structured clone persists the NON-EXTRACTABLE CryptoKey alongside the
      // ciphertext. A DataCloneError (environments that can't clone a CryptoKey)
      // throws here → we fall back to memory-only below.
      await idbSet(storageKey(slot), { ...record, key });
      memory.delete(slot); // persisted — subsequent reads go through IndexedDB
      return;
    } catch {
      try { await idbDel(storageKey(slot)); } catch { /* best-effort cleanup */ }
    }
  }
  memory.set(slot, { record, key });
}

// May THIS page write the slot? Yes when it is empty, when we already own it, or
// when whoever owned it stopped typing a minute ago. While another tab is
// actively editing, we decline rather than overwrite their work — the refusal is
// reported back so the caller can tell the difference between "saved" and "kept
// the other tab's draft".
function writeAllowed(record) {
  if (!record) return true;
  if (record.writer === WRITER_ID) return true;
  return !Number.isFinite(record.updatedAt) || Date.now() - record.updatedAt > TAKEOVER_MS;
}

// Persist (encrypt) one slot's draft. `fields` is the whole draft — this is a
// replace, not a merge, because the form always holds the complete value.
// Resolves 'saved', 'skipped' (another tab is actively editing this slot) or
// 'unavailable' (nothing could be safely persisted). Never throws: losing a
// draft save must never break typing.
export async function saveFormDraft(slot, fields) {
  if (!slot) return 'unavailable';
  return serialize(slot, async () => {
    try {
      const existing = await readRecord(slot);
      if (!writeAllowed(existing?.record)) return 'skipped';
      const key = existing?.key || (await freshKey());
      const now = Date.now();
      const record = {
        v: DRAFT_VERSION,
        slot,
        writer: WRITER_ID,
        createdAt: existing?.record?.createdAt || now,
        updatedAt: now,
        payload: await encryptJson(key, fields, draftContext(slot)),
      };
      await writeRecord(slot, record, key);
      return 'saved';
    } catch {
      return 'unavailable';
    }
  });
}

// Decrypt and return one slot's draft fields, or null. Expired / malformed /
// undecryptable drafts are deleted as a side effect (fail closed).
export async function loadFormDraft(slot) {
  const entry = await readRecord(slot);
  if (!entry) return null;
  const { record, key } = entry;
  if (
    record.v !== DRAFT_VERSION
    || !Number.isFinite(record.updatedAt)
    || Date.now() - record.updatedAt > MAX_AGE_MS
  ) {
    await clearFormDraft(slot);
    return null;
  }
  try {
    const fields = await decryptJson(key, record.payload, draftContext(slot));
    if (!fields || typeof fields !== 'object') { await clearFormDraft(slot); return null; }
    return { ...fields, updatedAt: record.updatedAt };
  } catch {
    await clearFormDraft(slot); // corrupt / wrong key — delete rather than trust
    return null;
  }
}

// Queued alongside the writes, so a debounced save already in flight can never
// re-create the draft the user just saved for real or discarded.
export async function clearFormDraft(slot) {
  if (!slot) return;
  await serialize(slot, async () => {
    memory.delete(slot);
    if (hasIDB()) { try { await idbDel(storageKey(slot)); } catch { /* best-effort */ } }
  });
}

// Every unfinished prayer on this device, wiped together — called from the
// sign-out / account-deletion cleanup alongside the cached prayer snapshot.
export async function clearAllFormDrafts() {
  memory.clear();
  if (!hasIDB()) return;
  try {
    for (const k of await idbKeys()) {
      if (typeof k === 'string' && k.startsWith(KEY_PREFIX)) await idbDel(k);
    }
  } catch { /* best-effort cleanup */ }
}

// Test-only: drop the in-memory cache to simulate a fresh page load, leaving any
// persisted IndexedDB records untouched.
export function __resetMemoryForTests() {
  memory.clear();
  writeQueues.clear();
}

// Test-only: this page's writer id, so a test can assert cross-tab behaviour.
export function __writerIdForTests() {
  return WRITER_ID;
}
