import { describe, expect, it } from 'vitest';
import { PRAYING_FOR_OUR_MARRIAGE } from './prayingForOurMarriage.js';
import { LANG_CODES } from '../../i18n.js';
import { usfmFromReference } from '../../lib/bibleRef.js';
import { RESOURCE_TOPICS } from '../resources/topics.js';

const plan = PRAYING_FOR_OUR_MARRIAGE;
const overlays = import.meta.glob('./translations/marriage30/*.json', { eager: true });

describe('Praying for Our Marriage content contract', () => {
  it('is a review-gated, renewable 30-day plan on the shared model', () => {
    expect(plan).toMatchObject({
      id: 'marriage30', category: 'relationships', lifeStage: 'married',
      count: 30, version: 1, onboarding: 'married',
      renewable: true, review: { status: 'needs_review' },
    });
    // Every overlay in translations/marriage30/ is still a structural stub, so
    // none is served yet and readers get the authored en/fr instead.
    expect(plan.proseTranslations).toEqual([]);
    expect(plan.days).toHaveLength(30);
    expect(plan.analyticsEvents).toEqual({
      started: 'marriage_plan_started',
      dayCompleted: 'marriage_plan_day_completed',
      completed: 'marriage_plan_completed',
    });
  });

  it('keeps Scripture in the reader and authors every title in all locales', () => {
    for (const day of plan.days) {
      expect(usfmFromReference(day.ref), day.ref).toBeTruthy();
      for (const ref of day.related) expect(usfmFromReference(ref), ref).toBeTruthy();
      for (const code of LANG_CODES) expect(day.theme[code], `${day.theme.en}/${code}`).toBeTruthy();
      expect(day.prompts).toHaveLength(1);
      for (const field of ['reflection', 'spousePrompt', 'selfPrompt', 'marriagePrompt']) {
        expect(day[field]?.en, `${day.theme.en}/${field}/en`).toBeTruthy();
        expect(day[field]?.fr, `${day.theme.en}/${field}/fr`).toBeTruthy();
      }
      for (const topic of day.resourceTopics) expect(RESOURCE_TOPICS, topic).toContain(topic);
    }
  });

  it('is complete without children and adds children on exactly two days', () => {
    const childDays = plan.days.filter((day) => day.withChildren);
    expect(childDays).toHaveLength(2);
    for (const day of plan.days) {
      expect(day.childPrompt).toBeUndefined();
      expect(day.reflection.en).toBeTruthy();
      if (!day.withChildren) continue;
      expect(day.withChildren.childPrompt.en).toContain('{child}');
      expect(day.withChildren.childPrompt.fr).toContain('{child}');
      expect(day.withChildren.reflection.en).toBeTruthy();
    }
    expect(plan.intro.en).toMatch(/already a family/i);
    expect(JSON.stringify(plan)).not.toMatch(/children (are|will be) guaranteed/i);
  });

  it('balances spouse, self, and marriage prayer and review-gates role prose', () => {
    for (const day of plan.days) {
      expect(day.spousePrompt).toBeTruthy();
      expect(day.selfPrompt).toBeTruthy();
      expect(day.marriagePrompt).toBeTruthy();
    }
    const roleDays = plan.days.filter((day) => day.roles);
    expect(roleDays).toHaveLength(2);
    for (const day of roleDays) {
      expect(day.roleReviewStatus).toEqual({ status: 'needs_review' });
      expect(Object.keys(day.roles).sort()).toEqual(['husband', 'wife']);
    }
  });

  it('places explicit safeguards on conflict, forgiveness, intimacy, family, and crisis days', () => {
    for (const index of [6, 7, 10, 11, 17, 20]) {
      expect(plan.days[index].safetyNote?.en, `day ${index + 1}`).toBeTruthy();
      expect(plan.days[index].safetyNote?.fr, `day ${index + 1}`).toBeTruthy();
    }
    const safety = plan.days.map((day) => day.safetyNote?.en || '').join(' ');
    expect(safety).toMatch(/safety/i);
    expect(safety).toMatch(/professional/i);
    expect(safety).toMatch(/legal/i);
  });

  it('ships structurally complete prose overlays for all 14 other locales', () => {
    expect(Object.keys(overlays)).toHaveLength(14);
    for (const [path, mod] of Object.entries(overlays)) {
      const tr = mod.default.marriage30;
      expect(tr.days, path).toHaveLength(30);
      for (const field of ['intro', 'biblical', 'completion']) {
        expect(tr[field], `${path}/${field}`).toBeTruthy();
      }
      tr.days.forEach((translated, index) => {
        const source = plan.days[index];
        for (const field of ['reflection', 'spousePrompt', 'selfPrompt', 'marriagePrompt']) {
          expect(translated[field], `${path}/day ${index + 1}/${field}`).toBeTruthy();
        }
        expect(translated.prompts, `${path}/day ${index + 1}/prompts`).toHaveLength(1);
        for (const field of ['practice', 'conversationPrompt', 'prayTogether', 'safetyNote', 'roles', 'withChildren']) {
          expect(Boolean(translated[field]), `${path}/day ${index + 1}/${field}`).toBe(Boolean(source[field]));
        }
      });
    }
  });
});
