// Avatar configuration — pure logic, no React, so the deterministic rules can be
// unit-tested and reused by any surface that needs to render a person or a group.
//
// An avatar is four small, structured fields (avatar_type / avatar_value /
// avatar_color / avatar_photo_path). Three of them describe a preset — nothing
// to store, nothing to leak, and no filename or URL that could carry prayer
// content. The fourth is an opaque key into the private `avatars` bucket for
// people who would rather show a photograph. Every field is optional — a row
// that predates the migrations resolves to a deterministic fallback derived
// from the display name, so existing groups and users are recognisable without
// any backfill.

// Fills that carry WHITE glyphs/initials at >= 4.5:1 in every theme (the fill is
// a constant, so the ratio does not move with the ground). Deliberately the same
// muted family as the rest of the product — not the saturated web palette.
export const AVATAR_COLORS = [
  '#60457b', // plum   (brand)
  '#4a4f9e', // indigo
  '#2f6ea8', // sky
  '#1f7d76', // teal
  '#3f7d4c', // green
  '#8f6420', // amber
  '#a35540', // clay
  '#a34a6a', // rose
];

export const DEFAULT_AVATAR_COLOR = AVATAR_COLORS[0];

// Preset keys, NOT glyphs: the key is what the database stores, so the drawn
// icon can be restyled later without a migration. Rendering lives in Avatar.jsx.
export const AVATAR_ICONS = ['dove', 'cross', 'church', 'hands', 'family', 'heart', 'bible', 'globe'];

export const AVATAR_TYPES = ['initials', 'icon', 'photo'];

// The two types that can sit UNDER a photo. A photo is a layer on top of a
// preset, never a replacement for it: remove the photo and the preset that was
// already there resurfaces untouched.
const PRESET_TYPES = ['initials', 'icon'];

// Groups read as a place, people as a face: a group defaults to a symbol, a
// person to their initials.
const DEFAULT_TYPE = { group: 'icon', user: 'initials' };

// Uploaded avatars live at `<scope>/<owner id>/<32 hex>.<ext>` in the private
// `avatars` bucket — an opaque object id under a folder the storage policies
// (and a matching check constraint on the row) can authorise. No part of it is
// derived from a name, an email, or anything a person wrote.
const PHOTO_PATH_RE = /^(profiles|groups)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{32}\.(webp|jpg)$/;

// FNV-1a-ish string hash over code points, so the same name always lands on the
// same colour/icon on every device and in every language.
export function avatarHash(seed) {
  let h = 0;
  for (const ch of String(seed ?? '')) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h;
}

export function fallbackAvatarColor(seed) {
  return AVATAR_COLORS[avatarHash(seed) % AVATAR_COLORS.length];
}

// A second, independent draw from the same seed, so a group's colour and symbol
// don't move together in lockstep across the two lists.
export function fallbackAvatarIcon(seed) {
  return AVATAR_ICONS[avatarHash(`${seed}#icon`) % AVATAR_ICONS.length];
}

export function isAvatarColor(value) {
  return AVATAR_COLORS.includes(String(value || '').toLowerCase());
}

export function isAvatarIcon(value) {
  return AVATAR_ICONS.includes(value);
}

export function isAvatarPhotoPath(value) {
  return typeof value === 'string' && PHOTO_PATH_RE.test(value);
}

// An identity-provider photo (today: the Google account picture already carried
// by the session) is a URL we did not mint, so it is validated before it can
// reach an <img src>: https only, nothing that could resolve to a script URL.
export function isIdentityPhotoUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

// One or two letters. Iterates code points (not UTF-16 units) so an accented,
// Devanagari, or emoji-leading name never splits mid-character.
export function initialsFrom(name) {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = Array.from(words[0])[0] || '';
  const second = words.length > 1 ? (Array.from(words[words.length - 1])[0] || '') : '';
  return (first + second).toLocaleUpperCase();
}

