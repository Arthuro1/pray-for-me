// Bridges the prayer data layer and the AES-GCM primitives. Decides what is
// encryptable, moves sensitive fields into an encrypted_payload for storage, and
// restores them after a fetch. The store keeps PLAINTEXT in memory while the
// vault is unlocked; only the persisted forms (Supabase rows + the local
// IndexedDB snapshot) are ciphertext.
import { encryptJson, decryptJson, isEncryptedPayload } from './e2ee.ts';
import { getMasterKey, isUnlocked } from './keyManager.ts';

export const ENCRYPTION_VERSION = 1;

// Scalar prayer-row fields encrypted everywhere (server rows + local cache).
export const SENSITIVE_FIELDS = ['title', 'description', 'person_name', 'phone'];

// Nested collections bundled wholesale into the parent's encrypted payload for
// the local at-rest cache, so a private prayer's updates, points, testimonies
// (and the legacy single `testimony`) never sit in plaintext in IndexedDB.
export const CACHE_NESTED_FIELDS = ['prayer_updates', 'prayer_points', 'testimonies', 'testimony'];

// Child-table collections that are ALSO encrypted on the server (Phase 3b) for
// PRIVATE prayers — each row carries its own encrypted_payload (see the column
// added in supabase/e2ee_migration.sql). Shared prayers keep these rows in
// plaintext because the community fan-out RPCs must read them; the store gates
// this with canEncryptNested. `testimonies` stay on the parent row and are out
// of this phase (still server-plaintext for private prayers).
const SERVER_NESTED_COLLECTIONS = ['prayer_updates', 'prayer_points'];

// Sensitive columns per child table, bundled into that row's encrypted_payload.
export const UPDATE_SENSITIVE_FIELDS = ['text'];
export const POINT_SENSITIVE_FIELDS = ['title', 'verses'];

// A prayer is encryptable when the vault is unlocked AND it is the user's own
// prayer. Saved-from-community copies (community_origin_id) mirror plaintext
// community content and must stay readable without the vault, so they are never
// encrypted. Sharing a prayer to a group publishes a separate plaintext copy
// (community_prayers), so an owned prayer can be both encrypted and shared.
export function canEncrypt(prayer) {
  return isUnlocked() && !!prayer && !prayer.community_origin_id;
}

// True once a prayer row carries an encrypted payload (server or cache).
export function isPrayerEncrypted(row) {
  return !!row && isEncryptedPayload(row.encrypted_payload);
}

// Returns a persistence-ready row: the sensitive fields are bundled into
// encrypted_payload and their plaintext columns redacted to '' (title is
// NOT NULL, so '' rather than null). Requires the vault to be unlocked.
//
// With { nested: true } (the local-cache path) the prayer's nested collections
// are also bundled wholesale and redacted, so updates/points/testimonies are
// never persisted in plaintext on the device. Decryption restores whatever keys
// the payload carries, so server rows (nested: false) round-trip unchanged.
export async function encryptPrayerForStorage(row, { nested = false } = {}) {
  const key = getMasterKey();
  const payload = {};
  for (const f of SENSITIVE_FIELDS) payload[f] = row[f] ?? '';
  if (nested) {
    for (const f of CACHE_NESTED_FIELDS) if (row[f] != null) payload[f] = row[f];
  }
  const encrypted_payload = await encryptJson(key, payload);
  const out = { ...row, encrypted_payload, encryption_version: ENCRYPTION_VERSION };
  for (const f of SENSITIVE_FIELDS) if (f in out) out[f] = '';
  if (nested) {
    for (const f of CACHE_NESTED_FIELDS) if (row[f] != null) out[f] = Array.isArray(row[f]) ? [] : '';
  }
  return out;
}

// Bundle a child row's (prayer_update / prayer_point) sensitive fields into its
// encrypted_payload and redact the plaintext columns (text → '', title → '',
// verses → []). Non-sensitive columns (id, prayer_id, author_name, created_at)
// are left intact. Requires the vault unlocked. Used by the store for PRIVATE
// prayers so updates/points never reach the server tables in plaintext.
export async function encryptChildForStorage(row, fields) {
  const key = getMasterKey();
  const payload = {};
  for (const f of fields) payload[f] = row[f] ?? null;
  const encrypted_payload = await encryptJson(key, payload);
  const out = { ...row, encrypted_payload, encryption_version: ENCRYPTION_VERSION };
  for (const f of fields) if (f in out) out[f] = Array.isArray(row[f]) ? [] : '';
  return out;
}

// Restore one encrypted child row, stripping the ciphertext so the in-memory /
// cache form is clean plaintext. Plaintext rows (shared prayers, legacy) and a
// locked/failed decrypt are handled like the parent path.
async function decryptChildRow(row) {
  if (!isEncryptedPayload(row?.encrypted_payload)) return row;
  if (!isUnlocked()) return { ...row, _locked: true };
  try {
    const data = await decryptJson(getMasterKey(), row.encrypted_payload);
    // Strip the ciphertext so the in-memory / cache form is clean plaintext.
    const rest = { ...row };
    delete rest.encrypted_payload;
    delete rest.encryption_version;
    return { ...rest, ...data };
  } catch {
    return { ...row, _locked: true };
  }
}

// Decrypt any encrypted rows inside the server child collections. No-op (and
// preserves the reference) when nothing is encrypted — so cache rows (whose
// nested data is restored plaintext from the parent payload) and legacy rows
// pass straight through.
async function decryptNestedCollections(row) {
  let out = row;
  for (const coll of SERVER_NESTED_COLLECTIONS) {
    const arr = out[coll];
    if (Array.isArray(arr) && arr.some((c) => isEncryptedPayload(c?.encrypted_payload))) {
      out = { ...out, [coll]: await Promise.all(arr.map(decryptChildRow)) };
    }
  }
  return out;
}

// Restores sensitive fields from encrypted_payload onto a fetched row. Legacy
// plaintext rows (no payload) pass through unchanged. If the vault is locked or
// the payload can't be decrypted, the row is flagged `_locked` so the UI can
// show a placeholder instead of blank content. Encrypted child rows (updates /
// points of a private prayer) are decrypted too, even when the parent itself is
// plaintext (e.g. a prayer created before the vault, edited after unlocking).
export async function decryptPrayerFromStorage(row) {
  let out = row;
  if (isPrayerEncrypted(row)) {
    if (!isUnlocked()) return { ...row, _locked: true };
    try {
      const data = await decryptJson(getMasterKey(), row.encrypted_payload);
      out = { ...row, ...data, _locked: false };
    } catch {
      return { ...row, _locked: true };
    }
  }
  return decryptNestedCollections(out);
}

// Convenience for arrays (load paths). Decrypts each row, preserving order.
export function decryptPrayers(rows) {
  return Promise.all((rows || []).map(decryptPrayerFromStorage));
}

// Encrypt each encryptable prayer's sensitive fields for the at-rest local
// cache. Non-encryptable prayers (saved copies, or an already-locked row) pass
// through unchanged. Callers must only invoke this while the vault is unlocked.
export async function encryptPrayersForCache(prayers) {
  return Promise.all((prayers || []).map((p) => (canEncrypt(p) ? encryptPrayerForStorage(p, { nested: true }) : p)));
}
