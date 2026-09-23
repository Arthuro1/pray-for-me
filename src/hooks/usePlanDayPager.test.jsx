// @vitest-environment jsdom
//
// Every plan in the catalogue, paged end to end the way a reader does it: from
// the day on screen, one arrow at a time. Pausing or re-pacing a run moves its
// pattern's start to the day of the change, and the pager used to walk only
// that pattern — so a run paused on day 4 and resumed later could never be
// paged back past day 4 again. What must hold for every plan: every day from 1
// to the last is reached, in order, exactly once, in both directions.
import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { PLANS } from '../content/prayerPlans';
import { buildGuidedPlanPrayer } from '../lib/guidedPlan';
import { addDays, isPlanDay, planDayNumber, restingPlanDay } from '../lib/schedule';
import { PLAN_PAUSED, repacePlan } from '../lib/planTempo';
import { usePlanDayPager } from './usePlanDayPager';

const START = '2026-09-03';
const RESUMED = addDays(START, 17); // a fortnight's break, as on the run reported

afterEach(cleanup);

// Follow one arrow from a day until there is nowhere left to go, returning the
// day numbers reached. Every step must land on a real day of the run.
function walk(schedule, total, from, direction) {
  const at = (dayKey) => ({ dayKey, dayNo: planDayNumber(schedule, dayKey) });
  const { result, rerender } = renderHook(
    ({ dayKey, dayNo }) => usePlanDayPager(schedule, {}, dayKey, dayNo, total),
    { initialProps: from },
  );
  const reached = [from.dayNo];
  for (let step = 0; step <= total; step++) {
    const key = result.current[direction === 'back' ? 'prevKey' : 'nextKey'];
    if (!key) break;
    expect(isPlanDay(schedule, key), key).toBe(true);
    const day = at(key);
    reached.push(day.dayNo);
    rerender(day);
  }
  return reached;
}

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// A fresh run of the plan, exactly as starting it from the Plan tab builds it.
const freshRun = (plan) => buildGuidedPlanPrayer(plan, START, 'en').schedule;

// Paused just before day 4 (or the last day of a shorter plan), resumed later.
function pausedAndResumed(plan) {
  const pauseOn = addDays(START, Math.min(3, plan.count - 1));
  const paused = repacePlan(freshRun(plan), PLAN_PAUSED, { today: pauseOn, total: plan.count });
  return { paused, resumed: repacePlan(paused, 'daily', { today: RESUMED, total: plan.count }) };
}

describe.each(PLANS.map((plan) => [plan.id, plan]))('paging through %s', (_, plan) => {
  const total = plan.count;

  it('reaches every day on a run that was never re-paced', () => {
    const run = freshRun(plan);
    const last = { dayKey: addDays(START, total - 1), dayNo: total };
    expect(walk(run, total, last, 'back')).toEqual(range(1, total).reverse());
    expect(walk(run, total, { dayKey: START, dayNo: 1 }, 'forward')).toEqual(range(1, total));
  });

  it('reaches back to day 1 after a pause, and forward again to the last day', () => {
    const { resumed } = pausedAndResumed(plan);
    const firstAfter = { dayKey: RESUMED, dayNo: planDayNumber(resumed, RESUMED) };
    expect(walk(resumed, total, firstAfter, 'back')).toEqual(range(1, firstAfter.dayNo).reverse());
    expect(walk(resumed, total, { dayKey: START, dayNo: 1 }, 'forward')).toEqual(range(1, total));
  });

  it('does the same for a run re-paced before its walked days were recorded', () => {
    const { resumed } = pausedAndResumed(plan);
    const legacy = { ...resumed, plan: { ...resumed.plan, walked: undefined } };
    const firstAfter = { dayKey: RESUMED, dayNo: planDayNumber(legacy, RESUMED) };
    expect(walk(legacy, total, firstAfter, 'back')).toEqual(range(1, firstAfter.dayNo).reverse());
  });

  it('pages back from the day a paused run is holding, which has no date', () => {
    const { paused } = pausedAndResumed(plan);
    const holding = restingPlanDay(paused, RESUMED);
    expect(holding.dayKey).toBe(null);
    expect(walk(paused, total, holding, 'back')).toEqual(range(1, holding.dayNo).reverse());
  });
});
