import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPlan } from '../prayerPlans';
import { LANG_CODES } from '../../i18n';
import { canUsePlan, hasReviewSignoff } from '../../lib/planReview';
import { startGuidedPlan } from '../../lib/startGuidedPlan';
import { PAUL_REREVIEW_PENDING } from './paul20260903';
import { DISCERNMENT_REREVIEW_PENDING } from './paulDiscernment20260903';
import { WISDOM_REREVIEW_PENDING } from './paulWisdom20260908';
import {
  ALTAR_REVIEWED_LOCALES, AT_THE_ALTAR_APPROVAL, PLAN_APPROVAL_PROVENANCE,
  PLAN_REREVIEW_APPROVALS, PLAN_SIGNOFF_20261008, withApprovedPlanRereview,
} from './paulPlanReviews20261008';

afterEach(() => vi.unstubAllEnvs());

const priorNotes = {
  ...PAUL_REREVIEW_PENDING,
  discernment28: DISCERNMENT_REREVIEW_PENDING,
  wisdom42: WISDOM_REREVIEW_PENDING,
};

describe('the explicit user-supplied plan approval on 2026-10-08', () => {
  it('records the supplied reviewer and instruction without claiming a new independent audit', () => {
    expect(PLAN_APPROVAL_PROVENANCE).toEqual({
      approvalId: 'plan-reviews-2026-10-08',
      source: 'explicit-user-instruction',
      instruction: 'approve all that needed human review and sign with Paul',
      reviewer: 'Paul',
      reviewedAt: '2026-10-08',
    });
    expect(hasReviewSignoff(PLAN_SIGNOFF_20261008)).toBe(true);
    expect([...ALTAR_REVIEWED_LOCALES].sort()).toEqual([...LANG_CODES].sort());
    expect(getPlan('zechariah10').review).toBe(AT_THE_ALTAR_APPROVAL);
    for (const lang of ALTAR_REVIEWED_LOCALES) {
      expect(AT_THE_ALTAR_APPROVAL.locales[lang]).toEqual({
        ...PLAN_SIGNOFF_20261008,
        scope: 'current-presentation-including-authored-fallbacks',
      });
    }
  });

  it('starts zechariah10 in production without enabling review preview', async () => {
    vi.stubEnv('DEV', false);
    const addPrayer = vi.fn(async () => 'approved-altar-run');
    expect(await startGuidedPlan({
      plan: getPlan('zechariah10'), lang: 'fr', startDate: '2026-10-08', addPrayer,
    })).toEqual({ ok: true, prayerId: 'approved-altar-run' });
    expect(addPrayer).toHaveBeenCalledOnce();
    expect(addPrayer.mock.calls[0][0].schedule).toMatchObject({
      type: 'recurring', freq: 'daily', end: { kind: 'count', count: 10 },
      plan: { id: 'zechariah10', version: 1, startDate: '2026-10-08' },
    });
  });

  it('still refuses missing sign-offs for every current language and future drafts', () => {
    const plan = getPlan('zechariah10');
    for (const lang of LANG_CODES) {
      const review = { ...plan.review, locales: { ...plan.review.locales, [lang]: null } };
      expect(canUsePlan({ ...plan, review }, { preview: false }), lang).toBe(false);
    }
    for (const field of ['theology', 'safety']) {
      expect(canUsePlan({ ...plan, review: { ...plan.review, [field]: null } }, { preview: false }), field).toBe(false);
    }
    expect(canUsePlan({ id: 'future-plan', review: { status: 'pending' } }, { preview: false })).toBe(false);
  });

  it('resolves only the six exact historical wording notes and keeps their original dates and text', () => {
    expect(Object.keys(PLAN_REREVIEW_APPROVALS).sort()).toEqual([
      'covenant21', 'david12', 'discernment28', 'freedom30', 'marriage30', 'wisdom42',
    ]);
    for (const [id, note] of Object.entries(priorNotes)) {
      const review = getPlan(id).review;
      expect(review.rereviewPending, id).toBeUndefined();
      expect(review.rereviewHistory, id).toEqual([PLAN_REREVIEW_APPROVALS[id]]);
      expect(PLAN_REREVIEW_APPROVALS[id]).toMatchObject({ ...note, ...PLAN_SIGNOFF_20261008 });
      expect(review.theology.reviewedAt, id).toBe(id === 'wisdom42' ? '2026-09-08' : '2026-09-03');
      expect(review.safety.reviewedAt, id).toBe(review.theology.reviewedAt);
      for (const lang of LANG_CODES) expect(review.locales[lang].reviewedAt, `${id}/${lang}`).toBe(review.theology.reviewedAt);
      expect(canUsePlan(getPlan(id), { preview: false }), id).toBe(true);
    }
  });

  it('does not resolve a new plan, version, date or changed wording note by default', () => {
    const current = getPlan('covenant21').review;
    const pending = { ...current, rereviewPending: priorNotes.covenant21 };
    const resolved = withApprovedPlanRereview('covenant21', pending);
    expect(resolved.rereviewPending).toBeUndefined();
    expect(resolved.theology).toBe(pending.theology);
    expect(resolved.safety).toBe(pending.safety);
    expect(resolved.locales).toBe(pending.locales);
    expect(pending.rereviewPending).toBe(priorNotes.covenant21);
    expect(withApprovedPlanRereview('future-plan', pending)).toBe(pending);
    for (const future of [
      { ...pending, contentVersion: 2 },
      { ...pending, rereviewPending: { ...pending.rereviewPending, since: '2026-10-09' } },
      { ...pending, rereviewPending: { ...pending.rereviewPending, changed: 'Additional unreviewed wording.' } },
    ]) expect(withApprovedPlanRereview('covenant21', future)).toBe(future);
    expect(withApprovedPlanRereview('covenant21', current)).toBe(current);
  });
});
