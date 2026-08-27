import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { t, tp, LANGUAGES, isLocaleLoaded, resolveLanguage } from './i18n.js';
import fr from './i18n/locales/fr.js';

const SRC = dirname(fileURLToPath(import.meta.url));
const LOCALE_CODES = LANGUAGES.map((l) => l.code);
const COUPLE_PLAN_KEYS = [
  'planCovenantTitle', 'planCovenantSub',
  'planMarriageTitle', 'planMarriageSub',
  'planPersonalizeTitle', 'planCoupleFianceQ',
  'planCoupleSpouseQ', 'planCoupleDisplayName', 'planCoupleChoosePerson',
  'planCoupleNoPerson', 'planCoupleModeQ',
  'planCoupleModePrivate', 'planCoupleModeTogether', 'planCoupleIncludeQ',
  'planCoupleIncludeChildren', 'planCoupleIncludeHome',
  'planCoupleIncludeExtendedFamily', 'planCoupleIncludeHint', 'planCoupleAddChild',
  'planCoupleRemoveChild', 'planCoupleChildName', 'planCouplePrivacy',
  'planCoupleRoleQ', 'planCoupleRoleHusband', 'planCoupleRoleWife',
  'planCouplePartnerEngaged', 'planCouplePartnerMarried', 'planTalkTogether',
  'planPrayTogether', 'planPrayForSpouse', 'planPrayForNamedPerson',
  'planPrayForMarriage', 'planPrayForChild', 'planCoupleHomePrayer',
  'planCoupleExtendedFamilyPrayer', 'planCoupleSafetyHeading',
  'planCoupleReviewPending', 'planCoupleReviewHint', 'planCoupleContinueMarriage',
  'planCoupleRepeat', 'planCoupleTogetherHint',
  'planCoupleRoleReviewPending',
];

function sourceFiles(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'locales') sourceFiles(p, acc); }
    else if (/\.(jsx?|tsx?)$/.test(e.name) && !/\.test\.jsx?$/.test(e.name)) acc.push(p);
  }
  return acc;
}

// Every literal key passed to t(lang, 'key') must exist in the base (fr) locale,
// otherwise it renders the raw key in every language (the "testimonies" bug).
function usedKeys() {
  const keys = new Set();
  const re = /\bt\(\s*[^,]+,\s*['"]([A-Za-z0-9_]+)['"]/g;
  for (const f of sourceFiles(SRC)) {
    const s = readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(s))) keys.add(m[1]);
  }
  return [...keys];
}

describe('t()', () => {
  it('returns a French (bundled fallback) string', () => {
    expect(t('fr', 'close')).toBe('Fermer');
  });

  it('falls back to French for a language not yet loaded', () => {
    // 'en' is code-split and not loaded in this unit context, so t() falls back to fr.
    expect(t('en', 'close')).toBe('Fermer');
  });

  it('falls back to the key itself for an unknown key', () => {
    expect(t('fr', '__does_not_exist__')).toBe('__does_not_exist__');
  });

  it('interpolates {vars}', () => {
    // Use a synthetic key path via a known interpolated string is hard without a
    // guaranteed placeholder key, so assert the replace logic on a missing key
    // that returns itself unchanged when no vars are present.
    expect(t('fr', 'Hello {name}', { name: 'Paul' })).toBe('Hello Paul');
  });

  it('drops placeholders with no matching var', () => {
    expect(t('fr', '{a}-{b}', { a: 'x' })).toBe('x-');
  });

  it('chooses a natural singular or plural completion message', () => {
    expect(tp('fr', 'sessionDoneSub', 1)).toBe('Vous avez prié pour 1 sujet aujourd’hui.');
    expect(tp('fr', 'sessionDoneSub', 2)).toBe('Vous avez prié pour 2 sujets aujourd’hui.');
  });
});

describe('LANGUAGES', () => {
  it('lists 16 languages with French only loaded by default', () => {
    expect(LANGUAGES).toHaveLength(16);
    expect(isLocaleLoaded('fr')).toBe(true);
    expect(isLocaleLoaded('en')).toBe(false);
  });
});

describe('resolveLanguage', () => {
  it('keeps a saved choice for ANY supported language (not just the original 4)', () => {
    // Regression: previously only fr/en/de/pt survived a reload.
    for (const { code } of LANGUAGES) {
      expect(resolveLanguage(code, 'en-US')).toBe(code);
    }
  });

  it('falls back to the browser language when nothing is saved', () => {
    expect(resolveLanguage(null, 'es-ES')).toBe('es');
    expect(resolveLanguage(undefined, 'ja')).toBe('ja');
  });

  it('falls back to English for an unsupported saved value or browser language', () => {
    expect(resolveLanguage('xx', 'zz-ZZ')).toBe('en');
    expect(resolveLanguage(null, null)).toBe('fr'); // navLang '' → 'fr' slice is supported
  });
});

describe('locale coverage', () => {
  it('defines every t() key used in the source in the base (fr) locale', () => {
    const missing = usedKeys().filter((k) => !(k in fr));
    expect(missing, `keys used in code but missing from fr.js: ${missing.join(', ')}`).toEqual([]);
  });

  it('every other locale has the same keys as fr (no silent French fallback)', async () => {
    const frKeys = Object.keys(fr);
    for (const code of LOCALE_CODES) {
      if (code === 'fr') continue;
      const locale = (await import(`./i18n/locales/${code}.js`)).default;
      const missing = frKeys.filter((k) => !(k in locale));
      expect(missing, `${code}.js is missing keys: ${missing.join(', ')}`).toEqual([]);
    }
  });
});

describe('relationships and family plan localization', () => {
  // The season question is gone: it asked a reader where they were romantically,
  // stored the answer, and nothing ever read it. Its copy went with it, and no
  // locale may quietly keep a string for it.
  it('no longer ships copy for questions that changed nothing', async () => {
    const en = (await import('./i18n/locales/en.js')).default;
    const retired = Object.keys(en).filter((key) => /^planPrep(Season|Emphasis)/.test(key));
    expect(retired).toEqual([]);
    for (const code of LOCALE_CODES) {
      const locale = code === 'fr' ? fr : (await import(`./i18n/locales/${code}.js`)).default;
      const stale = Object.keys(locale).filter((key) => /^planPrep(Season|Emphasis)/.test(key));
      expect(stale, `${code}.js still ships retired keys: ${stale.join(', ')}`).toEqual([]);
    }
  });

  it('provides every couple-plan key in all 16 locales', async () => {
    expect(new Set(COUPLE_PLAN_KEYS).size).toBe(COUPLE_PLAN_KEYS.length);
    for (const code of LOCALE_CODES) {
      const locale = code === 'fr' ? fr : (await import(`./i18n/locales/${code}.js`)).default;
      const missing = COUPLE_PLAN_KEYS.filter((key) => typeof locale[key] !== 'string' || !locale[key].trim());
      expect(missing, `${code}.js is missing couple-plan keys: ${missing.join(', ')}`).toEqual([]);
    }
  });
});
