import { describe, expect, it } from 'vitest';
import { DISCERNING_BEFORE_COMMITMENT as plan, MOVEMENTS } from './discerningBeforeCommitment';
import { PLANS, getPlan, planDayContent, plansByCategory } from '../prayerPlans';
import { LANG_CODES, loadLocale, t } from '../../i18n';
import { usfmFromReference } from '../../lib/bibleRef';
import { RESOURCE_TOPICS } from '../resources/topics';
import { canUsePlan, isPlanReviewed } from '../../lib/planReview';
import { loadPlanTranslations, mergePlan, overlayLanguages } from './translations';

// Catch the accidental script mixing and repeated paragraphs found during
// translation review. This is a corruption check, not a native-language signoff.
const scriptPatterns = {
  Han: /\p{Script=Han}/gu, Hangul: /\p{Script=Hangul}/gu,
  Hiragana: /\p{Script=Hiragana}/gu, Katakana: /\p{Script=Katakana}/gu,
  Ethiopic: /\p{Script=Ethiopic}/gu, Hebrew: /\p{Script=Hebrew}/gu,
  Thai: /\p{Script=Thai}/gu, Cyrillic: /\p{Script=Cyrillic}/gu,
  Arabic: /\p{Script=Arabic}/gu, Devanagari: /\p{Script=Devanagari}/gu,
};
const expectedScripts = {
  zh: ['Han'], ja: ['Han', 'Hiragana', 'Katakana'], ko: ['Han', 'Hangul'],
  am: ['Ethiopic'], ru: ['Cyrillic'], ar: ['Arabic'], fa: ['Arabic'], hi: ['Devanagari'],
};
function checkProse(text, lang, where) {
  // Arabic and Persian share a Unicode script. The old Persian overview was
  // entirely Arabic, so script exclusion alone could not detect that mix-up.
  // Long Persian passages use Persian letters; this remains a coarse check.
  if (lang === 'fa' && text.length > 100) {
    expect(text, `${lang}/${where}: missing Persian orthography`).toMatch(/[پچژگکی]/u);
  }
  for (const [script, pattern] of Object.entries(scriptPatterns)) {
    if (expectedScripts[lang]?.includes(script)) continue;
    const unexpected = [...new Set(text.match(pattern) || [])];
    expect(unexpected, `${lang}/${where}: unexpected ${script} characters`).toEqual([]);
  }
  const paragraphs = text.split(/\n\s*\n/).map((value) => value.trim()).filter(Boolean);
  expect(new Set(paragraphs).size, `${lang}/${where}: repeated paragraph`).toBe(paragraphs.length);
}

