// Helpers for the teaching content layer (prayer guides + theology explanations).
// Content is authored in English and French (the app's primary + default
// languages). Theology articles additionally carry authored translations for the
// other supported languages, folded in on demand as JSON overlays (see
// translations.js); any language, article, or field without one falls back here
// to English/French so the teaching is never shown blank or half-translated. We
// deliberately keep doctrine out of the AI translation pipeline — sound teaching is
// authored and reviewed, not generated at runtime.
import { BOOK_NAMES } from '../dailyVerses';

// Resolve a localized field of shape { en, fr } to the active language, falling
// back to English, then to whatever is present. Accepts plain strings too.
export function pick(field, lang) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  return field[lang] ?? field.en ?? field.fr ?? '';
}

// Book name (in ANY supported language) → USFM code, built from BOOK_NAMES (the
// single source of localized book names, shared with the daily-verse pipeline).
// Teaching and plan references are authored in English, but user/AI prayer verses
// are written in whatever language was active at creation — so to re-localize
// those we must recognise a book by its name in any of the 16 languages, not just
// English. English names are applied last so an English book name always wins any
// (very rare) cross-language name collision.
const CODE_BY_NAME = (() => {
  const idx = {};
  const otherLangs = Object.keys(BOOK_NAMES.PSA || {}).filter((l) => l !== 'en');
  for (const [code, names] of Object.entries(BOOK_NAMES)) {
    for (const l of otherLangs) {
      if (names[l]) idx[names[l]] = code;
    }
  }
  for (const [code, names] of Object.entries(BOOK_NAMES)) {
    if (names.en) idx[names.en] = code;
  }
  // "Psalms" is a common alternate spelling of the authored "Psalm".
  if (idx.Psalm) idx.Psalms = idx.Psalm;
  return idx;
})();

// Localize a reference's book name into the active language, keeping the
// chapter:verse part intact: "1 Corinthians 13:4-7" → "1 Corinthiens 13:4-7" (fr),
// "哥林多前书 13:4-7" (zh), "고린도전서 13:4-7" (ko). Also normalizes a reference
// authored in another language into the reader's ("Jean 3:16" → "John 3:16" for
// en). Falls back to the original reference when the book isn't in BOOK_NAMES or
// the language lacks a name for it — still a valid citation and Bible.com link.
export function localizeRef(ref, lang) {
  if (!ref) return '';
  if (!lang) return ref;
  const m = /^\s*(.+?)\s+(\d.*)$/.exec(ref);
  if (!m) return ref;
  const [, book, rest] = m;
  const code = CODE_BY_NAME[book];
  const name = code && BOOK_NAMES[code]?.[lang];
  return name ? `${name} ${rest}` : ref;
}
