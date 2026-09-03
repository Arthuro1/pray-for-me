import { describe, expect, it } from 'vitest';
import { DAVID_HEART as plan } from './davidHeart';
import { getPlan, planDayContent, plansByCategory } from '../prayerPlans';
import { LANG_CODES } from '../../i18n';
import { usfmFromReference } from '../../lib/bibleRef';
import { buildGuidedPlanPrayer } from '../../lib/guidedPlan';
import { canUsePlan, isPlanReviewed } from '../../lib/planReview';
import { localizeRef, pick } from '../teaching/pick';
import { mergePlan } from './translations';
import { RESOURCES, RESOURCE_TOPICS } from '../resources/catalogue';
import { DAVID_STUDY_RESOURCES } from '../resources/davidStudyResources';
import { resolveResources } from '../../lib/resources';

describe('David: a study on the existing plan engine', () => {
  it('registers one versioned twelve-day study in the Bible-study category', () => {
    expect(getPlan('david12')).toBe(plan);
    expect(getPlan('david12', 1)).toBe(plan);
    expect(getPlan('david12', 2)).toBeNull();
    expect(plan.mode).toBe('study');
    expect(plan.count).toBe(12);
    expect(plan.days).toHaveLength(12);
    expect(plansByCategory().find((g) => g.id === 'bible-study').plans).toContain(plan);
    for (let n = 1; n <= 12; n++) expect(planDayContent(plan.id, n)).toBe(plan.days[n - 1]);
    expect(planDayContent(plan.id, 13)).toBeNull();
    expect(planDayContent(plan.id, 0)).toBeNull();
  });

  it('uses the same recurring payload and version pinning, without a new backend model', () => {
    const prayer = buildGuidedPlanPrayer(plan, '2026-09-03', 'fr');
    expect(prayer.title).toContain('David');
    expect(prayer.schedule).toEqual({
      type: 'recurring', freq: 'daily', startDate: '2026-09-03',
      end: { kind: 'count', count: 12 },
      plan: { id: 'david12', version: 1, startDate: '2026-09-03' },
    });
  });

  it('records Paul’s approval and no longer needs review mode', () => {
    expect(plan.review.theology).toEqual({ status: 'approved', reviewer: 'Paul', reviewedAt: '2026-09-03' });
    expect(isPlanReviewed(plan)).toBe(true);
    expect(canUsePlan(plan, { preview: false })).toBe(true);
    expect(canUsePlan(plan, { preview: true })).toBe(true);
    expect(plan.proseTranslations).toEqual([]);
  });

  it('follows four movements of three days without renumbering other plans', () => {
    expect(plan.movements.map((m) => [m.from, m.to])).toEqual([[1, 3], [4, 6], [7, 9], [10, 12]]);
    plan.days.forEach((day, i) => expect(day.movement).toBe(plan.movements.find((m) => m.from <= i + 1 && m.to >= i + 1).id));
  });
});

