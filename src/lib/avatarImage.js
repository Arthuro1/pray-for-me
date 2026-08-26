// Turning a phone photo into an avatar, entirely on the device.
//
// The original file never leaves the browser. It is validated, decoded, cropped
// to the square the person chose, drawn once into a 512×512 canvas and
// re-encoded — and a canvas encode carries only pixels, so GPS coordinates, the
// camera model, the capture timestamp and any embedded thumbnail are gone by
// construction rather than by a stripping pass we could get wrong.
//
// Everything here is pure browser API: no decoding library, no crop dependency,
// nothing added to the bundle.

// What a file picker may hand us. Raster formats only — an SVG avatar would be
// an active document rendered on someone else's screen, which is not a thing we
// are willing to store, let alone display.
export const ACCEPTED_INPUT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPTED_INPUT_ACCEPT = ACCEPTED_INPUT_TYPES.join(',');

// Rejected before any decoding work happens: a 40 MB burst photo should cost
// one comparison, not a full decode.
export const MAX_INPUT_BYTES = 5 * 1024 * 1024;

// A guard against a decompression bomb: a small file can still declare a
// gigapixel canvas. 50 MP is far above any real camera output.
const MAX_SOURCE_PIXELS = 50 * 1000 * 1000;

// One square, big enough for a retina header tile and nothing more.
export const AVATAR_OUTPUT_SIZE = 512;

// Encoder ladder. The first quality that lands under the budget wins; the last
// is used unconditionally, so a pathological image still produces something.
const QUALITY_STEPS = [0.85, 0.7, 0.55];
export const TARGET_MAX_BYTES = 200 * 1024;

// i18n keys, so a caller can toast the reason without inventing copy.
export const AVATAR_IMAGE_ERRORS = {
  unsupported: 'avatarPhotoUnsupported',
  tooLarge: 'avatarPhotoTooLarge',
  unreadable: 'avatarPhotoUnreadable',
};

// The declared type is a claim, not a fact — it is checked here so an obviously
// wrong file is refused cheaply, and checked again by actually decoding the
// bytes in loadAvatarSource(). Both have to pass.
export function validateAvatarFile(file) {
  if (!file || !ACCEPTED_INPUT_TYPES.includes(file.type)) return AVATAR_IMAGE_ERRORS.unsupported;
  if (file.size > MAX_INPUT_BYTES) return AVATAR_IMAGE_ERRORS.tooLarge;
  return null;
}

// Does this browser actually encode WebP? Safari gained it in 14, but the
// canvas silently falls back to PNG where it does not — which would upload a
// file several times larger under a .webp name. Asked once, cached.
let webpSupport = null;
export function supportsWebpEncode() {
  if (webpSupport !== null) return webpSupport;
  try {
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    webpSupport = probe.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpSupport = false;
  }
  return webpSupport;
}

export function avatarOutputType() {
  return supportsWebpEncode() ? { mime: 'image/webp', ext: 'webp' } : { mime: 'image/jpeg', ext: 'jpg' };
}

// Decode the bytes into something drawable. `imageOrientation: 'from-image'`
// makes the decoder apply the EXIF rotation, so a portrait phone photo is
// upright in the crop box instead of on its side — and because we then draw the
// already-rotated bitmap, the orientation tag has no reason to survive.
//
// A file that will not decode is not an image, whatever its type said.
export async function loadAvatarSource(file) {
  const invalid = validateAvatarFile(file);
  if (invalid) return { error: invalid };
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    if (!bitmap?.width || !bitmap?.height) return { error: AVATAR_IMAGE_ERRORS.unreadable };
    if (bitmap.width * bitmap.height > MAX_SOURCE_PIXELS) {
      bitmap.close?.();
      return { error: AVATAR_IMAGE_ERRORS.tooLarge };
    }
    return { source: bitmap };
  } catch {
    return { error: AVATAR_IMAGE_ERRORS.unreadable };
  }
}

// The largest centred square of a source, i.e. the crop we open the editor on.
export function centeredSquare(width, height) {
  const size = Math.min(width, height);
  return { x: Math.round((width - size) / 2), y: Math.round((height - size) / 2), size };
}

// Keep a requested crop inside the source no matter what the pointer did.
export function clampCrop(crop, width, height) {
  const size = Math.max(1, Math.min(Math.round(crop?.size ?? 0) || 1, width, height));
  return {
    size,
    x: Math.min(Math.max(Math.round(crop?.x ?? 0), 0), width - size),
    y: Math.min(Math.max(Math.round(crop?.y ?? 0), 0), height - size),
  };
}

function encode(canvas, mime, quality) {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob !== 'function') { resolve(null); return; }
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

// Crop → 512×512 → encoded blob. The only output of this module, and the only
// bytes that are ever uploaded: the original is dropped on the floor.
export async function renderAvatarBlob(source, crop) {
  const width = source?.width || 0;
  const height = source?.height || 0;
  if (!width || !height) return { error: AVATAR_IMAGE_ERRORS.unreadable };

  const box = clampCrop(crop || centeredSquare(width, height), width, height);
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { error: AVATAR_IMAGE_ERRORS.unreadable };
  ctx.imageSmoothingQuality = 'high';
  // A JPEG has no alpha channel: without a ground, a transparent PNG would
  // encode its see-through pixels as black.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);

  try {
    ctx.drawImage(source, box.x, box.y, box.size, box.size, 0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);
  } catch {
    return { error: AVATAR_IMAGE_ERRORS.unreadable };
  }

  const { mime, ext } = avatarOutputType();
  let blob = null;
  for (const quality of QUALITY_STEPS) {
    blob = await encode(canvas, mime, quality);
    if (blob && blob.size <= TARGET_MAX_BYTES) break;
  }
  if (!blob) return { error: AVATAR_IMAGE_ERRORS.unreadable };
  return { blob, ext };
}

// Validate → decode → crop → encode, for a caller that already knows the crop
// (or wants the centred default). The crop dialog uses the pieces separately so
// it can show a live preview of the same decoded bitmap.
export async function processAvatarFile(file, crop = null) {
  const { source, error } = await loadAvatarSource(file);
  if (error) return { error };
  try {
    return await renderAvatarBlob(source, crop);
  } finally {
    source.close?.();
  }
}
