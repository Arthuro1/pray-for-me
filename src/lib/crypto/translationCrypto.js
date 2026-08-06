// Encrypted translation cache primitives.
//
// Machine translations of prayer content used to be stored as PLAINTEXT
// (original_text + translated_text) in the `translations` and
// `community_translations` tables — a second, unprotected copy of the very
// content the app otherwise encrypts. This module replaces that with:
//
//   • source_hmac          — a KEYED HMAC-SHA256 of the source text. The key is
//                            HKDF-derived from the user's account key (private
//                            cache) or the group key (community cache), so the
//                            server can look a translation up by source WITHOUT
//                            ever seeing the source text, and two different keys
//                            never collide.
//   • encrypted_translation + nonce — the translated text, AES-256-GCM encrypted
//                            under the same account/group key, bound via AAD to
//                            its scope (owner/group, source_hmac, language).
//
// The source text is NEVER stored. Because the HMAC is deterministic per source,
// a changed source produces a different hmac and the old row is simply never
// matched again (effectively invalidated); a TTL (`expires_at`) sweeps orphans.
import { encryptJson, decryptJson, fromB64 } from './e2ee.ts';
import { exportRawMasterKey, getMasterKey, isUnlocked } from './keyManager.ts';

const enc = new TextEncoder();

export const TRANSLATION_ENCRYPTION_VERSION = 2;

// HKDF-derive a dedicated HMAC-SHA256 subkey from raw key bytes. A distinct
// `info` label keeps it independent of the AES key used for the ciphertext, so
// the same key material is never reused across two algorithms.
async function hmacKeyFromRaw(rawBytes, info) {
  const base = await crypto.subtle.importKey('raw', rawBytes, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode(info) },
    base,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign'],
  );
}

async function hmacHex(hmacKey, message) {
  const sig = await crypto.subtle.sign('HMAC', hmacKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Account (private) translation cache ──────────────────────────────────────

// Derive the HMAC key for the CURRENT unlocked account. Null when locked.
export async function deriveAccountHmacKey() {
  if (!isUnlocked()) return null;
  const b64 = await exportRawMasterKey();
  if (!b64) return null;
  return hmacKeyFromRaw(fromB64(b64), 'pray4me/translation-hmac/account/v1');
}

function accountContext(userId, sourceHmac, targetLanguage) {
  return {
    entityType: 'private-translation',
    ownerOrGroupId: userId || '',
    recordId: sourceHmac,
    field: targetLanguage,
    keyVersion: 1,
  };
}

// Build an encrypted private-translation row (minus user_id/target_language, which
// the caller adds). Requires the vault unlocked. Returns null if unavailable.
export async function encryptAccountTranslation({ userId, sourceHmac, targetLanguage, translatedText }) {
  if (!isUnlocked()) return null;
  const payload = await encryptJson(getMasterKey(), translatedText, accountContext(userId, sourceHmac, targetLanguage));
  return {
    source_hmac: sourceHmac,
    encrypted_translation: payload.ct,
    nonce: payload.iv,
    encryption_version: payload.v,
  };
}

// Decrypt a private-translation row → the translated string, or null on failure.
export async function decryptAccountTranslation({ userId, row }) {
  if (!isUnlocked()) return null;
  try {
    return await decryptJson(
      getMasterKey(),
      { v: row.encryption_version ?? TRANSLATION_ENCRYPTION_VERSION, iv: row.nonce, ct: row.encrypted_translation },
      accountContext(userId, row.source_hmac, row.target_language),
    );
  } catch {
    return null;
  }
}

// ── Community (group) translation cache ──────────────────────────────────────

// Derive the HMAC key for a group key version. `groupKey` is the AES-GCM
// CryptoKey from groupKeys.getGroupKey (extractable). Null if unavailable.
export async function deriveGroupHmacKey(groupKey) {
  if (!groupKey) return null;
  try {
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', groupKey));
    return hmacKeyFromRaw(raw, 'pray4me/translation-hmac/group/v1');
  } catch {
    return null;
  }
}

function groupContext(groupId, sourceHmac, targetLanguage, keyVersion) {
  return {
    entityType: 'community-translation',
    ownerOrGroupId: groupId || '',
    recordId: sourceHmac,
    field: targetLanguage,
    keyVersion: keyVersion || 1,
  };
}

export async function encryptGroupTranslation({ groupKey, groupId, sourceHmac, targetLanguage, keyVersion, translatedText }) {
  if (!groupKey) return null;
  const payload = await encryptJson(groupKey, translatedText, groupContext(groupId, sourceHmac, targetLanguage, keyVersion));
  return {
    source_hmac: sourceHmac,
    encrypted_translation: payload.ct,
    nonce: payload.iv,
    encryption_version: payload.v,
    key_version: keyVersion || 1,
  };
}

export async function decryptGroupTranslation({ groupKey, groupId, row }) {
  if (!groupKey) return null;
  try {
    return await decryptJson(
      groupKey,
      { v: row.encryption_version ?? TRANSLATION_ENCRYPTION_VERSION, iv: row.nonce, ct: row.encrypted_translation },
      groupContext(groupId, row.source_hmac, row.target_language, row.key_version),
    );
  } catch {
    return null;
  }
}

// Compute a source HMAC hex for a given key.
export async function computeSourceHmac(hmacKey, sourceText) {
  return hmacHex(hmacKey, sourceText);
}
