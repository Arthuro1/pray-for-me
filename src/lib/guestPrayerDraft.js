// Secure, device-local storage for a VISITOR's first prayer — the "pray first,
// sign up only to save" onboarding. Before a visitor has an account, the prayer
// they type is genuinely private: it is encrypted on-device with a per-draft
// AES-GCM key and NEVER leaves this browser until they explicitly choose to save
// it (at which point it is imported through the normal encrypted account path,
// see guestPrayerImport.js). This module is the only place a guest prayer lives.
//
// Guarantees this module upholds:
//   • Sensitive fields (the prayer subject, its completion state, the writing
//     language) live ONLY inside the ciphertext — never in plaintext storage.
//   • The encryption key is a NON-EXTRACTABLE CryptoKey persisted in IndexedDB
//     (via idb-keyval): it can decrypt on this device but its raw bytes can't be
//     read back out, even by page JS.
//   • A content-free presence marker in localStorage lets the app know a draft is
//     pending SYNCHRONOUSLY (to suppress the post-auth onboarding without a
//     flash). It holds only a creation timestamp — never prayer content, an id,
//     or anything that could reveal what was written.
//   • A draft has a version and a maximum lifetime of 24h; an expired, malformed
//     or unreadable draft is deleted on the next read.
//   • CryptoKey persistence is feature-detected. Where it isn't available we fall
//     back to memory-only and fail safely (the draft simply won't survive a
//     reload) — we never downgrade to plaintext-at-rest.
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { encryptJson, decryptJson } from './crypto/e2ee';

const DRAFT_VERSION = 2;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const SLOT = 'pfm_guest_draft'; // IndexedDB record key AND localStorage marker key

const hasIDB = () => typeof indexedDB !== 'undefined';

// Memory-only fallback when CryptoKey persistence is unavailable (or IDB fails).
// Holds { record, key } — the same shape persisted to IndexedDB otherwise.
let memory = null;

const draftContext = (id) => ({
  entityType: 'guest-prayer-draft',
  ownerOrGroupId: 'guest-device',
  recordId: id,
  keyVersion: 1,
  field: 'draft-payload',
});

// Random draft id, used later as the imported prayer's id (client-generated UUID,
// so the local record and the eventual server row line up — see addPrayer).
function newId() {
  return typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function freshKey() {
  // Non-extractable: usable for encrypt/decrypt on this device, but its raw bytes
  // can never be exported — a stronger stance than the raw account-key slot.
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

// ── Content-free presence marker (localStorage) ──────────────────────────────
// Only the creation timestamp is stored, so a synchronous "is a draft pending?"
// check needs no async IndexedDB read and reveals nothing about the prayer.
function setMarker(createdAt) {
  try { localStorage.setItem(SLOT, String(createdAt)); } catch { /* storage unavailable */ }
}
function clearMarker() {
  try { localStorage.removeItem(SLOT); } catch { /* storage unavailable */ }
}

// True (synchronously) when a non-expired guest draft is pending. The app uses
// this to suppress the post-auth onboarding and to decide whether to run the
// import, without awaiting IndexedDB and without a flash.
export function hasPendingGuestDraftSync() {
  try {
    const raw = localStorage.getItem(SLOT);
    if (raw != null) {
      const createdAt = Number(raw);
      return Number.isFinite(createdAt) && Date.now() - createdAt <= MAX_AGE_MS;
    }
  } catch { /* fall through to memory */ }
  return !!memory && Date.now() - memory.record.createdAt <= MAX_AGE_MS;
}

// The creation timestamp of any existing draft (plaintext metadata), so re-saving
// (e.g. marking it prayed) preserves the original 24h window instead of resetting
// it. Null when there is no draft.
async function peekCreatedAt() {
  if (memory?.record) return memory.record.createdAt;
  if (hasIDB()) {
    try { const stored = await idbGet(SLOT); return stored?.createdAt ?? null; }
    catch { return null; }
  }
  return null;
}

// Persist (encrypt) the guest draft. Pass the same `id` when re-saving so marking
// a prayer prayed can't spawn a second prayer on import. Returns { id }.
export async function saveGuestDraft({ id, title, completed = false, contentLanguage = null }) {
  const draftId = id || newId();
  const createdAt = (await peekCreatedAt()) || Date.now();
  const key = await freshKey();
  // The subject / completion / writing language live only inside the ciphertext.
  const payload = await encryptJson(
    key,
    { id: draftId, title, completed: !!completed, contentLanguage },
    draftContext(draftId),
  );
  const record = { v: DRAFT_VERSION, id: draftId, createdAt, payload };

  if (hasIDB()) {
    try {
      // Structured-clone persists the NON-EXTRACTABLE CryptoKey alongside the
      // ciphertext. A DataCloneError (environments that can't clone CryptoKey)
      // throws here → we fall back to memory-only below.
      await idbSet(SLOT, { ...record, key });
      memory = null; // persisted — subsequent reads go through IndexedDB
      setMarker(createdAt);
      return { id: draftId };
    } catch {
      try { await idbDel(SLOT); } catch { /* best-effort cleanup */ }
    }
  }
  // Memory-only fallback: fails safely (won't survive a reload), never plaintext.
  memory = { record, key };
  setMarker(createdAt);
  return { id: draftId };
}

// Re-save the current draft with completed=true (called when the guest prays
// through it), keeping the same id so the import stays a single prayer.
export async function markGuestDraftPrayed() {
  const draft = await loadGuestDraft();
  if (!draft) return;
  await saveGuestDraft({ id: draft.id, title: draft.title, completed: true, contentLanguage: draft.contentLanguage });
}

// Decrypt and return the pending draft, or null. Expired / malformed / undecrypt-
// able drafts are deleted as a side effect (fail closed, never surface garbage).
export async function loadGuestDraft() {
  let record = null;
  let key = null;
  if (memory) {
    ({ record, key } = memory);
  } else if (hasIDB()) {
    try {
      const stored = await idbGet(SLOT);
      if (stored) { key = stored.key; record = { v: stored.v, id: stored.id, createdAt: stored.createdAt, payload: stored.payload }; }
    } catch { /* unreadable — treated as absent below */ }
  }
  if (!record || !key) return null;

  const supportedVersion = record.v === 1 || (record.v === DRAFT_VERSION && typeof record.id === 'string');
  if (!supportedVersion || !Number.isFinite(record.createdAt) || Date.now() - record.createdAt > MAX_AGE_MS) {
    await clearGuestDraft();
    return null;
  }
  try {
    const data = await decryptJson(key, record.payload, record.payload?.v >= 2 ? draftContext(record.id) : undefined);
    if (!data || typeof data.title !== 'string') { await clearGuestDraft(); return null; }
    return {
      id: data.id,
      title: data.title,
      completed: !!data.completed,
      contentLanguage: data.contentLanguage ?? null,
      createdAt: record.createdAt,
    };
  } catch {
    await clearGuestDraft(); // corrupt / wrong key — delete rather than trust
    return null;
  }
}

// Delete the draft everywhere: memory, the localStorage marker, and IndexedDB.
// Called after a successful import OR when the visitor declines to save.
export async function clearGuestDraft() {
  memory = null;
  clearMarker();
  if (hasIDB()) { try { await idbDel(SLOT); } catch { /* best-effort */ } }
}

// Test-only: reset the in-memory cache to simulate a fresh page load (e.g. an
// OAuth redirect), leaving the persisted IndexedDB record untouched.
export function __resetMemoryForTests() {
  memory = null;
}
