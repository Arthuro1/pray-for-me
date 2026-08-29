// The catalogue itself: every plan in PLANS must be reachable by a reader.
//
// Visibility and launch eligibility are deliberately separate here. A plan
// awaiting review still belongs in the catalogue — the reader discovers it and
// is told why it is not available yet — while canUsePlan() holds the line at
// the detail, start and day-content boundaries. So the one thing this module
// must never do is drop a plan on the floor.
import { describe, it, expect } from 'vitest';
import { PLANS, PLAN_CATEGORIES, DEFAULT_PLAN_CATEGORY, plansByCategory } from './prayerPlans.js';

const listed = (plans) => plansByCategory(plans).flatMap((group) => group.plans.map((p) => p.id));

describe('plansByCategory', () => {
  it('lists every shipped plan exactly once', () => {
    const ids = listed(PLANS);
    expect(ids.slice().sort()).toEqual(PLANS.map((p) => p.id).slice().sort());
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lists plans still awaiting review, so they can be found and explained', () => {
    const pending = PLANS.filter((p) => p.review?.status === 'needs_review');
    expect(pending.length).toBeGreaterThan(0); // guards the premise of this test
    for (const plan of pending) expect(listed(PLANS), plan.id).toContain(plan.id);
  });

  // Matching on the raw category value meant one typo — or a category retired
  // from PLAN_CATEGORIES later — removed the plan from every group and so from
  // the catalogue entirely, with nothing in the UI to show it had gone.
  it('keeps a plan whose category is unknown instead of dropping it', () => {
    const orphan = { ...PLANS[0], id: 'orphan-plan', category: 'no-such-category' };
    const groups = plansByCategory([orphan]);

    expect(listed([orphan])).toEqual(['orphan-plan']);
    expect(groups.find((g) => g.plans.some((p) => p.id === 'orphan-plan')).id).toBe(DEFAULT_PLAN_CATEGORY);
  });

  it('still groups a plan that names no category at all', () => {
    const uncategorized = { ...PLANS[0], id: 'no-category-plan', category: undefined };
    expect(listed([uncategorized])).toEqual(['no-category-plan']);
  });

  it('drops headings that have nothing under them', () => {
    expect(plansByCategory([])).toEqual([]);
    const groups = plansByCategory([PLANS.find((p) => p.category === 'freedom')]);
    expect(groups.map((g) => g.id)).toEqual(['freedom']);
  });

  it('only ever emits known category ids', () => {
    const known = new Set(PLAN_CATEGORIES.map((c) => c.id));
    for (const group of plansByCategory(PLANS)) expect(known.has(group.id)).toBe(true);
  });
});
