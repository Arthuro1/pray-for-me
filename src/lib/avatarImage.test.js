// What a file has to be before any decoding work happens, and the crop
// arithmetic that decides which pixels survive.
//
// The pixels themselves — real decode, real canvas, real encode, and the
// evidence that EXIF does not survive — are exercised against a real browser in
// avatarImage.browser.spec.js. This file covers the parts that must hold
// everywhere, including on a device whose canvas we never reach.
import { describe, it, expect } from 'vitest';
import {
  ACCEPTED_INPUT_TYPES, AVATAR_IMAGE_ERRORS, MAX_INPUT_BYTES,
  centeredSquare, clampCrop, loadAvatarSource, validateAvatarFile,
} from './avatarImage';

const file = (type, size = 1024) => ({ type, size, name: 'IMG_0042.HEIC' });

describe('input validation', () => {
  it('accepts the three raster formats a phone or a desktop will hand us', () => {
    expect(ACCEPTED_INPUT_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp']);
    for (const type of ACCEPTED_INPUT_TYPES) expect(validateAvatarFile(file(type))).toBeNull();
  });

  // An SVG avatar would be an active document rendered on somebody else's
  // screen; a PDF or a video is simply not an avatar.
  it('refuses anything that is not one of those, SVG included', () => {
    for (const type of ['image/svg+xml', 'image/gif', 'text/html', 'application/pdf', 'video/mp4', '', undefined]) {
      expect(validateAvatarFile(file(type))).toBe(AVATAR_IMAGE_ERRORS.unsupported);
    }
    expect(validateAvatarFile(null)).toBe(AVATAR_IMAGE_ERRORS.unsupported);
  });

  it('rejects an oversized file before spending anything on it', () => {
    expect(validateAvatarFile(file('image/jpeg', MAX_INPUT_BYTES))).toBeNull();
    expect(validateAvatarFile(file('image/jpeg', MAX_INPUT_BYTES + 1))).toBe(AVATAR_IMAGE_ERRORS.tooLarge);
  });

  it('caps input at about 5 MB, so a burst photo fails fast and legibly', () => {
    expect(MAX_INPUT_BYTES).toBe(5 * 1024 * 1024);
  });

  // The declared type is a claim; the second check is whether the bytes decode.
  it('treats a file that will not decode as not an image', async () => {
    expect(await loadAvatarSource(file('image/jpeg'))).toEqual({ error: AVATAR_IMAGE_ERRORS.unreadable });
    expect(await loadAvatarSource(file('image/svg+xml'))).toEqual({ error: AVATAR_IMAGE_ERRORS.unsupported });
  });
});

describe('crop geometry', () => {
  it('opens on the largest centred square of a landscape or portrait photo', () => {
    expect(centeredSquare(4000, 3000)).toEqual({ x: 500, y: 0, size: 3000 });
    expect(centeredSquare(3000, 4000)).toEqual({ x: 0, y: 500, size: 3000 });
    expect(centeredSquare(1000, 1000)).toEqual({ x: 0, y: 0, size: 1000 });
  });

  it('keeps a crop inside the photo whatever the pointer asked for', () => {
    expect(clampCrop({ x: -500, y: -500, size: 400 }, 1000, 800)).toEqual({ x: 0, y: 0, size: 400 });
    expect(clampCrop({ x: 9999, y: 9999, size: 400 }, 1000, 800)).toEqual({ x: 600, y: 400, size: 400 });
    // A square larger than the photo is impossible; it shrinks to fit.
    expect(clampCrop({ x: 0, y: 0, size: 5000 }, 1000, 800).size).toBe(800);
    expect(clampCrop({ x: 0, y: 0, size: 0 }, 1000, 800).size).toBe(1);
  });
});
