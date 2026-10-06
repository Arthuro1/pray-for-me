// The avatar pipeline against a real browser: real decode, real canvas, real
// encode. This is the only place the privacy claim can actually be checked —
// that what gets uploaded is pixels and nothing else.
import { describe, it, expect } from 'vitest';
import {
  AVATAR_IMAGE_ERRORS, AVATAR_OUTPUT_SIZE, MAX_INPUT_BYTES, TARGET_MAX_BYTES,
  avatarOutputType, processAvatarFile,
} from './avatarImage';

// A recognisable photograph: a gradient plus a shape, so a crop can be told
// apart from the whole frame and an encoder has something to work with.
function drawSource(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#60457b');
  gradient.addColorStop(1, '#1f7d76');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.min(width, height) / 4, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

function encodeSource(width, height, mime, quality) {
  return new Promise((resolve) => drawSource(width, height).toBlob(resolve, mime, quality));
}

async function sourceFile(width, height, mime, name = 'photo') {
  const blob = await encodeSource(width, height, mime, 0.92);
  return new File([blob], name, { type: mime });
}

const bytesOf = async (blob) => new Uint8Array(await blob.arrayBuffer());

function findAscii(bytes, needle) {
  const target = new TextEncoder().encode(needle);
  outer: for (let i = 0; i <= bytes.length - target.length; i += 1) {
    for (let j = 0; j < target.length; j += 1) if (bytes[i + j] !== target[j]) continue outer;
    return true;
  }
  return false;
}

// Splice an EXIF APP1 segment and a JPEG comment into a real JPEG, standing in
// for the GPS coordinates, device name and capture time a phone would attach.
const SECRET = 'PRAYSTEAD-GPS-48.8566-2.3522-IPHONE';
function withMetadata(jpeg) {
  const tiff = [0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
  const app1Body = [...new TextEncoder().encode('Exif\0\0'), ...tiff, ...new TextEncoder().encode(SECRET)];
  const comment = [...new TextEncoder().encode(SECRET)];
  const segment = (marker, body) => [0xff, marker, ((body.length + 2) >> 8) & 0xff, (body.length + 2) & 0xff, ...body];
  return new Uint8Array([
    jpeg[0], jpeg[1],                      // SOI
    ...segment(0xe1, app1Body),            // APP1 / Exif
    ...segment(0xfe, comment),             // COM
    ...jpeg.subarray(2),
  ]);
}

async function dimensionsOf(blob) {
  const bitmap = await createImageBitmap(blob);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close?.();
  return size;
}

describe('processing a real photo', () => {
  for (const mime of ['image/jpeg', 'image/png', 'image/webp']) {
    it(`turns a valid ${mime} into one bounded square`, async () => {
      const { blob, ext, error } = await processAvatarFile(await sourceFile(1600, 1200, mime));
      expect(error).toBeUndefined();
      expect(await dimensionsOf(blob)).toEqual({ width: AVATAR_OUTPUT_SIZE, height: AVATAR_OUTPUT_SIZE });
      expect(blob.type).toBe(avatarOutputType().mime);
      expect(ext).toBe(avatarOutputType().ext);
      expect(blob.size).toBeLessThanOrEqual(TARGET_MAX_BYTES);
    });
  }

  it('bounds the output whatever the input measured', async () => {
    for (const [w, h] of [[3000, 2000], [64, 64], [400, 2400]]) {
      const { blob } = await processAvatarFile(await sourceFile(w, h, 'image/png'));
      expect(await dimensionsOf(blob)).toEqual({ width: AVATAR_OUTPUT_SIZE, height: AVATAR_OUTPUT_SIZE });
    }
  });

  it('honours the requested crop instead of always taking the centre', async () => {
    const file = await sourceFile(1200, 1200, 'image/png');
    const [corner, middle] = await Promise.all([
      processAvatarFile(file, { x: 0, y: 0, size: 200 }),
      processAvatarFile(file, { x: 500, y: 500, size: 200 }),
    ]);
    const [a, b] = await Promise.all([bytesOf(corner.blob), bytesOf(middle.blob)]);
    // The corner is gradient; the middle is the white disc.
    expect(a.length).not.toBe(b.length);
  });

  it('never keeps the original: the upload is always the re-encoded square', async () => {
    const file = await sourceFile(2000, 1500, 'image/jpeg');
    const { blob } = await processAvatarFile(file);
    expect(blob).not.toBe(file);
    expect(blob.size).toBeLessThan(file.size);
  });
});

// The reason the pipeline redraws instead of stripping tags: a canvas encode
// carries pixels, so there is nothing left to strip and nothing to forget.
describe('metadata', () => {
  it('carries no EXIF, GPS, device or comment data into the uploaded image', async () => {
    const original = await bytesOf(await encodeSource(1200, 900, 'image/jpeg', 0.92));
    const withTags = withMetadata(original);
    expect(findAscii(withTags, SECRET)).toBe(true);
    expect(findAscii(withTags, 'Exif')).toBe(true);

    const { blob, error } = await processAvatarFile(new File([withTags], 'IMG_0042.jpg', { type: 'image/jpeg' }));
    expect(error).toBeUndefined();

    const out = await bytesOf(blob);
    expect(findAscii(out, SECRET)).toBe(false);
    expect(findAscii(out, 'Exif')).toBe(false);
  });
});

describe('rejecting what is not an avatar', () => {
  it('refuses a file over the input limit without decoding it', async () => {
    const huge = new File([new Uint8Array(MAX_INPUT_BYTES + 1)], 'huge.jpg', { type: 'image/jpeg' });
    expect(await processAvatarFile(huge)).toEqual({ error: AVATAR_IMAGE_ERRORS.tooLarge });
  });

  it('refuses bytes that are not a decodable image, whatever the type claims', async () => {
    const fake = new File([new TextEncoder().encode('<svg onload="alert(1)"/>')], 'photo.png', { type: 'image/png' });
    expect(await processAvatarFile(fake)).toEqual({ error: AVATAR_IMAGE_ERRORS.unreadable });
  });

  it('refuses an SVG outright, even a well-formed one', async () => {
    const svg = new File([new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>')], 'a.svg', { type: 'image/svg+xml' });
    expect(await processAvatarFile(svg)).toEqual({ error: AVATAR_IMAGE_ERRORS.unsupported });
  });
});
