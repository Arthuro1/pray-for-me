import { describe, it, expect } from 'vitest';
import { planById, buildGuidedPlanPrayer } from './guidedPlan.js';
import { PLANS } from '../content/prayerPlans.js';

describe('planById', () => {
  it('finds a known plan by content id', () => {
    const plan = planById('fast3');
    expect(plan).toBeTruthy();
    expect(plan.id).toBe('fast3');
    expect(plan.count).toBe(3);
  });

  it('returns null for an unknown id', () => {
    expect(planById('nope')).toBeNull();
    expect(planById(undefined)).toBeNull();
  });

  it('resolves every shipped plan', () => {
    for (const p of PLANS) expect(planById(p.id)).toBe(p);
  });
});

describe('buildGuidedPlanPrayer', () => {
  const plan = planById('altar7'); // count 7

  it('builds a count-capped daily recurring prayer that carries the plan link', () => {
    const prayer = buildGuidedPlanPrayer(plan, '2026-08-01', 'fr');
    expect(prayer.schedule).toEqual({
      type: 'recurring',
      freq: 'daily',
      startDate: '2026-08-01',
      end: { kind: 'count', count: 7 },
      plan: { id: 'altar7', startDate: '2026-08-01' },
    });
    expect(prayer.categoryIds).toEqual([]);
    // Title/description are resolved strings (fr fallback locale is always loaded).
    expect(typeof prayer.title).toBe('string');
    expect(prayer.title.length).toBeGreaterThan(0);
  });

  it('defaults the start date to today when none is given', () => {
    const prayer = buildGuidedPlanPrayer(plan, undefined, 'fr');
    expect(prayer.schedule.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(prayer.schedule.plan.startDate).toBe(prayer.schedule.startDate);
  });

  it('pins every versioned plan to its authored content version', () => {
    for (const versionedPlan of PLANS.filter((candidate) => candidate.version)) {
      const prayer = buildGuidedPlanPrayer(versionedPlan, '2026-08-01', 'fr');
      expect(prayer.schedule.plan.version).toBe(versionedPlan.version);
    }
  });
});
