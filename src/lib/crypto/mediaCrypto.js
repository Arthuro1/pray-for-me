// Per-file encryption for media attachments — AES-256-GCM over raw bytes.
//
// Every uploaded attachment gets its OWN random key, generated client-side and
// never sent to the server on its own: the key + IV travel inside the owning
// row's attachment metadata, which is itself E2E-encrypted for private/community
// content (or protected by RLS for legacy plaintext rows). Storage therefore
// only ever holds ciphertext, so the bucket's read policy can be broad without
// exposing anyone's photos, recordings, or videos.
import { toB64, fromB64 } from './e2ee';

const IV_BYTES = 12;

const mediaContext = ({ ownerOrGroupId, recordId }) => new TextEncoder().encode(JSON.stringify([
  2, 'attachment', ownerOrGroupId || '', recordId, '', 1, 'blob',
]));

async function importFileKey(keyB64) {
  return crypto.subtle.importKey('raw', fromB64(keyB64), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

// Encrypt a Blob/File → { bytes (ciphertext ArrayBuffer), key, iv } with key/iv
// base64-encoded for embedding in the attachment metadata.
export async function encryptBlob(blob, context) {
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt']);
  const bytes = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: mediaContext(context) },
    key,
    await blob.arrayBuffer(),
  );
  return { bytes, key: toB64(rawKey), iv: toB64(iv), encryptionVersion: 2 };
}

// Decrypt ciphertext bytes back to a typed Blob. Throws on a wrong key or
// tampered ciphertext (GCM authentication) — callers show an error state
// rather than trusting partial output.
export async function decryptToBlob(bytes, { key, iv, mime, id, path, encryptionVersion = 1 }) {
  const cryptoKey = await importFileKey(key);
  const ownerOrGroupId = path?.split('/')[0] || '';
  const params = encryptionVersion >= 2
    ? { name: 'AES-GCM', iv: fromB64(iv), additionalData: mediaContext({ ownerOrGroupId, recordId: id }) }
    : { name: 'AES-GCM', iv: fromB64(iv) };
  const plain = await crypto.subtle.decrypt(params, cryptoKey, bytes);
  return new Blob([plain], { type: mime || 'application/octet-stream' });
}
