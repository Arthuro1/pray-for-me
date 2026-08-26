import { describe, expect, it } from 'vitest';
import { PLANS, getPlan, plansByCategory, planDayContent } from '../prayerPlans.js';
import { PREPARING_IN_PRAYER } from './preparingInPrayer.js';
import { PREPARING_FOR_COVENANT } from './preparingForCovenant.js';
import { PRAYING_FOR_OUR_MARRIAGE } from './prayingForOurMarriage.js';

describe('Relationships & Family plan family', () => {
  it('registers the three distinct life stages together', () => {
    const relationships = plansByCategory().find((group) => group.id === 'relationships');
    expect(relationships.plans).toEqual(expect.arrayContaining([
      PREPARING_IN_PRAYER, PREPARING_FOR_COVENANT, PRAYING_FOR_OUR_MARRIAGE,
    ]));
    expect(relationships.plans.filter((plan) => ['single', 'engaged', 'married'].includes(plan.lifeStage)))
      .toEqual(expect.arrayContaining([PREPARING_IN_PRAYER, PREPARING_FOR_COVENANT, PRAYING_FOR_OUR_MARRIAGE]));
    expect(new Set(PLANS.map((plan) => plan.id)).size).toBe(PLANS.length);
  });

  it('resolves current content by stable id and version', () => {
    for (const plan of [PREPARING_FOR_COVENANT, PRAYING_FOR_OUR_MARRIAGE]) {
      expect(getPlan(plan.id)).toBe(plan);
      expect(getPlan(plan.id, 1)).toBe(plan);
      expect(getPlan(plan.id, 99)).toBeNull();
      expect(planDayContent(plan.id, 1, plan, 1)).toBe(plan.days[0]);
      expect(planDayContent(plan.id, plan.count + 1, plan, 1)).toBeNull();
    }
  });
});
