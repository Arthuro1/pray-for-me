// Lightweight i18n loader. French is bundled as the always-available fallback;
// every other language is code-split and loaded on demand via loadLocale().
import fr from './i18n/locales/fr.js';

export const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
  { code: 'am', label: 'አማርኛ', flag: '🇪🇹' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'tl', label: 'Tagalog', flag: '🇵🇭' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'fa', label: 'فارسی', flag: '🇮🇷' },
];

export const LANG_CODES = LANGUAGES.map((l) => l.code);

// Right-to-left scripts we ship. Used to set <html dir> so Arabic/Persian read
// correctly instead of rendering left-to-right. Keep in sync with LANGUAGES.
export const RTL_LANGS = ['ar', 'fa'];

export function isRtl(lang) {
  return RTL_LANGS.includes(lang);
}

export function dirFor(lang) {
  return isRtl(lang) ? 'rtl' : 'ltr';
}

// Resolve the startup language: a previously-saved choice wins (if still a
// supported code), else the browser language, else English. Pure so it can be
// unit-tested — and uses LANG_CODES so it never goes stale when languages are added.
export function resolveLanguage(saved, navLang) {
  if (saved && LANG_CODES.includes(saved)) return saved;
  const nav = (navLang || 'fr').toLowerCase().slice(0, 2);
  return LANG_CODES.includes(nav) ? nav : 'en';
}

// In-memory registry of loaded locales. French is always present (fallback).
const loaded = { fr };

export function isLocaleLoaded(lang) {
  return !!loaded[lang];
}

// Loads a language's strings if not already in memory. Falls back silently to
// French (already loaded) if the import fails or the code is unknown.
export async function loadLocale(lang) {
  if (loaded[lang]) return;
  try {
    const mod = await import(`./i18n/locales/${lang}.js`);
    loaded[lang] = mod.default;
  } catch {
    // keep using French fallback
  }
}

export function t(lang, key, vars = {}) {
  const val = loaded[lang]?.[key] ?? loaded.fr[key] ?? key;
  if (typeof val !== 'string') return val;
  return val.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
