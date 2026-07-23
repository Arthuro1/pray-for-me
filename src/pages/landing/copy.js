// Landing marketing copy is deliberately separate from the authenticated app
// locale bundles. Only the visitor's active language is requested, so the
// anonymous landing never downloads the other 15 dictionaries.
const loaders = {
  am: () => import('./locales/landing-am.js'),
  ar: () => import('./locales/landing-ar.js'),
  de: () => import('./locales/landing-de.js'),
  en: () => import('./locales/landing-en.js'),
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

export async function loadLandingCopy(lang) {
  const load = loaders[lang] || loaders.en;
  try {
    return (await load()).default;
  } catch {
    return (await loaders.en()).default;
  }
}
