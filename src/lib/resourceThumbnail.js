// The little cover tile shown beside each "Go deeper" recommendation.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY A THUMBNAIL MAY ONLY EVER BE SELF-HOSTED
// ─────────────────────────────────────────────────────────────────────────────
// docs/RESOURCES.md promises that a recommendation is resolved entirely on the
// device: no topic, no plan day and no reader identifier leaves the phone to
// produce it. Hot-linking a publisher's or a retailer's cover image would break
// that promise silently — the request itself would tell that host this reader's
// IP, and which book (so which topic: marriage, healing, purity) they are
// looking at, BEFORE they tap anything. So a thumbnail is accepted only as a
// path served from our own origin; anything else is refused here rather than
// reaching an <img src>.
//
// When no cover file has been added — the normal case, since covers are curated
// by hand like the rest of the catalogue — we draw a calm generated tile instead
// of leaving a hole: the resource's type glyph on a tint seeded from its id, so
// three books on a shelf read as three distinct covers without any bytes being
// fetched or any real artwork being faked.
import { avatarHash } from './avatar';
import { CATEGORY_COLORS } from './categoryColor';
import { RESOURCE_TYPES } from '../content/resources/topics';

// Same-origin path, image extension, no traversal, no protocol-relative "//host"
// and nothing that could resolve to a script URL. Deliberately an allowlist, in
// the spirit of isAvatarPhotoPath(): a stored string is validated, never trusted.
const THUMBNAIL_PATH_RE = /^\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*\.(jpg|jpeg|png|webp|avif)$/i;
const MAX_THUMBNAIL_LENGTH = 512;

export function isBundledThumbnail(src) {
  if (typeof src !== 'string' || src.length > MAX_THUMBNAIL_LENGTH) return false;
  if (src.startsWith('//') || src.includes('..')) return false;
  return THUMBNAIL_PATH_RE.test(src);
}

// avatarHash is a cheap accumulator (h = h * 31 + codepoint), and 31 ≡ 4 (mod 9)
// — so taking it modulo a 9-colour palette collapses whole families of ids onto
// one hue: six of the catalogue's dozen slugs came out the same purple. One
// murmur3 avalanche before the modulo scatters them, and costs nothing. Not done
// inside avatarHash itself, which would restyle every existing avatar.
function avalanche(h) {
  let x = h >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}

// The generated tile's hue. CATEGORY_COLORS are the app's theme-safe mid-tones —
// documented in categoryColor.js as readable both as a tint and as a coloured
// glyph on the cream and the indigo ground — which is exactly what this needs.
// Seeded from the resource id, so a title keeps the same cover on every device.
export function thumbnailColor(id) {
  return CATEGORY_COLORS[avalanche(avatarHash(id)) % CATEGORY_COLORS.length];
}

// Which types are drawn with a book spine. A generated tile should look like the
// thing it stands for: a study guide has a spine, a podcast does not.
const SPINE_TYPES = ['book', 'study', 'prayerGuide'];

// What to draw for one resolved resource.
//
//   lowData   the reader's device-local "Low data mode". A cover is decoration,
//             so it is exactly the kind of nonessential fetch that setting
//             exists to skip — the generated tile costs nothing and takes over.
//
// Always returns a complete tile, so a caller never has to handle "no image".
export function resolveResourceThumbnail({ id = '', type, thumbnail = null, lowData = false } = {}) {
  const safeType = RESOURCE_TYPES.includes(type) ? type : 'book';
  return {
    src: !lowData && isBundledThumbnail(thumbnail) ? thumbnail : null,
    color: thumbnailColor(id),
    type: safeType,
    spine: SPINE_TYPES.includes(safeType),
  };
}
