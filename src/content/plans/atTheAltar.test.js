// "At the Altar" (zechariah10) retains its content and publication guards after
// the user's explicit approval under Paul's name on 2026-10-08.
import { describe, expect, it } from 'vitest';
import { AT_THE_ALTAR as plan, MOVEMENTS } from './atTheAltar';
import { getPlan, plansByCategory } from '../prayerPlans';
import { canUsePlan, isPlanReviewed } from '../../lib/planReview';
import { usfmFromReference } from '../../lib/bibleRef';
import { localizeRef, pick } from '../teaching/pick';
import { LANG_CODES } from '../../i18n';
import { RESOURCE_DOMAINS, RESOURCE_TOPICS } from '../resources/topics';
import { expectNoProseMatching } from './testing/newPlanContract';
import { AT_THE_ALTAR_APPROVAL } from '../reviews/paulPlanReviews20261008';
import rules from '../../content-quality/content-rules.json';

const TRADITIONAL_ONLY = new Set([...rules.forbiddenCharacters.zh.chars]);

describe('zechariah10 — approved current presentation', () => {
  it('is registered once, versioned and shelved under formation', () => {
    expect(getPlan('zechariah10', 1)).toBe(plan);
    expect(getPlan('zechariah10', 2)).toBeNull();
    expect(plan.count).toBe(10);
    expect(plan.days).toHaveLength(10);
    expect(plansByCategory().find((g) => g.id === 'formation')?.plans).toContain(plan);
    for (const domain of plan.resourceDomains) expect(RESOURCE_DOMAINS).toContain(domain);
  });

  it('uses the explicit approval through the ordinary production gates', () => {
    expect(plan.review).toBe(AT_THE_ALTAR_APPROVAL);
    expect(plan.version).toBe(plan.review.contentVersion);
    expect(isPlanReviewed(plan)).toBe(true);
    expect(canUsePlan(plan, { preview: false })).toBe(true);
    for (const review of [
      { ...plan.review, theology: null },
      { ...plan.review, safety: null },
      { ...plan.review, locales: { ...plan.review.locales, ar: null } },
    ]) expect(canUsePlan({ ...plan, review }, { preview: false })).toBe(false);
  });

  it('divides the days into contiguous movements that every day names', () => {
    expect(MOVEMENTS.map((m) => m.id)).toEqual(['altar', 'waiting', 'purpose']);
    plan.days.forEach((day, i) => {
      const m = MOVEMENTS.find((x) => x.from <= i + 1 && x.to >= i + 1);
      expect(day.movement, `day ${i + 1}`).toBe(m.id);
    });
  });

  it('titles every day in all sixteen languages, in Simplified Chinese', () => {
    for (const [i, day] of plan.days.entries()) {
      for (const lang of LANG_CODES) expect(day.theme?.[lang]?.trim().length, `day ${i + 1} ${lang}`).toBeGreaterThan(0);
      expect([...day.theme.zh].filter((c) => TRADITIONAL_ONLY.has(c)), `day ${i + 1} zh`).toEqual([]);
    }
  });

  it('cites only references the Bible pipeline resolves, in every language', () => {
    const refs = [plan.biblical.ref, ...plan.days.flatMap((d) => [d.ref, ...(d.related || [])])];
    for (const day of plan.days) expect((day.related || []).length).toBeLessThanOrEqual(3);
    for (const ref of refs) {
      const usfm = usfmFromReference(ref);
      expect(usfm, ref).toBeTruthy();
      for (const lang of LANG_CODES) expect(usfmFromReference(localizeRef(ref, lang)), `${lang}/${ref}`).toBe(usfm);
    }
  });

  it('authors its prose in English and French and stores no Bible text', () => {
    for (const lang of ['en', 'fr']) {
      expect(plan.intro[lang].length).toBeGreaterThan(80);
      expect(plan.completion[lang].length).toBeGreaterThan(80);
      expect(plan.biblical.text[lang].length).toBeGreaterThan(80);
      expect(new Set(plan.days.map((d) => d.reflection[lang])).size).toBe(10);
    }
    for (const [i, day] of plan.days.entries()) {
      for (const forbidden of ['verseText', 'scriptureText', 'text', 'readingRefs']) expect(day[forbidden], `day ${i + 1}`).toBeUndefined();
      expect(day.prompts.length, `day ${i + 1}`).toBeGreaterThanOrEqual(2);
      expect(day.selfPrompt.en.length).toBeGreaterThan(15);
      expect(day.practice.fr.length).toBeGreaterThan(15);
      expect(pick(day.reflection, 'de')).toBe(day.reflection.en);
      for (const topic of day.resourceTopics) expect(RESOURCE_TOPICS, `day ${i + 1}`).toContain(topic);
      // "altars" is a deliverance topic (occult altars) — never this plan's.
      expect(day.resourceTopics).not.toContain('altars');
    }
  });

  it('never speaks for God, never promises an outcome, never makes waiting a lever', () => {
    expectNoProseMatching(plan, [
      /\bGod (?:has )?told you\b/i,
      /\bGod is telling you\b/i,
      /\bDieu t['’]a dit\b/i,
      // Affirmative promises only — the plan's own disclaimers ("does not
      // promise that your prayers will be answered as you hope") stay allowed.
      /\b(?:God|He|the Lord) (?:will|shall) (?:surely |certainly )?answer\b/i,
      /\byour prayers? (?:will|shall) (?:surely |certainly )?be answered\b(?! as)/i,
      /\bguarantee/i,
      /\bbreakthrough is (?:coming|due)\b/i,
      /\bprayed enough\b/i,
      /\bDieu (?:t['’])?exaucera\b/i,
      /\bta prière sera (?:certainement )?exaucée\b(?! comme)/i,
      /\bgarantie?\b/i,
    ]);
    // …and says the opposite in its own words where waiting is the subject.
    expect(plan.days[3].reflection.en).toMatch(/does not mean every long prayer will be answered as we hope/);
    expect(plan.days[4].reflection.en).toMatch(/faithfulness did not purchase an answer/);
    expect(plan.days[6].reflection.en).toMatch(/This is not a formula/);
  });

  it('places access to God in Christ, never in the incense or the app', () => {
    expect(plan.days[0].reflection.en).toMatch(/Jesus, the Great High Priest/);
    expect(plan.days[1].reflection.en).toMatch(/The incense did not make the worshipper acceptable/);
  });

  it('has its title, subtitle and movement names in all sixteen locales', async () => {
    for (const lang of LANG_CODES) {
      const locale = (await import(`../../i18n/locales/${lang}.js`)).default;
      for (const key of [plan.titleKey, plan.subKey, ...MOVEMENTS.map((m) => m.titleKey)]) {
        expect(locale[key]?.trim().length, `${lang}/${key}`).toBeGreaterThan(0);
      }
    }
  });
});