describe('discernment before commitment', () => {
  it('uses the existing 28-day engine and exact version resolution', () => {
    expect(PLANS).toContain(plan);
    expect(getPlan('discernment28', 1)).toBe(plan);
    expect(getPlan('discernment28', 2)).toBeNull();
    expect(plan.days).toHaveLength(28);
    expect(plan.count).toBe(28);
    for (let n = 1; n <= 28; n += 1) expect(planDayContent(plan.id, n)).toBe(plan.days[n - 1]);
    expect(planDayContent(plan.id, 29)).toBeNull();
    expect(planDayContent(plan.id, 0)).toBeNull();
    expect(MOVEMENTS.map(({ from, to }) => [from, to])).toEqual([[1, 7], [8, 14], [15, 21], [22, 28]]);
    plan.days.forEach((day, i) => expect(day.movement).toBe(MOVEMENTS[Math.floor(i / 7)].id));
  });

  it('preserves the manuscript passage sequence and resolves all readings without generated Bible text', () => {
    expect(plan.days[18].ref).toBe('Proverbs 19:2');
    expect(plan.days[19].ref).toBe('Philippians 2:3-4');
    expect(plan.days[21].ref).toBe('1 Thessalonians 5:19-22');
    expect(plan.days[24].ref).toBe('Romans 12:9');
    expect(plan.days[27].ref).toBe('Proverbs 3:5-6');
    for (const day of plan.days) {
      for (const ref of [day.ref, ...day.readingRefs, ...day.related]) expect(usfmFromReference(ref), ref).toBeTruthy();
      expect(day.related.length).toBeLessThanOrEqual(3);
      expect(day.text).toBeUndefined();
      for (const topic of day.resourceTopics) expect(RESOURCE_TOPICS).toContain(topic);
    }
  });

  it('uses Paul’s explicit approval and remains subject to every publication gate', () => {
    expect(isPlanReviewed(plan)).toBe(true);
    expect(canUsePlan(plan, { preview: false })).toBe(true);
    expect(canUsePlan(plan, { preview: true })).toBe(true);
    expect(plansByCategory(PLANS).find((group) => group.id === 'relationships').plans).toContain(plan);
    expect(plan.onboarding).toBeUndefined();
    expect(Object.values(plan.review.locales).every((review) => review.reviewer === 'Paul')).toBe(true);
    expect(canUsePlan({ ...plan, review: { ...plan.review, safety: null } }, { preview: false })).toBe(false);
  });

  it('serves precisely the 14 additional authored translation files', () => {
    expect(overlayLanguages(plan).sort()).toEqual(LANG_CODES.filter((lang) => !['en', 'fr'].includes(lang)).sort());
  });

  it.each(LANG_CODES)('contains the complete curriculum and UI copy in %s', async (lang) => {
    await loadLocale(lang);
    const localized = ['en', 'fr'].includes(lang) ? plan : mergePlan(plan, await loadPlanTranslations(lang, plan.id), lang);
    for (const key of [plan.titleKey, plan.subKey, ...MOVEMENTS.map((m) => m.titleKey),
      'planDiscernmentReading', 'planDiscernmentReflection', 'planDiscernmentPrayer',
      'planDiscernmentListening', 'planDiscernmentJournal', 'planDiscernmentDeeper', 'planDiscernmentReview']) {
      expect(t(lang, key), `${lang}/${key}`).not.toBe(key);
      expect(t(lang, key).trim()).not.toBe('');
      checkProse(t(lang, key), lang, key);
    }
    for (const value of [localized.intro, localized.biblical.text, localized.completion]) {
      expect(value[lang].length).toBeGreaterThan(100);
      checkProse(value[lang], lang, 'plan overview');
    }
    localized.days.forEach((day, i) => {
      expect(day.theme[lang]?.trim(), `day ${i + 1} theme`).toBeTruthy();
      checkProse(day.theme[lang], lang, `day ${i + 1} theme`);
      expect(day.ref).toBe(plan.days[i].ref);
      expect(day.readingRefs).toEqual(plan.days[i].readingRefs);
      for (const field of ['reflection', 'practice']) {
        expect(day[field][lang]?.trim(), `day ${i + 1} ${field}`).toBeTruthy();
        checkProse(day[field][lang], lang, `day ${i + 1} ${field}`);
      }
      for (const [key, value] of Object.entries(plan.days[i].discernment)) {
        const translated = day.discernment[key];
        if (Array.isArray(value)) {
          expect(translated).toHaveLength(3);
          translated.forEach((question) => {
            expect(question[lang]?.trim()).toBeTruthy();
            checkProse(question[lang], lang, `day ${i + 1} question`);
          });
        } else {
          expect(translated[lang]?.trim(), `day ${i + 1} ${key}`).toBeTruthy();
          checkProse(translated[lang], lang, `day ${i + 1} ${key}`);
        }
      }
    });
    expect(localized.days[24].discernment.journalNote[lang]).toBeTruthy();
    expect(localized.days[27].discernment.review[lang].length).toBeGreaterThan(300);
    expect(new Set(localized.days.map((day) => day.reflection[lang])).size).toBe(28);
    expect(new Set(localized.days.map((day) => day.discernment.prayer[lang])).size).toBe(28);
  });
});
