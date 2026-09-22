// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { PLANS } from '../content/prayerPlans';
import { isPlanReviewed } from './planReview';
import {
  hasPendingPlanJoin,
  isPlanShareable,
  isPlanSharePath,
  parsePlanSharePath,
  planShareUrl,
  savePendingPlanJoin,
  takePendingPlanJoin,
} from './planShareLink';

const TOKEN = 'AbCdEfGhIjKlMnOpQrSt_-';

describe('parsePlanSharePath', () => {
  it('reads the plan and the sharer token', () => {
    expect(parsePlanSharePath(`/plans/altar7/${TOKEN}`)).toEqual({ planId: 'altar7', token: TOKEN });
  });

  it('accepts a plain plan link without a token', () => {
    expect(parsePlanSharePath('/plans/altar7')).toEqual({ planId: 'altar7', token: null });
    expect(parsePlanSharePath('/plans/altar7/')).toEqual({ planId: 'altar7', token: null });
  });

  it('rejects anything that is not a plan link', () => {
    expect(parsePlanSharePath('/plan')).toBe(null);
    expect(parsePlanSharePath('/plans')).toBe(null);
    expect(parsePlanSharePath('/plans/altar7/short')).toBe(null);
    expect(parsePlanSharePath('/plans/al tar/x')).toBe(null);
    expect(parsePlanSharePath(`/plans/altar7/${TOKEN}/extra`)).toBe(null);
    expect(parsePlanSharePath(undefined)).toBe(null);
    expect(isPlanSharePath('/community/join/ABC')).toBe(false);
  });
});

describe('planShareUrl', () => {
  it('puts plan and token in the path and the preview language in the query', () => {
    expect(planShareUrl({ origin: 'https://praystead.com', planId: 'altar7', token: TOKEN, lang: 'fr' }))
      .toBe(`https://praystead.com/plans/altar7/${TOKEN}?lang=fr`);
  });

  it('falls back to a plain plan link', () => {
    expect(planShareUrl({ origin: 'https://praystead.com', planId: 'altar7' })).toBe('https://praystead.com/plans/altar7');
  });

  it('round-trips through the parser', () => {
    const url = new URL(planShareUrl({ origin: 'https://praystead.com', planId: 'fast3', token: TOKEN, lang: 'ar' }));
    expect(parsePlanSharePath(url.pathname)).toEqual({ planId: 'fast3', token: TOKEN });
  });
});

describe('isPlanShareable', () => {
  it('lets out only plans that passed their sign-off, never a draft', () => {
    for (const plan of PLANS) expect(isPlanShareable(plan)).toBe(isPlanReviewed(plan));
    expect(isPlanShareable({ id: 'draft', review: { status: 'draft' } })).toBe(false);
    expect(isPlanShareable(null)).toBe(false);
  });
});

describe('pending plan join', () => {
  beforeEach(() => localStorage.clear());

  it('carries the plan, token and start day across sign-up, once', () => {
    savePendingPlanJoin({ planId: 'altar7', token: TOKEN, startDate: '2026-09-25' });
    expect(hasPendingPlanJoin()).toBe(true);
    expect(takePendingPlanJoin('altar7')).toEqual({ planId: 'altar7', token: TOKEN, startDate: '2026-09-25' });
    expect(takePendingPlanJoin('altar7')).toBe(null);
    expect(hasPendingPlanJoin()).toBe(false);
  });

  it('leaves a join for another plan untouched', () => {
    savePendingPlanJoin({ planId: 'altar7', token: null, startDate: '2026-09-25' });
    expect(takePendingPlanJoin('fast3')).toBe(null);
    expect(takePendingPlanJoin('altar7')).toMatchObject({ planId: 'altar7', token: null });
  });

  it('goes stale after a week', () => {
    const saved = Date.UTC(2026, 8, 1);
    savePendingPlanJoin({ planId: 'altar7', startDate: '2026-09-01' }, saved);
    expect(hasPendingPlanJoin(saved + 6 * 86400000)).toBe(true);
    expect(hasPendingPlanJoin(saved + 8 * 86400000)).toBe(false);
    expect(takePendingPlanJoin('altar7', saved + 8 * 86400000)).toBe(null);
  });

  it('survives garbage in storage', () => {
    localStorage.setItem('pfm_pending_plan_join', '{not json');
    expect(hasPendingPlanJoin()).toBe(false);
    expect(takePendingPlanJoin('altar7')).toBe(null);
  });
});
