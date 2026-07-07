// Community (per-group) content encryption. Mirrors prayerCrypto.js, but the key
// is a GROUP content key (GCK) resolved per group + version by groupKeys.js
// rather than the account key. Community prayers / updates / testimonies move
// their sensitive fields into encrypted_payload and blank the plaintext columns,
// so Supabase only ever stores ciphertext that the group's members can read.
import { encryptJson, decryptJson, isEncryptedPayload } from './e2ee';

export const COMMUNITY_ENCRYPTION_VERSION = 1;

// Sensitive fields per community table, bundled into that row's encrypted_payload.
export const COMMUNITY_PRAYER_FIELDS = ['title', 'description', 'prayer_points'];
export const COMMUNITY_UPDATE_FIELDS = ['text'];
export const TESTIMONY_FIELDS = ['content'];

// Empty/redacted value per field: scalars → '' (the columns are NOT NULL text),
// prayer_points → [] (jsonb[]). Used both as the encrypt-time default (when the
// field is absent) and the plaintext-column redaction once the real value is
// safe inside encrypted_payload.
const EMPTY = { title: '', description: '', prayer_points: [], text: '', content: '' };

// Bundle `fields` of `row` into encrypted_payload under the group key, redact the
// plaintext columns, and stamp the encryption + key version so a later fetch can
// pick the right GCK version to decrypt with. groupKey = { key: CryptoKey, version }.
async function encryptRow(groupKey, row, fields) {
  const payload = {};
  for (const f of fields) payload[f] = row[f] ?? EMPTY[f];
  const encrypted_payload = await encryptJson(groupKey.key, payload);
  const out = { ...row, encrypted_payload, encryption_version: COMMUNITY_ENCRYPTION_VERSION, key_version: groupKey.version };
  for (const f of fields) if (f in out) out[f] = EMPTY[f];
  return out;
}

export function encryptCommunityPrayer(groupKey, row) { return encryptRow(groupKey, row, COMMUNITY_PRAYER_FIELDS); }
export function encryptCommunityUpdate(groupKey, row) { return encryptRow(groupKey, row, COMMUNITY_UPDATE_FIELDS); }
export function encryptCommunityTestimony(groupKey, row) { return encryptRow(groupKey, row, TESTIMONY_FIELDS); }

// True once a community row carries an encrypted payload (vs. legacy plaintext).
export function isCommunityEncrypted(row) {
  return !!row && isEncryptedPayload(row.encrypted_payload);
}

// Restore a fetched community row's sensitive fields from encrypted_payload.
// `resolveKey(version)` returns the GCK { key, version } for the row's own
// key_version — or null when we can't obtain it (no wrapped key yet). Legacy
// plaintext rows (no payload) pass through unchanged; an undecryptable row is
// flagged `_locked` so the UI can show a placeholder rather than blank content.
export async function decryptCommunityRow(resolveKey, row) {
  if (!isCommunityEncrypted(row)) return row;
  const gk = await resolveKey(row.key_version);
  if (!gk) return { ...row, _locked: true };
  try {
    const data = await decryptJson(gk.key, row.encrypted_payload);
    const rest = { ...row };
    delete rest.encrypted_payload;
    delete rest.encryption_version;
    return { ...rest, ...data, _locked: false };
  } catch {
    return { ...row, _locked: true };
  }
}

// Array convenience (fetch paths). Preserves order; joined aggregates on each row
// (counts, group joins) pass through untouched.
export function decryptCommunityRows(resolveKey, rows) {
  return Promise.all((rows || []).map((r) => decryptCommunityRow(resolveKey, r)));
}
