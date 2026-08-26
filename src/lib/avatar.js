// Avatar configuration — pure logic, no React, so the deterministic rules can be
// unit-tested and reused by any surface that needs to render a person or a group.
//
// An avatar is three small, structured fields (avatar_type / avatar_value /
// avatar_color) rather than an uploaded image: nothing to store, nothing to
// leak, and no filename or URL that could carry prayer content. Every field is
// optional — a row that predates the migration resolves to a deterministic
// fallback derived from the display name, so existing groups and users are
// recognisable without any backfill.

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

export const AVATAR_TYPES = ['initials', 'icon'];

// Groups read as a place, people as a face: a group defaults to a symbol, a
// person to their initials.
const DEFAULT_TYPE = { group: 'icon', user: 'initials' };

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

// One or two letters. Iterates code points (not UTF-16 units) so an accented,
// Devanagari, or emoji-leading name never splits mid-character.
export function initialsFrom(name) {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = Array.from(words[0])[0] || '';
  const second = words.length > 1 ? (Array.from(words[words.length - 1])[0] || '') : '';
  return (first + second).toLocaleUpperCase();
}

// Reads the three DB columns off any row shape (group, profile, or a nested
// `groups(...)` embed) into the config object the UI works with. Tolerates a
// database where the migration has not run yet: every field simply stays null.
export function avatarConfigFrom(row) {
  if (!row) return null;
  return { type: row.avatar_type ?? null, value: row.avatar_value ?? null, color: row.avatar_color ?? null };
}

// The single resolution point: stored config + display name -> what to draw.
// Stored values are validated, never trusted — an unknown type, an unknown icon
// key, or a colour outside the palette falls back to the deterministic choice
// instead of reaching the DOM (a stored colour is written into a style, so this
// is also what keeps arbitrary text out of it).
export function resolveAvatar({ config = null, name = '', kind = 'user' } = {}) {
  const seed = String(name || '').trim().toLocaleLowerCase() || '?';
  const color = isAvatarColor(config?.color) ? String(config.color).toLowerCase() : fallbackAvatarColor(seed);
  const type = AVATAR_TYPES.includes(config?.type) ? config.type : (DEFAULT_TYPE[kind] || 'initials');
  if (type === 'icon') {
    return { type: 'icon', icon: isAvatarIcon(config?.value) ? config.value : fallbackAvatarIcon(seed), initials: null, color };
  }
  return { type: 'initials', icon: null, initials: initialsFrom(name), color };
}

// The columns to persist for a chosen configuration. Anything invalid is dropped
// to null so the row falls back to the deterministic avatar rather than storing
// junk — the client never writes a value the resolver would refuse to read.
export function avatarColumns({ type, value, color } = {}) {
  const safeType = AVATAR_TYPES.includes(type) ? type : null;
  return {
    avatar_type: safeType,
    avatar_value: safeType === 'icon' && isAvatarIcon(value) ? value : null,
    avatar_color: isAvatarColor(color) ? String(color).toLowerCase() : null,
  };
}

// Only an admin (or the group's creator) may restyle a group. Kept next to the
// resolver so the UI and the tests agree on one rule; the database enforces the
// same thing through the "Admins can update their group" policy.
export function canEditGroupAvatar(group, userId) {
  if (!group || !userId) return false;
  return group.role === 'admin' || group.created_by === userId;
}
