import { describe, expect, it } from 'vitest';
import { PREPARING_FOR_COVENANT } from './preparingForCovenant.js';
import { LANG_CODES } from '../../i18n.js';
import { usfmFromReference } from '../../lib/bibleRef.js';

const plan = PREPARING_FOR_COVENANT;
const overlays = import.meta.glob('./translations/covenant21/*.json', { eager: true });

describe('Preparing for Covenant content contract', () => {
  it('is a review-gated 21-day engaged plan on the shared model', () => {
    expect(plan).toMatchObject({
      id: 'covenant21', category: 'relationships', lifeStage: 'engaged',
      count: 21, version: 1, onboarding: 'engaged', proseTranslations: true,
      review: { status: 'needs_review' },
    });
    expect(plan.days).toHaveLength(21);
    expect(plan.analyticsEvents).toEqual({
      started: 'engaged_plan_started',
      dayCompleted: 'engaged_plan_day_completed',
      completed: 'engaged_plan_completed',
    });
  });

  it('keeps Scripture as references and authors every title in all locales', () => {
    for (const day of plan.days) {
      expect(usfmFromReference(day.ref), day.ref).toBeTruthy();
      for (const ref of day.related) expect(usfmFromReference(ref), ref).toBeTruthy();
      for (const code of LANG_CODES) expect(day.theme[code], `${day.theme.en}/${code}`).toBeTruthy();
      expect(day.prompts).toHaveLength(3);
      expect(day.conversationPrompt.en && day.conversationPrompt.fr).toBeTruthy();
    }
  });

  it('uses only the gender-neutral partner token and review-gates role prose', () => {
    const prose = JSON.stringify(plan);
    expect(prose).not.toMatch(/\{(fiance|fiancee|husband|wife|he|she)\}/i);
    expect(plan.days.filter((day) => day.roles)).toHaveLength(1);
    for (const day of plan.days.filter((item) => item.roles)) {
      expect(day.roleReviewStatus).toBe('needs_review');
      expect(Object.keys(day.roles).sort()).toEqual(['husband', 'wife']);
      for (const role of Object.values(day.roles)) expect(usfmFromReference(role.ref), role.ref).toBeTruthy();
    }
  });

  it('ships complete prose overlays for all 14 non-English/French locales', () => {
    expect(Object.keys(overlays)).toHaveLength(14);
    for (const [path, mod] of Object.entries(overlays)) {
      const tr = mod.default.covenant21;
      expect(tr.days, path).toHaveLength(21);
      tr.days.forEach((day, index) => {
        const source = plan.days[index];
        for (const field of ['reflection', 'selfPrompt', 'practice', 'conversationPrompt']) {
          expect(day[field], `${path}/day ${index + 1}/${field}`).toBeTruthy();
        }
        expect(day.prompts, `${path}/day ${index + 1}/prompts`).toHaveLength(3);
        for (const field of ['prayTogether', 'safetyNote', 'roles']) {
          expect(Boolean(day[field]), `${path}/day ${index + 1}/${field}`).toBe(Boolean(source[field]));
        }
      });
    }
  });
});
