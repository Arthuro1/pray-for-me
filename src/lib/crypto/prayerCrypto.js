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

// Nested collections encrypted ONLY in the local at-rest cache (Phase 3b). On
// the server these live in their own tables (prayer_updates / prayer_points) or
// flow through community fan-out RPCs that publish them as plaintext by design,
// so they stay there. Locally we bundle each collection wholesale into the
// encrypted payload so a private prayer's updates, points, testimonies (and the
// legacy single `testimony`) never sit in plaintext in IndexedDB.
export const CACHE_NESTED_FIELDS = ['prayer_updates', 'prayer_points', 'testimonies', 'testimony'];

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

// Restores sensitive fields from encrypted_payload onto a fetched row. Legacy
// plaintext rows (no payload) pass through unchanged. If the vault is locked or
// the payload can't be decrypted, the row is flagged `_locked` so the UI can
// show a placeholder instead of blank content.
export async function decryptPrayerFromStorage(row) {
  if (!isPrayerEncrypted(row)) return row;
  if (!isUnlocked()) return { ...row, _locked: true };
  try {
    const data = await decryptJson(getMasterKey(), row.encrypted_payload);
    return { ...row, ...data, _locked: false };
  } catch {
    return { ...row, _locked: true };
  }
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
