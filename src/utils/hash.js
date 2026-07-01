// Small, fast, non-cryptographic hash (FNV-1a → base36). Used only as a compact
// cache key for shared translations (Postgres can't index arbitrarily long text).
// Collisions are harmless: callers verify the stored original text on read, so a
// rare collision degrades to a cache miss, never a wrong translation.
export function hashText(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}
