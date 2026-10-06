import { describe, expect, it } from 'vitest';
import {
  CIRCLES,
  CIRCLE_DEFINITIONS,
  circleOf,
  circlesWithin,
  groupByCircle,
  isCircle,
  normalizeCircle,
  planCircles,
} from './circles';
import { PLANS } from '../content/prayerPlans';

describe('the canonical Intercession Circles', () => {
  it('keeps the seven stable ids in their inner-to-outer order', () => {
    // Persisted inside encrypted prayers: renaming one is a data migration.
    expect(CIRCLES).toEqual(['self', 'household', 'people', 'church', 'authorities', 'nations', 'kingdom']);
    expect(Object.isFrozen(CIRCLES)).toBe(true);
  });

  it('derives every definition from the one list', () => {
    expect(Object.keys(CIRCLE_DEFINITIONS)).toEqual(CIRCLES);
    CIRCLES.forEach((id, order) => {
      expect(CIRCLE_DEFINITIONS[id]).toEqual({
        id, order, labelKey: `circle_${id}`, descKey: `circleDesc_${id}`, promptKey: `circlePrompt_${id}`,
      });
    });
  });

  it('reads anything that is not a circle as unplaced', () => {
    for (const value of [undefined, null, '', 'Self', 'galaxies', 'toString', 3, {}]) {
      expect(isCircle(value)).toBe(false);
      expect(normalizeCircle(value)).toBeNull();
      expect(circleOf({ circle: value })).toBeNull();
    }
    expect(circleOf(null)).toBeNull();
    expect(circleOf({})).toBeNull(); // an older prayer, written before circles existed
    expect(circleOf({ circle: 'church' })).toBe('church');
  });

  it('reaches from the heart outward', () => {
    expect(circlesWithin('self')).toEqual(['self']);
    expect(circlesWithin('household')).toEqual(['self', 'household']);
    expect(circlesWithin('nations')).toEqual(CIRCLES.slice(0, 6));
    expect(circlesWithin('kingdom')).toEqual(CIRCLES);
    expect(circlesWithin('nope')).toEqual([]);
  });

  it('groups prayers in canonical order with unplaced prayers last', () => {
    const prayers = [
      { id: 'a', circle: 'kingdom' },
      { id: 'b' },
      { id: 'c', circle: 'self' },
      { id: 'd', circle: 'bogus' },
      { id: 'e', circle: 'self' },
    ];
    expect(groupByCircle(prayers)).toEqual([
      { circle: 'self', prayers: [prayers[2], prayers[4]] },
      { circle: 'kingdom', prayers: [prayers[0]] },
      { circle: null, prayers: [prayers[1], prayers[3]] },
    ]);
    expect(groupByCircle([])).toEqual([]);
    expect(groupByCircle(undefined)).toEqual([]);
  });
});

describe('planCircles', () => {
  it('reads a plan with one circle', () => {
    expect(planCircles({ primaryCircle: 'self', circles: ['self'] })).toEqual({ primary: 'self', circles: ['self'] });
  });

  it('reads a plan with several circles, primary first', () => {
    expect(planCircles({ primaryCircle: 'kingdom', circles: ['church', 'kingdom', 'nations'] }))
      .toEqual({ primary: 'kingdom', circles: ['kingdom', 'church', 'nations'] });
  });

  it('treats missing or unknown metadata as no circle, never as an error', () => {
    expect(planCircles({})).toEqual({ primary: null, circles: [] });
    expect(planCircles(undefined)).toEqual({ primary: null, circles: [] });
    expect(planCircles({ primaryCircle: null, circles: [] })).toEqual({ primary: null, circles: [] });
    expect(planCircles({ primaryCircle: 'galaxies', circles: 'self' })).toEqual({ primary: null, circles: [] });
  });

  it('falls back to the first listed circle and drops unknown or repeated ones', () => {
    expect(planCircles({ circles: ['bogus', 'people', 'people', 'kingdom'] }))
      .toEqual({ primary: 'people', circles: ['people', 'kingdom'] });
  });

  it('every registered plan carries valid metadata or none at all', () => {
    for (const plan of PLANS) {
      if (plan.primaryCircle === undefined && plan.circles === undefined) continue;
      expect(isCircle(plan.primaryCircle), plan.id).toBe(true);
      expect(Array.isArray(plan.circles), plan.id).toBe(true);
      expect(plan.circles[0], plan.id).toBe(plan.primaryCircle);
      for (const circle of plan.circles) expect(isCircle(circle), `${plan.id}: ${circle}`).toBe(true);
      expect(new Set(plan.circles).size, plan.id).toBe(plan.circles.length);
    }
  });

  it('maps the journeys the circles roadmap names', () => {
    const primary = Object.fromEntries(PLANS.map((plan) => [plan.id, planCircles(plan).primary]));
    expect(primary).toMatchObject({
      identity21: 'self', fruit10: 'self', holySpirit21: 'self', freedom30: 'self', david12: 'self',
      wisdom42: 'self', zechariah10: 'self', manOfGod21: 'self', womanOfGod21: 'self',
      marriage30: 'household', covenant21: 'household', children21: 'household', unborn21: 'household',
      prodigal30: 'household', unbelievers30: 'people', others30: 'people',
      churchHurt21: 'church', kingdomCome14: 'kingdom',
    });
  });
});
