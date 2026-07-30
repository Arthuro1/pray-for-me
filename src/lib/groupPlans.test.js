import { describe, it, expect } from 'vitest';
import { groupPlanStatus, sortGroupPlans, prayingLabel } from './groupPlans.js';

describe('groupPlanStatus', () => {
  it('is running once the start day has arrived (today counts as running)', () => {
    expect(groupPlanStatus('2026-07-30', '2026-07-30')).toBe('running');
    expect(groupPlanStatus('2026-07-01', '2026-07-30')).toBe('running');
  });

  it('is upcoming while the start day is still in the future', () => {
    expect(groupPlanStatus('2026-08-05', '2026-07-30')).toBe('upcoming');
  });

  it('treats a missing start date as upcoming rather than throwing', () => {
    expect(groupPlanStatus(undefined, '2026-07-30')).toBe('upcoming');
  });
});

describe('sortGroupPlans', () => {
  const today = '2026-07-30';

  it('puts running plans before upcoming ones', () => {
    const plans = [
      { plan_id: 'up', start_date: '2026-08-10' },
      { plan_id: 'now', start_date: '2026-07-20' },
    ];
    expect(sortGroupPlans(plans, today).map((p) => p.plan_id)).toEqual(['now', 'up']);
  });

  it('orders within each bucket by start date ascending', () => {
    const plans = [
      { plan_id: 'up-late', start_date: '2026-09-01' },
      { plan_id: 'now-late', start_date: '2026-07-29' },
      { plan_id: 'up-soon', start_date: '2026-08-02' },
      { plan_id: 'now-early', start_date: '2026-07-01' },
    ];
    expect(sortGroupPlans(plans, today).map((p) => p.plan_id))
      .toEqual(['now-early', 'now-late', 'up-soon', 'up-late']);
  });

  it('does not mutate the input array', () => {
    const plans = [
      { plan_id: 'up', start_date: '2026-08-10' },
      { plan_id: 'now', start_date: '2026-07-20' },
    ];
    const before = plans.map((p) => p.plan_id);
    sortGroupPlans(plans, today);
    expect(plans.map((p) => p.plan_id)).toEqual(before);
  });
});

describe('prayingLabel', () => {
  it('nudges when nobody has joined yet', () => {
    expect(prayingLabel({ count: 0, joinedByMe: false })).toEqual({ key: 'groupPlanCountNone', vars: {} });
  });

  it('counts others when the viewer has not joined', () => {
    expect(prayingLabel({ count: 3, joinedByMe: false })).toEqual({ key: 'groupPlanCountOthers', vars: { n: 3 } });
  });

  it('says "just you" when the viewer is the only one praying', () => {
    expect(prayingLabel({ count: 1, joinedByMe: true })).toEqual({ key: 'groupPlanCountJustYou', vars: {} });
  });

  it('counts the OTHERS (viewer excluded) when the viewer has joined', () => {
    expect(prayingLabel({ count: 4, joinedByMe: true })).toEqual({ key: 'groupPlanCountYouPlus', vars: { n: 3 } });
  });

  it('is defensive about a joined viewer with an under-counted total', () => {
    expect(prayingLabel({ count: 0, joinedByMe: true })).toEqual({ key: 'groupPlanCountJustYou', vars: {} });
  });

  it('has a sensible default with no arguments', () => {
    expect(prayingLabel()).toEqual({ key: 'groupPlanCountNone', vars: {} });
  });
});
