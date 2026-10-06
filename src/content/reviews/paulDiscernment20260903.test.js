import { afterEach, describe, expect, it, vi } from 'vitest';
import plan from '../plans/discerningBeforeCommitment';
import { RESOURCES } from '../resources/catalogue';
import { LANG_CODES, loadLocale } from '../../i18n';
import { canUsePlan, hasReviewSignoff } from '../../lib/planReview';
import { startGuidedPlan } from '../../lib/startGuidedPlan';
import { availableResourceLanguages, isResourceApprovedForDisplay, resolveResources } from '../../lib/resources';
import { REVIEWED_PLAN_IDS } from './paul20260903';
import {
  DISCERNMENT_PLAN_APPROVAL, DISCERNMENT_REVIEWED_LOCALES, DISCERNMENT_PLAN_SIGNOFF,
  DISCERNMENT_RESOURCE_IDS, DISCERNMENT_NEW_RESOURCE_IDS, DISCERNMENT_RESOURCE_SIGNOFF,
} from './paulDiscernment20260903';

afterEach(() => vi.unstubAllEnvs());

describe('Paul’s explicit approval of the discernment plan and selection', () => {
  it('approves version one and exactly the current sixteen complete translations', () => {
    expect(plan.review).toBe(DISCERNMENT_PLAN_APPROVAL);
    expect(plan.version).toBe(plan.review.contentVersion);
    expect(plan.review.theology).toEqual(DISCERNMENT_PLAN_SIGNOFF);
    expect(plan.review.safety).toEqual(DISCERNMENT_PLAN_SIGNOFF);
    expect([...DISCERNMENT_REVIEWED_LOCALES].sort()).toEqual([...LANG_CODES].sort());
    for (const lang of LANG_CODES) {
      expect(hasReviewSignoff(plan.review.locales[lang]), lang).toBe(true);
      expect(plan.review.locales[lang].scope).toBe('current-complete-translation');
    }
    expect(REVIEWED_PLAN_IDS).not.toContain(plan.id);
    expect(canUsePlan(plan, { preview: false })).toBe(true);
  });

  it.each(['de', 'fa'])('starts the 28-day plan in %s without a review-preview flag', async (lang) => {
    vi.stubEnv('DEV', false);
    await loadLocale(lang);
    const addPrayer = vi.fn(async () => 'approved-discernment-run');
    expect(await startGuidedPlan({ plan, lang, startDate: '2026-09-03', addPrayer }))
      .toEqual({ ok: true, prayerId: 'approved-discernment-run' });
    expect(addPrayer).toHaveBeenCalledOnce();
    expect(addPrayer.mock.calls[0][0].schedule).toMatchObject({
      type: 'recurring', freq: 'daily', end: { kind: 'count', count: 28 },
      plan: { id: 'discernment28', version: 1, startDate: '2026-09-03' },
    });
  });

  it('requires safety and every locale sign-off even after this approval', () => {
    for (const review of [
      { status: 'draft' },
      { ...plan.review, safety: null },
      { ...plan.review, locales: { ...plan.review.locales, fa: null } },
    ]) expect(canUsePlan({ ...plan, review }, { preview: false })).toBe(false);
  });

  it('makes the thirteen selected resources available through the ordinary day resolver', () => {
    expect(DISCERNMENT_RESOURCE_IDS).toHaveLength(13);
    const resources = DISCERNMENT_RESOURCE_IDS.map((id) => RESOURCES.find((entry) => entry.id === id));
    for (const resource of resources) {
      expect(resource).toBeTruthy();
      expect(isResourceApprovedForDisplay(resource), resource.id).toBe(true);
      expect(resource.contentReview.reviewedBy).toBe('Paul');
      expect(resource.safetyReview.reviewedBy).toBe('Paul');
      const matches = resolveResources({
        catalogue: [resource], topics: plan.days.flatMap((day) => day.resourceTopics),
        domains: plan.resourceDomains, lifeStage: plan.lifeStage, languages: LANG_CODES,
      });
      expect(matches.map((entry) => entry.id), resource.id).toEqual([resource.id]);
    }
    expect(DISCERNMENT_NEW_RESOURCE_IDS).toHaveLength(7);
    for (const id of DISCERNMENT_NEW_RESOURCE_IDS) {
      const resource = RESOURCES.find((entry) => entry.id === id);
      expect(resource.contentReview).toEqual(DISCERNMENT_RESOURCE_SIGNOFF);
      expect(resource.safetyReview).toEqual(DISCERNMENT_RESOURCE_SIGNOFF);
    }
  });

  it('serves the verified Persian article without an English fallback', () => {
    expect(availableResourceLanguages()).toContain('fa');
    const rows = resolveResources({
      topics: plan.days[25].resourceTopics, lifeStage: plan.lifeStage,
      domains: plan.resourceDomains, languages: ['fa'],
    });
    expect(rows).toContainEqual(expect.objectContaining({ id: 'gotquestions-found-spouse', lang: 'fa', isFallback: false }));
    const article = RESOURCES.find((entry) => entry.id === 'gotquestions-found-spouse');
    const unavailable = { ...article, editions: { fa: { ...article.editions.fa, available: false } } };
    expect(resolveResources({ topics: article.topics, languages: ['fa'], catalogue: [unavailable] })).toEqual([]);
  });
});