// Reads the DB columns off any row shape (group, profile, or a nested
// `groups(...)` embed) into the config object the UI works with. Tolerates a
// database where a migration has not run yet: every field simply stays null.
export function avatarConfigFrom(row) {
  if (!row) return null;
  return {
    type: row.avatar_type ?? null,
    value: row.avatar_value ?? null,
    color: row.avatar_color ?? null,
    photoPath: row.avatar_photo_path ?? null,
  };
}

// Which image, if any, sits on top of the preset.
//
//   • an explicitly uploaded Pray4Me photo always wins;
//   • an identity-provider photo fills in only when the person has made NO
//     explicit choice at all, so a chosen preset or "use initials" is never
//     silently overruled by an account picture.
function resolvePhoto(config, storedType) {
  if (storedType === 'photo' && isAvatarPhotoPath(config?.photoPath)) {
    return { source: 'storage', path: config.photoPath };
  }
  if (config?.type == null && isIdentityPhotoUrl(config?.photoUrl)) {
    return { source: 'identity', url: config.photoUrl };
  }
  return null;
}

// The single resolution point: stored config + display name -> what to draw.
// Stored values are validated, never trusted — an unknown type, an unknown icon
// key, a colour outside the palette, or a path outside the avatars bucket falls
// back to the deterministic choice instead of reaching the DOM (a stored colour
// is written into a style, so this is also what keeps arbitrary text out of it).
//
// The result always carries a complete preset alongside `photo`, so a caller
// that cannot load the image — offline, revoked access, a deleted object — has
// somewhere to land without asking again.
export function resolveAvatar({ config = null, name = '', kind = 'user' } = {}) {
  const seed = String(name || '').trim().toLocaleLowerCase() || '?';
  const color = isAvatarColor(config?.color) ? String(config.color).toLowerCase() : fallbackAvatarColor(seed);
  const storedType = AVATAR_TYPES.includes(config?.type) ? config.type : null;

  const presetType = PRESET_TYPES.includes(storedType) ? storedType
    : (storedType === 'photo' && isAvatarIcon(config?.value)) ? 'icon'
      : (DEFAULT_TYPE[kind] || 'initials');

  const preset = presetType === 'icon'
    ? { type: 'icon', icon: isAvatarIcon(config?.value) ? config.value : fallbackAvatarIcon(seed), initials: null, color }
    : { type: 'initials', icon: null, initials: initialsFrom(name), color };

  const photo = resolvePhoto(config, storedType);
  return photo ? { ...preset, type: 'photo', photo } : { ...preset, photo: null };
}

// The columns to persist for a chosen configuration. Anything invalid is dropped
// to null so the row falls back to the deterministic avatar rather than storing
// junk — the client never writes a value the resolver would refuse to read. A
// photo without a well-formed object key is not a photo, so the type collapses
// too rather than leaving a row that renders nothing.
export function avatarColumns({ type, value, color, photoPath } = {}) {
  const requested = AVATAR_TYPES.includes(type) ? type : null;
  const safePhoto = requested === 'photo' && isAvatarPhotoPath(photoPath) ? photoPath : null;
  const safeType = requested === 'photo' && !safePhoto ? null : requested;
  return {
    avatar_type: safeType,
    // The preset is kept under a photo, so removing the photo restores exactly
    // what the person had chosen before rather than resetting them.
    avatar_value: (safeType === 'icon' || safeType === 'photo') && isAvatarIcon(value) ? value : null,
    avatar_color: isAvatarColor(color) ? String(color).toLowerCase() : null,
    avatar_photo_path: safePhoto,
  };
}

// Only an admin (or the group's creator) may restyle a group. Kept next to the
// resolver so the UI and the tests agree on one rule; the database enforces the
// same thing through the "Admins can update their group" policy and the
// matching storage policies on the avatars bucket.
export function canEditGroupAvatar(group, userId) {
  if (!group || !userId) return false;
  return group.role === 'admin' || group.created_by === userId;
}
