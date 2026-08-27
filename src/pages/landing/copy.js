// Landing marketing copy is deliberately separate from the authenticated app
// locale bundles. Only the visitor's active language is requested, so the
// anonymous landing never downloads the other 15 dictionaries.
//
// English is the ONE exception: it ships with the landing shell so there is
// always a complete dictionary in hand synchronously. That is what lets the page
// paint real content on the first frame instead of a spinner — the selected
// language then arrives a moment later and replaces it. It is also the honest
// fallback when a chunk fails to load (offline, a bad deploy), which is why
// resolveLandingCopy reports which language the returned copy is ACTUALLY in
// rather than the one that was asked for.
import en from './locales/landing-en.js';

const loaders = {
  am: () => import('./locales/landing-am.js'),
  ar: () => import('./locales/landing-ar.js'),
  de: () => import('./locales/landing-de.js'),
  // Already bundled with the landing shell (see above) — kept in the map so the
  // supported-language list stays complete, but never fetched as a chunk.
  en: () => Promise.resolve({ default: en }),
  es: () => import('./locales/landing-es.js'),
  fa: () => import('./locales/landing-fa.js'),
  fr: () => import('./locales/landing-fr.js'),
  hi: () => import('./locales/landing-hi.js'),
  id: () => import('./locales/landing-id.js'),
  ja: () => import('./locales/landing-ja.js'),
  ko: () => import('./locales/landing-ko.js'),
  pt: () => import('./locales/landing-pt.js'),
  ru: () => import('./locales/landing-ru.js'),
  sw: () => import('./locales/landing-sw.js'),
  tl: () => import('./locales/landing-tl.js'),
  zh: () => import('./locales/landing-zh.js'),
};

export const LANDING_LOCALE_CODES = Object.freeze(Object.keys(loaders));

export const FALLBACK_LANDING_LANG = 'en';
export const FALLBACK_LANDING_COPY = en;

// Dictionaries already in memory. Seeded with the bundled English so an English
// visitor never waits at all, and filled as other languages load so switching
// back to one already seen is instant.
const cache = { en };

// The copy for a language if it is already in memory, else null. Callers use
// this to decide what they can paint on the very first frame.
export function cachedLandingCopy(lang) {
  return cache[lang] || null;
}

// Load a language and report which language the result is really in. A caller
// that renders `copy` can then label the page with `lang` truthfully, even when
// the requested chunk was unavailable and English came back instead.
export async function resolveLandingCopy(lang) {
  const cached = cachedLandingCopy(lang);
  if (cached) return { lang, copy: cached };
  const load = loaders[lang];
  if (load) {
    try {
      const copy = (await load()).default;
      cache[lang] = copy;
      return { lang, copy };
    } catch {
      // Offline, or a chunk that no longer exists after a deploy — fall through
      // to the bundled English rather than leaving the page without words.
    }
  }
  return { lang: FALLBACK_LANDING_LANG, copy: FALLBACK_LANDING_COPY };
}

export async function loadLandingCopy(lang) {
  return (await resolveLandingCopy(lang)).copy;
}
