// Human-readable Bible version (translation) labels, so a shown verse can be
// attributed to the exact edition it came from. This lets the reader verify the
// wording and compare it with other translations — the whole point of the tag.
//
// CORRECTNESS: the label MUST match the source that actually produced the text
// (see the `source` field returned throughout verseText.js), otherwise it
// misinforms. The app has two authoritative text sources, and for several
// languages they are DIFFERENT translations, so the source — not just the
// language — decides the label:
//   'bundle'     → the offline public-domain edition shipped in src/content/verses
//   'youversion' → the licensed edition fetched from the YouVersion Platform API
// A bare reference shown WITHOUT any in-app text is attributed to the edition its
// "open in Bible" link resolves to (the YouVersion edition — see utils/bibleLink).
//
// These two maps are the display twins of the two sources of truth; keep them in
// lockstep when either changes:
//   • YOUVERSION_VERSIONS ↔ LANG_VERSION in src/lib/bibleRef.js
//   • BUNDLE_VERSIONS     ↔ SOURCES in scripts/build-verse-bundle.mjs

// Licensed editions fetched from YouVersion, one per UI language.
export const YOUVERSION_VERSIONS = {
  fr: { abbr: 'LSG', name: 'Louis Segond 1910' },
  en: { abbr: 'WEB', name: 'World English Bible' },
  de: { abbr: 'DELUT', name: 'Lutherbibel 1912' },
  es: { abbr: 'RVES', name: 'Reina-Valera Antigua' },
  pt: { abbr: 'NVI', name: 'Nova Versão Internacional' },
  ru: { abbr: 'НРП', name: 'Новый русский перевод' },
  zh: { abbr: 'CCB', name: '当代译本 (Chinese Contemporary Bible)' },
  ja: { abbr: '口語訳', name: 'Colloquial Japanese 1955' },
  ko: { abbr: 'KLB', name: '현대인의 성경 (Korean Living Bible)' },
  ar: { abbr: 'NAV', name: 'كتاب الحياة (New Arabic Version)' },
  hi: { abbr: 'HHBD', name: 'Hindi Holy Bible' },
  fa: { abbr: 'PCB', name: 'ترجمه معاصر (Persian Contemporary Bible)' },
  id: { abbr: 'TSI', name: 'Terjemahan Sederhana Indonesia' },
  tl: { abbr: 'TLAB', name: 'Ang Biblia (Tagalog)' },
  sw: { abbr: 'NEN', name: 'Neno: Bibilia Takatifu' },
  am: { abbr: 'NASV', name: 'New Amharic Standard Version 2024' },
};

// Offline public-domain editions, one per language that ships a bundle. Languages
// without a bundle (id, am, sw) are absent — their verses only ever resolve via
// YouVersion, so they never need a bundle label.
export const BUNDLE_VERSIONS = {
  fr: { abbr: 'LSG', name: 'Louis Segond 1910' },
  en: { abbr: 'WEB', name: 'World English Bible' },
  de: { abbr: 'LUT', name: 'Lutherbibel 1912' },
  zh: { abbr: '和合本', name: 'Chinese Union Version (Simplified) 1988' },
  ko: { abbr: '개역한글', name: 'Korean Revised Version' },
  ar: { abbr: 'SVD', name: 'Smith & Van Dyke (فان دايك)' },
  fa: { abbr: 'POV', name: 'Persian Old Version (ترجمه قدیم)' },
  hi: { abbr: 'HIOV', name: 'Hindi Old Version' },
  ja: { abbr: '口語訳', name: 'Japanese Kougo-yaku 1954/55' },
  es: { abbr: 'RVR1909', name: 'Reina-Valera 1909' },
  pt: { abbr: 'Livre', name: 'Bíblia Livre' },
  ru: { abbr: 'Синод.', name: 'Синодальный перевод 1876' },
  tl: { abbr: 'ADB', name: 'Ang Dating Biblia 1905' },
};

// The version label for a resolved verse, given the source that produced its text.
// Returns { abbr, name } or null when the source/language has no mapped edition.
export function versionForSource(source, lang) {
  if (source === 'bundle') return BUNDLE_VERSIONS[lang] || null;
  if (source === 'youversion') return YOUVERSION_VERSIONS[lang] || null;
  return null;
}

// The edition a bare reference's "open in Bible" link resolves to — used to
// attribute a reference shown without any in-app verse text. Mirrors versionForLang
// in bibleRef.js (both key off the YouVersion catalog), so the tag names the same
// translation the outbound link opens.
export function linkVersion(lang) {
  return YOUVERSION_VERSIONS[lang] || null;
}