describe('Scripture, study content and languages', () => {
  it('uses resolvable references only, including the longer narrative readings', () => {
    for (const ref of [plan.biblical.ref, ...plan.days.flatMap((day) => [day.ref, ...day.related])]) {
      expect(usfmFromReference(ref), ref).toBeTruthy();
    }
    for (const day of plan.days) {
      expect(day.related.length).toBeLessThanOrEqual(3);
      expect(day.verseText).toBeUndefined();
      expect(day.scriptureText).toBeUndefined();
      expect(day.prompts).toBeUndefined(); // questions are not disguised prayer prompts
      expect(day.study.questions).toHaveLength(3);
      for (const field of [day.reflection, ...day.study.questions, day.study.context, day.study.tension, day.study.synthesis, day.study.prayer]) {
        expect(field.en?.length).toBeGreaterThan(20);
        expect(field.fr?.length).toBeGreaterThan(20);
        expect(pick(field, 'ko')).toBe(field.en);
      }
    }
    expect(new Set(plan.days.map((day) => day.study.context.fr)).size).toBe(12);
    expect(new Set(plan.days.flatMap((day) => day.study.questions.map((q) => q.fr))).size).toBe(36);
  });

  it('provides every title and interface label in all sixteen locales', async () => {
    const keys = [plan.titleKey, plan.subKey, 'planCategoryStudy', ...plan.movements.map((m) => m.titleKey),
      'studyQuestions', 'studyContext', 'studyTension', 'studySynthesis', 'studyPrayer', 'studyRelated', 'studyAddNote', 'studyPace'];
    for (const lang of LANG_CODES) {
      const locale = (await import(`../../i18n/locales/${lang}.js`)).default;
      for (const key of keys) expect(locale[key]?.length, `${lang}/${key}`).toBeGreaterThan(0);
      for (const day of plan.days) expect(day.theme[lang]?.length, `${lang}/${day.ref}`).toBeGreaterThan(0);
    }
  });

  it('preserves the correct book and passage when each reference is localized', () => {
    const refs = [plan.biblical.ref, ...plan.days.flatMap((day) => [day.ref, ...day.related])];
    for (const lang of LANG_CODES) {
      for (const ref of refs) expect(usfmFromReference(localizeRef(ref, lang)), `${lang}/${ref}`).toBe(usfmFromReference(ref));
    }
    expect(localizeRef('1 Samuel 16:1-13', 'ar')).toBe('1 صموئيل 16:1-13');
    expect(localizeRef('2 Samuel 9', 'ko')).toBe('사무엘하 9');
  });

  it('retains the essential qualifications about power, victims and historical evidence', () => {
    expect(plan.biblical.text.fr).toMatch(/ne signifient pas que Dieu approuve/);
    expect(plan.days[3].study.tension.fr).toMatch(/victimes.*danger/);
    expect(plan.days[7].study.tension.fr).toMatch(/ni immunité/);
    expect(plan.days[7].study.tension.fr).toMatch(/Tamar/);
    expect(plan.days[9].study.context.fr).toMatch(/Tel Dan/);
    expect(plan.days[9].study.context.fr).toMatch(/Mésha.*débattue/);
    expect(plan.days[11].related).toContain('1 Kings 2:1-9');
    expect(plan.days[11].related).toContain('Acts 13:22-23');
  });

  it('supports future partial study translations without changing structure or source', () => {
    const overlay = { david12: { days: [{ study: { context: 'Ein historischer Kontext', questions: ['Eine Beobachtungsfrage'], synthesis: 'Eine Zusammenfassung', ref: 'invented' } }] } };
    const merged = mergePlan(plan, overlay, 'de');
    expect(merged.days[0].study.context.de).toBe('Ein historischer Kontext');
    expect(merged.days[0].study.questions[0].de).toBe('Eine Beobachtungsfrage');
    expect(merged.days[0].study.questions).toHaveLength(3);
    expect(pick(merged.days[0].study.questions[1], 'de')).toBe(plan.days[0].study.questions[1].en);
    expect(merged.days[0].ref).toBe(plan.days[0].ref);
    expect(merged.days[0].study.ref).toBeUndefined();
    expect(plan.days[0].study.context.de).toBeUndefined();
  });
});

describe('David’s historical resource shelf', () => {
  const entries = RESOURCES.filter((r) => r.domains.includes('bible-study'));
  const unreviewedFixture = entries.map((r) => ({ ...r, status: 'needs_review' }));

  it('records nine verified resources with Paul’s explicit approval', () => {
    expect(entries).toHaveLength(9);
    expect(DAVID_STUDY_RESOURCES).toHaveLength(9);
    for (const r of entries) {
      expect(r.status).toBe('approved');
      expect(r.contentReview).toEqual({ status: 'approved', reviewedBy: 'Paul', reviewedAt: '2026-09-03' });
      expect(r.safetyReview).toEqual(r.contentReview);
      for (const edition of Object.values(r.editions)) {
        expect(new URL(edition.url).protocol).toBe('https:');
        expect(edition.lastVerifiedAt).toBe('2026-09-03');
      }
    }
    for (const day of plan.days) {
      expect(resolveResources({ topics: day.resourceTopics, domains: plan.resourceDomains, languages: ['fr', 'en'], catalogue: unreviewedFixture })).toEqual([]);
    }
  });

  it('has live resources for each study and keeps the domain isolated', () => {
    for (const day of plan.days) {
      for (const topic of day.resourceTopics) expect(RESOURCE_TOPICS).toContain(topic);
      const rows = resolveResources({ topics: day.resourceTopics, domains: plan.resourceDomains, languages: ['fr', 'en'] });
      expect(rows.length, day.theme.fr).toBeGreaterThan(0);
      expect(resolveResources({ topics: day.resourceTopics, domains: ['relationships'], catalogue: entries })).toEqual([]);
    }
    for (const r of entries) expect(plan.days.some((d) => d.resourceTopics.some((topic) => r.topics.includes(topic))), r.id).toBe(true);
  });

  it('keeps both scholarly positions on the disputed Mesha reading together', () => {
    const rows = resolveResources({ topics: plan.days[9].resourceTopics, domains: plan.resourceDomains, languages: ['fr', 'en'] });
    expect(rows.map((r) => r.id)).toEqual(expect.arrayContaining(['mesha-reading-defence', 'mesha-reading-hypothetical', 'louvre-mesha-stele', 'jewish-museum-tel-dan']));
    expect(rows[0].lang).toBe('fr');
  });
});
