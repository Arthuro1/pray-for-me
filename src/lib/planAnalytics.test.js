// The plan discovery funnel may say where a person came from and which day they
// walked — never which plan, and nothing at all about a plan whose very choice
// is personal (the relationship and deliverance plans).
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./analytics', async (importOriginal) => ({ ...(await importOriginal()), track: vi.fn() }));

import { EVENTS, track } from './analytics';
import {
  PLAN_SOURCES,
  planSource,
  trackPlanDayCompleted,
  trackPlanDetailOpened,
  trackPlanStarted,
  trackPlansPageViewed,
} from './planAnalytics';
import { PLANS } from '../content/prayerPlans';

const plain = PLANS.find((plan) => plan.id === 'gratitude7');
const personal = PLANS.filter((plan) => plan.analyticsEvents);

beforeEach(() => vi.mocked(track).mockClear());

describe('plan funnel events', () => {
  it('says where a start came from — and never which plan', () => {
    trackPlanStarted(plain, PLAN_SOURCES.TODAY_CARD);
    expect(track).toHaveBeenCalledWith(EVENTS.PLAN_STARTED, { source: 'today_card' });
  });

  it('reports the day walked for an ordinary plan', () => {
    trackPlanDayCompleted(plain, 2);
    expect(track).toHaveBeenCalledWith(EVENTS.PLAN_DAY_COMPLETED, { day: 2 });
  });

  it('drops a day number that is not a real day', () => {
    trackPlanDayCompleted(plain, null);
    trackPlanDayCompleted(plain, 0);
    expect(track.mock.calls).toEqual([[EVENTS.PLAN_DAY_COMPLETED, undefined], [EVENTS.PLAN_DAY_COMPLETED, undefined]]);
  });

  it('counts every personal plan without describing it at all', () => {
    expect(personal.map((plan) => plan.id)).toEqual(
      expect.arrayContaining(['preparing21', 'covenant21', 'marriage30', 'freedom30']),
    );
    for (const plan of personal) {
      trackPlanStarted(plan, PLAN_SOURCES.TAB);
      trackPlanDetailOpened(plan, PLAN_SOURCES.TODAY_CARD);
      trackPlanDayCompleted(plan, 7);
    }
    expect(track).toHaveBeenCalledTimes(personal.length * 3);
    for (const [, props] of track.mock.calls) expect(props).toBeUndefined();
  });

  it('only ever sends one of its own fixed source words', () => {
    trackPlansPageViewed('https://example.org/?q=private');
    expect(track).toHaveBeenCalledWith(EVENTS.PLANS_PAGE_VIEWED, { source: 'direct' });
    expect(planSource(undefined)).toBe('direct');
    expect(planSource('group')).toBe('group');
  });
});
