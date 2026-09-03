import { afterEach, describe, expect, it, vi } from 'vitest';
import { PLANS, getPlan } from '../prayerPlans';
import { RESOURCES } from '../resources/catalogue';
import { LANG_CODES } from '../../i18n';
import { canUsePlan, hasReviewSignoff, isPlanReviewed } from '../../lib/planReview';
import { resolveResources } from '../../lib/resources';
import { startGuidedPlan } from '../../lib/startGuidedPlan';
import {
  REVIEWED_PLAN_IDS, REVIEWED_LOCALES, PLAN_APPROVALS, PAUL_PLAN_SIGNOFF,
  PAUL_RESOURCE_SIGNOFF, APPROVED_RESOURCE_IDS, CONTENT_ONLY_RESOURCE_IDS,
} from './paul20260903';

afterEach(() => vi.unstubAllEnvs());

describe('Paul’s explicit 2026-09-03 approval', () => {
  it('approves exactly the four existing version-one plans and sixteen presentations', () => {
    expect(REVIEWED_PLAN_IDS).toEqual(['covenant21', 'marriage30', 'freedom30', 'david12']);
    expect([...REVIEWED_LOCALES].sort()).toEqual([...LANG_CODES].sort());
    for (const id of REVIEWED_PLAN_IDS) {
      const plan = getPlan(id);
      expect(plan.review).toBe(PLAN_APPROVALS[id]);
      expect(plan.version).toBe(plan.review.contentVersion);
      expect(plan.version).toBe(1);
      expect(plan.review.theology).toEqual(PAUL_PLAN_SIGNOFF);
      expect(plan.review.safety).toEqual(PAUL_PLAN_SIGNOFF);
      for (const lang of LANG_CODES) expect(hasReviewSignoff(plan.review.locales[lang])).toBe(true);
      expect(isPlanReviewed(plan)).toBe(true);
      expect(canUsePlan(plan, { preview: false })).toBe(true);
    }
    expect(PLANS.filter((plan) => !isPlanReviewed(plan))).toEqual([]);
  });

  it('records the three optional role approvals without auto-enabling unfinished overlays', () => {
    const roleDays = REVIEWED_PLAN_IDS.flatMap((id) => getPlan(id).days.filter((day) => day.roles));
    expect(roleDays).toHaveLength(3);
    roleDays.forEach((day) => expect(day.roleReviewStatus).toEqual(PAUL_PLAN_SIGNOFF));
    expect(getPlan('covenant21').proseTranslations).toEqual(['de', 'es', 'pt', 'ru']);
    for (const id of ['marriage30', 'freedom30', 'david12']) expect(getPlan(id).proseTranslations).toEqual([]);
  });

  it('starts each approved plan through the ordinary action with preview disabled', async () => {
    vi.stubEnv('DEV', false);
    for (const id of REVIEWED_PLAN_IDS) {
      const plan = getPlan(id);
      const addPrayer = vi.fn(async () => 'new-run');
      expect(await startGuidedPlan({ plan, startDate: '2026-09-03', lang: 'fr', addPrayer }))
        .toEqual({ ok: true, prayerId: 'new-run' });
      expect(addPrayer).toHaveBeenCalledOnce();
      expect(addPrayer.mock.calls[0][0].schedule).toMatchObject({
        type: 'recurring', freq: 'daily', end: { kind: 'count', count: plan.count },
        plan: { id, version: 1, startDate: '2026-09-03' },
      });
    }
  });

  it('still refuses a future draft, a missing safety approval or an unsigned locale', () => {
    const plan = getPlan('david12');
    const variants = [
      { ...plan, id: 'future-plan', review: { status: 'needs_review' } },
      { ...plan, review: { ...plan.review, safety: null } },
      { ...plan, review: { ...plan.review, locales: { ...plan.review.locales, ar: null } } },
    ];
    variants.forEach((draft) => expect(canUsePlan(draft, { preview: false })).toBe(false));
  });

  it('publishes the 36 verified associated resources with both named records', () => {
    expect(APPROVED_RESOURCE_IDS).toHaveLength(36);
    for (const id of APPROVED_RESOURCE_IDS) {
      const resource = RESOURCES.find((entry) => entry.id === id);
      expect(resource.status, id).toBe('approved');
      expect(resource.contentReview).toEqual(PAUL_RESOURCE_SIGNOFF);
      expect(resource.safetyReview).toEqual(PAUL_RESOURCE_SIGNOFF);
      const rows = resolveResources({ topics: resource.topics, languages: Object.keys(resource.editions), catalogue: [resource] });
      expect(rows.map((row) => row.id), id).toEqual([id]);
    }
    // Later same-day approvals have their own approvalId and audit record.
    const newlySigned = RESOURCES.filter((entry) => entry.contentReview?.reviewedAt === '2026-09-03'
      && !entry.contentReview.approvalId).map((entry) => entry.id).sort();
    expect(newlySigned).toEqual([...APPROVED_RESOURCE_IDS, ...CONTENT_ONLY_RESOURCE_IDS].sort());
  });

  it('keeps five unavailable editions, out-of-scope candidates and retired material hidden', () => {
    expect(CONTENT_ONLY_RESOURCE_IDS).toHaveLength(5);
    for (const id of CONTENT_ONLY_RESOURCE_IDS) {
      const resource = RESOURCES.find((entry) => entry.id === id);
      expect(resource.status).toBe('needs_review');
      expect(resource.contentReview).toEqual(PAUL_RESOURCE_SIGNOFF);
      expect(resource.safetyReview).toEqual(PAUL_RESOURCE_SIGNOFF);
      expect(resolveResources({ topics: resource.topics, languages: Object.keys(resource.editions), catalogue: [resource] })).toEqual([]);
    }
    const outside = RESOURCES.find((entry) => entry.id === 'jouvet-du-celibat-vie-couple');
    expect(outside.status).toBe('needs_review');
    expect(outside.contentReview).toBeUndefined();
    expect(RESOURCES.find((entry) => entry.id === 'berger-mit-offenen-augen-lieben').status).toBe('retired');
  });
});
