import { afterEach, describe, expect, it, vi } from 'vitest';
import { BIBLICAL_WISDOM as plan } from './biblicalWisdom';
import { getPlan, planDayContent, plansByCategory } from '../prayerPlans';
import { usfmFromReference } from '../../lib/bibleRef';
import { localizeRef, pick } from '../teaching/pick';
import { buildGuidedPlanPrayer } from '../../lib/guidedPlan';
import { canUsePlan } from '../../lib/planReview';
import { LANG_CODES } from '../../i18n';
import { WISDOM_RESOURCES, WISDOM_RESOURCE_DAYS } from '../resources/wisdomResources';
import { RESOURCES, RESOURCE_TOPICS } from '../resources/catalogue';
import { isResourceApprovedForDisplay, resolveResources } from '../../lib/resources';
import { startGuidedPlan } from '../../lib/startGuidedPlan';
import { WISDOM_PLAN_SIGNOFF, WISDOM_RESOURCE_SIGNOFF, WISDOM_APPROVED_RESOURCE_IDS } from '../reviews/paulWisdom20260908';

afterEach(() => vi.unstubAllEnvs());

const refs = plan.days.flatMap((day) => [day.ref, ...day.related]);

describe('42-day biblical wisdom curriculum', () => {
  it('registers a versioned study with complete daily scheduling', () => {
    expect(getPlan('wisdom42', 1)).toBe(plan);
    expect(getPlan('wisdom42', 2)).toBeNull();
    expect(plansByCategory().find((group) => group.id === 'bible-study').plans).toContain(plan);
    expect(plan.mode).toBe('study');
    expect(plan.days).toHaveLength(42);
    expect(buildGuidedPlanPrayer(plan, '2026-09-08', 'fr')).toMatchObject({
      title: 'Grandir dans la sagesse biblique',
      schedule: { end: { kind: 'count', count: 42 }, plan: { id: 'wisdom42', version: 1 } },
    });
    expect(planDayContent('wisdom42', 42)).toBe(plan.days[41]);
    expect(planDayContent('wisdom42', 43)).toBeNull();
    plan.days.forEach((day, i) => {
      const movement = plan.movements.find((m) => m.from <= i + 1 && m.to >= i + 1);
      expect(day.movement).toBe(movement.id);
    });
  });

  it('reads every chapter of the three requested books exactly once and in order', () => {
    for (const [book, chapters] of [['Proverbs', 31], ['Ecclesiastes', 12], ['Job', 42]]) {
      expect(refs.filter((ref) => ref.startsWith(`${book} `)))
        .toEqual(Array.from({ length: chapters }, (_, i) => `${book} ${i + 1}`));
    }
    for (const day of plan.days) {
      expect(day.related.length).toBeLessThanOrEqual(3);
      expect(day.related.some((ref) => !/^(Proverbs|Ecclesiastes|Job) /.test(ref))).toBe(true);
    }
  });

  it('keeps all chapter and verse references resolvable and localizable', () => {
    for (const ref of [plan.biblical.ref, ...refs]) {
      expect(usfmFromReference(ref), ref).toBeTruthy();
      for (const lang of LANG_CODES) {
        expect(usfmFromReference(localizeRef(ref, lang)), `${lang}/${ref}`).toBe(usfmFromReference(ref));
      }
    }
  });

  it('provides distinct reflections, questions, practical responses and prayers in French and English', () => {
    for (const lang of ['en', 'fr']) {
      expect(new Set(plan.days.map((day) => day.reflection[lang])).size).toBe(42);
      expect(new Set(plan.days.map((day) => day.study.synthesis[lang])).size).toBe(42);
      for (const day of plan.days) {
        for (const field of [day.theme, day.reflection, ...day.study.questions, day.study.synthesis, day.study.prayer]) {
          expect(field[lang]?.length).toBeGreaterThan(10);
        }
        expect(day.verseText).toBeUndefined();
        expect(day.scriptureText).toBeUndefined();
        expect(pick(day.reflection, 'de')).toBe(day.reflection.en);
      }
    }
  });

  it('records Paul’s approval of the current presentations and authored fallbacks', async () => {
    for (const lang of LANG_CODES) {
      const locale = (await import(`../../i18n/locales/${lang}.js`)).default;
      for (const key of [plan.titleKey, plan.subKey, ...plan.movements.map((m) => m.titleKey)]) {
        expect(locale[key]?.length, `${lang}/${key}`).toBeGreaterThan(0);
      }
    }
    expect(canUsePlan(plan, { preview: false })).toBe(true);
    expect(canUsePlan(plan, { preview: true })).toBe(true);
    expect(plan.review.contentVersion).toBe(plan.version);
    expect(plan.review.theology).toEqual(WISDOM_PLAN_SIGNOFF);
    expect(plan.review.safety).toEqual(WISDOM_PLAN_SIGNOFF);
    for (const lang of LANG_CODES) {
      expect(plan.review.locales[lang]).toEqual({
        ...WISDOM_PLAN_SIGNOFF, scope: 'current-presentation-including-authored-fallbacks',
      });
    }
    expect(plan.proseTranslations).toEqual([]);
  });

  it('starts the approved plan in production without preview while rejecting unsigned drafts', async () => {
    vi.stubEnv('DEV', false);
    const addPrayer = vi.fn(async () => 'wisdom-run');
    expect(await startGuidedPlan({ plan, startDate: '2026-09-08', lang: 'fr', addPrayer }))
      .toEqual({ ok: true, prayerId: 'wisdom-run' });
    expect(addPrayer).toHaveBeenCalledOnce();
    expect(addPrayer.mock.calls[0][0].schedule.plan).toEqual({ id: 'wisdom42', version: 1, startDate: '2026-09-08' });
    expect(canUsePlan({ ...plan, review: { status: 'needs_review' } }, { preview: false })).toBe(false);
    expect(canUsePlan({ ...plan, review: { ...plan.review, safety: null } }, { preview: false })).toBe(false);
  });

  it('connects the four verified resources with Paul’s scoped editorial approval', () => {
    expect(WISDOM_RESOURCES.map((resource) => resource.id)).toEqual(WISDOM_APPROVED_RESOURCE_IDS);
    for (const resource of WISDOM_RESOURCES) {
      expect(RESOURCES.find((item) => item.id === resource.id).domains).toContain('bible-study');
      expect(isResourceApprovedForDisplay(resource)).toBe(true);
      expect(resource.contentReview).toEqual(WISDOM_RESOURCE_SIGNOFF);
      expect(resource.safetyReview).toEqual(WISDOM_RESOURCE_SIGNOFF);
      for (const topic of resource.topics) expect(RESOURCE_TOPICS).toContain(topic);
      for (const edition of Object.values(resource.editions)) {
        expect(new URL(edition.url).protocol).toBe('https:');
        expect(edition.lastVerifiedAt).toBe('2026-09-08');
      }
    }
    for (const [number, ids] of Object.entries(WISDOM_RESOURCE_DAYS)) {
      const day = plan.days[Number(number) - 1];
      expect(day).toBeTruthy();
      for (const id of ids) {
        const resource = WISDOM_RESOURCES.find((item) => item.id === id);
        expect(resource.topics.some((topic) => day.resourceTopics.includes(topic))).toBe(true);
      }
    }
  });

  it('offers resources in the selected languages and only within the Bible-study domain', () => {
    const options = { topics: plan.days[0].resourceTopics, domains: plan.resourceDomains };
    const french = resolveResources({ ...options, languages: ['fr'] });
    expect(french.map((resource) => resource.id).sort())
      .toEqual(['bibleproject-wisdom-videos', 'evangile21-james-resources']);
    expect(french.every((resource) => resource.lang === 'fr')).toBe(true);
    const bilingual = resolveResources({ ...options, languages: ['fr', 'en'] });
    expect(bilingual.map((resource) => resource.id).sort()).toEqual([...WISDOM_APPROVED_RESOURCE_IDS].sort());
    expect(resolveResources({ ...options, languages: ['de'] })).toEqual([]);
    expect(resolveResources({ ...options, domains: ['relationships'], languages: ['fr', 'en'] })).toEqual([]);
  });
});
