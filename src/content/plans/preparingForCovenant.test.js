import { describe, expect, it } from 'vitest';
import { PREPARING_FOR_COVENANT } from './preparingForCovenant.js';
import { LANG_CODES } from '../../i18n.js';
import { usfmFromReference } from '../../lib/bibleRef.js';
import { hasReviewSignoff } from '../../lib/planReview.js';

const plan = PREPARING_FOR_COVENANT;
const overlays = import.meta.glob('./translations/covenant21/*.json', { eager: true });

describe('Preparing for Covenant content contract', () => {
  it('is a review-gated 21-day engaged plan on the shared model', () => {
    expect(plan).toMatchObject({
      id: 'covenant21', category: 'relationships', lifeStage: 'engaged',
      count: 21, version: 1, onboarding: 'engaged',
      review: { status: 'needs_review' },
    });
    // Only the languages whose overlay is real prose are served; the rest fall
    // back to the authored en/fr (see translationQuality.test.js).
    expect(plan.proseTranslations).toEqual(['de', 'es', 'pt', 'ru']);
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
      // The shape hasReviewSignoff() actually reads. A bare string used to
      // gate it only by accident — reading `.status` off a string is undefined,
      // which happened to be "not approved".
      expect(day.roleReviewStatus).toEqual({ status: 'needs_review' });
      expect(hasReviewSignoff(day.roleReviewStatus)).toBe(false);
      expect(Object.keys(day.roles).sort()).toEqual(['husband', 'wife']);
      for (const role of Object.values(day.roles)) expect(usfmFromReference(role.ref), role.ref).toBeTruthy();
    }
  });

  // The gate is applied on the way out of preparingForCovenantDays.js, so a new
  // day given `roles` is review-gated whether or not its author remembered.
  it('gates role prose structurally, not by remembering', () => {
    for (const day of plan.days) {
      if (!day.roles) continue;
      expect(day.roleReviewStatus?.status, 'a day with roles must carry a review record').toBeTruthy();
    }
  });

  // Structure only. A missing field is legitimate — it falls back through
  // pick() to the authored en/fr — so what matters here is that an overlay
  // lines up with the source and never invents content the plan does not have.
  // Whether a served overlay is real prose rather than a repeated frame is
  // checked separately, in translationQuality.test.js.
  it('keeps every overlay aligned with the authored days', () => {
    expect(Object.keys(overlays)).toHaveLength(14);
    for (const [path, mod] of Object.entries(overlays)) {
      const tr = mod.default.covenant21;
      expect(tr.days, path).toHaveLength(21);
      tr.days.forEach((day, index) => {
        const source = plan.days[index];
        for (const field of ['prayTogether', 'safetyNote', 'roles']) {
          if (day[field]) expect(Boolean(source[field]), `${path}/day ${index + 1}/${field} is not in the plan`).toBe(true);
        }
        if (day.prompts) {
          expect(day.prompts.length, `${path}/day ${index + 1}/prompts`).toBeLessThanOrEqual(source.prompts.length);
        }
      });
    }
  });
});
