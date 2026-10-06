// Attachment service for rich updates/testimonies: validate → (downscale) →
// encrypt → upload to the private `attachments` bucket, and the reverse for
// display. Blobs are ALWAYS encrypted with a per-file key (see mediaCrypto.js)
// regardless of the owning row's own encryption state, so the bucket never
// stores readable media. The returned metadata object is what gets persisted on
// the update/testimony row (inside its E2EE payload when the row is encrypted):
//   { id, type: 'image'|'audio'|'video', path, mime, name, size, key, iv }
//   { id, type: 'link', url }
import { supabase } from './supabase';
import { encryptBlob, decryptToBlob } from './crypto/mediaCrypto';
import { prepareVideoFile } from './videoTranscode';

export const ATTACHMENTS_BUCKET = 'attachments';

// Per-type caps on the ENCRYPTED upload (GCM adds only a 16-byte tag). Images
// are downscaled before the check so a large camera photo still fits.
export const MAX_BYTES = {
  image: 10 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  video: 50 * 1024 * 1024,
};

// Longest side after downscale — large enough for a lightbox, small enough to
// keep uploads and (metered) downloads reasonable.
const MAX_IMAGE_DIM = 1920;

export function attachmentType(mime) {
  if (/^image\//.test(mime)) return 'image';
  if (/^audio\//.test(mime)) return 'audio';
  if (/^video\//.test(mime)) return 'video';
  return null;
}

// Downscale + recompress a photo on a canvas. Anything that fails (exotic
// format, no canvas — e.g. tests) falls back to the original file untouched;
// GIFs are passed through so animation survives.
async function prepareImage(file) {
  if (file.type === 'image/gif' || file.size < 300 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    // Recompression can lose (tiny PNGs) — keep whichever is smaller.
    return blob && blob.size < file.size ? new File([blob], file.name, { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

// Validate, encrypt, and upload one media file. Returns { attachment } or
// { error } with an i18n key the composer can toast ('attachTooLarge',
// 'attachUnsupported', 'attachOffline', 'uploadFailed').
export async function uploadAttachment(file, userId) {
  const type = attachmentType(file.type);
  if (!type) return { error: 'attachUnsupported' };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { error: 'attachOffline' };
  // Never feed an oversized source into the in-memory video converter. Images
  // remain exempt because their normal path intentionally shrinks camera files
  // before enforcing the encrypted-upload cap.
  if (type !== 'image' && file.size > MAX_BYTES[type]) return { error: 'attachTooLarge' };

  let prepared;
  try {
    prepared = type === 'image'
      ? await prepareImage(file)
      : type === 'video' ? await prepareVideoFile(file) : file;
  } catch {
    return { error: 'attachUnsupported' };
  }
  if (prepared.size > MAX_BYTES[type]) return { error: 'attachTooLarge' };

  const id = crypto.randomUUID();
  const path = `${userId}/${id}`;
  try {
    const { bytes, key, iv, encryptionVersion } = await encryptBlob(prepared, {
      ownerOrGroupId: userId,
      recordId: id,
    });
    const { error } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(path, bytes, { contentType: 'application/octet-stream' });
    if (error) return { error: 'uploadFailed' };
    return {
      attachment: { id, type, path, mime: prepared.type, name: prepared.name || file.name || '', size: prepared.size, key, iv, encryptionVersion },
      previewFile: prepared,
    };
  } catch {
    return { error: 'uploadFailed' };
  }
}

// Download + decrypt one media attachment → object URL. Callers get the same
// URL for the same attachment for the lifetime of the page (decrypting a video
// twice would be pure waste), so URLs are never revoked here.
const urlCache = new Map(); // attachment id → Promise<string>

export function attachmentObjectUrl(att) {
  if (!urlCache.has(att.id)) {
    const promise = (async () => {
      const { data, error } = await supabase.storage.from(ATTACHMENTS_BUCKET).download(att.path);
      if (error || !data) throw new Error('download failed');
      const blob = await decryptToBlob(await data.arrayBuffer(), att);
      return URL.createObjectURL(blob);
    })();
    // A failed fetch (offline, revoked access) must be retryable on next mount.
    promise.catch(() => urlCache.delete(att.id));
    urlCache.set(att.id, promise);
  }
  return urlCache.get(att.id);
}

// Best-effort storage cleanup when an update/word is deleted by its author.
// Admins deleting someone else's word won't own the objects — RLS rejects the
// remove and the orphaned ciphertext is unreadable anyway, so errors are ignored.
export function removeAttachmentFiles(attachments) {
  const paths = (attachments || []).filter((a) => a.path).map((a) => a.path);
  if (paths.length === 0) return;
  supabase.storage.from(ATTACHMENTS_BUCKET).remove(paths).catch(() => {});
}

// Normalize + validate a user-entered link. Returns an attachment or null.
export function linkAttachment(raw) {
  const input = (raw || '').trim();
  if (!input) return null;
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(input) ? input : `https://${input}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!url.hostname.includes('.')) return null;
    return { id: crypto.randomUUID(), type: 'link', url: url.href };
  } catch {
    return null;
  }
}
