// Lightweight, on-device content-language hinting, so the "See translation"
// control appears only when community content is plausibly in a DIFFERENT
// language than the interface — and never clutters a monolingual group.
//
// Two signals, no network and no AI:
//   1. Script ranges (Arabic, Cyrillic, CJK, Hangul, Devanagari, Ethiopic) —
//      near-certain, and each maps to the set of app languages using it.
//   2. Distinctive stop words for the Latin-script languages we ship.
// When neither is confident the content is treated as MATCHING (control hidden)
// — the conservative choice, since a cached translation for the text is a third
// signal callers can pass to force the control on.
//
// The heuristic is ALWAYS a fallback: an author who states their prayer's
// language (content_language) overrules it, here and everywhere downstream.
import { LANG_CODES } from '../i18n';

const SCRIPTS = [
  { re: /[؀-ۿ]/, langs: ['ar', 'fa'] },
  { re: /[Ѐ-ӿ]/, langs: ['ru'] },
  { re: /[぀-ヿ]/, langs: ['ja'] },
  { re: /[가-힯]/, langs: ['ko'] },
  { re: /[一-鿿]/, langs: ['zh', 'ja'] },
  { re: /[ऀ-ॿ]/, langs: ['hi'] },
  { re: /[ሀ-፿]/, langs: ['am'] },
];

// Words chosen to be common in their language and rare in the others we ship.
// Deliberately excludes forms shared across Romance languages (e.g. "que").
const STOPWORDS = {
  en: ['the', 'and', 'with', 'this', 'that', 'for', 'is', 'are', 'my', 'god'],
  fr: ['le', 'la', 'les', 'et', 'pour', 'dans', 'est', 'mon', 'une', 'des', 'du', 'dieu', 'que', 'prière'],
  es: ['el', 'los', 'las', 'una', 'con', 'por', 'dios', 'oración', 'está', 'señor'],
  pt: ['não', 'uma', 'com', 'por', 'deus', 'meu', 'minha', 'oração', 'senhor'],
  de: ['der', 'die', 'das', 'und', 'für', 'mit', 'ist', 'nicht', 'mein', 'gott'],
  id: ['yang', 'dan', 'untuk', 'dengan', 'tidak', 'saya', 'ini', 'tuhan', 'doa'],
  sw: ['katika', 'mungu', 'kwa', 'wangu', 'maombi', 'bwana', 'kila'],
  tl: ['ang', 'ng', 'mga', 'ako', 'ito', 'panginoon', 'diyos'],
};

// The set of app language codes the text plausibly belongs to, or null when
// unknown. Script ranges win outright; Latin text needs at least two stop-word
// hits and a strict winner to count as detected.
export function contentLangHint(text) {
  const sample = (text || '').slice(0, 400);
  if (!sample.trim()) return null;

  for (const { re, langs } of SCRIPTS) {
    if (re.test(sample)) return langs;
  }

  const words = sample.toLowerCase().split(/[^\p{L}']+/u).filter(Boolean);
  if (words.length === 0) return null;
  const wordSet = new Set(words);
  let best = null;
  let bestHits = 0;
  let tie = false;
  for (const [lang, stops] of Object.entries(STOPWORDS)) {
    const hits = stops.reduce((n, w) => n + (wordSet.has(w) ? 1 : 0), 0);
    if (hits > bestHits) { best = lang; bestHits = hits; tie = false; }
    else if (hits === bestHits && hits > 0) tie = true;
  }
  if (!best || bestHits < 2 || tie) return null;
  return [best];
}

// Should the translation control be offered for this content in this UI
// language? Explicit stored metadata (`contentLanguage`, stamped at creation)
// is authoritative and decides even for the short requests the heuristic can't
// read. Without it: true on a confident heuristic mismatch, or when a
// translation for the text already exists (someone translated it before — a
// mismatch by definition).
export function needsTranslationControl(text, uiLang, { contentLanguage = null, hasCachedTranslation = false } = {}) {
  const stated = normalizeContentLang(contentLanguage);
  if (stated) return stated !== uiLang;
  if (hasCachedTranslation) return true;
  const hint = contentLangHint(text);
  return !!hint && !hint.includes(uiLang);
}

// Coerce a stored/incoming language tag to one of the app's supported codes
// ('en-GB' → 'en'), or null when we don't ship it. Everything that writes or
// reads content_language goes through this, so the metadata is always one of a
// known, normalized set rather than whatever a tag happened to say.
export function normalizeContentLang(code) {
  if (!code) return null;
  const base = String(code).toLowerCase().trim().split(/[-_]/)[0];
  return LANG_CODES.includes(base) ? base : null;
}

// The single language to SHOW as this content's source: what the author stated,
// else what the heuristic can confidently read, else null ("we don't know" — the
// caller shows the active language as the default rather than inventing one).
export function statedSourceLang(text, contentLanguage = null) {
  const stated = normalizeContentLang(contentLanguage);
  if (stated) return stated;
  const hint = contentLangHint(text);
  return hint && hint.length === 1 ? hint[0] : null;
}

// A confident heuristic reading that DISAGREES with the language currently
// selected — the only case worth surfacing a quiet "looks like X?" confirmation
// for. Returns null whenever the heuristic is unsure or already agrees, so the
// suggestion stays rare. It is never applied automatically: the caller offers
// it, the author decides.
export function suggestedSourceLang(text, selected) {
  const hint = contentLangHint(text);
  if (!hint || hint.length !== 1) return null;
  return hint[0] === selected ? null : hint[0];
}
