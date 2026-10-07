import { describe, expect, it } from 'vitest';
import { altarOrder, canPrayThroughAltar, sessionCircle } from './altarSession';

const prayer = (id, extra = {}) => ({ id, ...extra });
const planRun = (id, planId, extra = {}) => prayer(id, { schedule: { type: 'recurring', plan: { id: planId } }, ...extra });

describe('sessionCircle', () => {
  it('is the circle the person placed the prayer in', () => {
    expect(sessionCircle(prayer('a', { circle: 'church' }))).toBe('church');
  });

  it('reads a plan run without a circle in its plan\'s primary circle — and never writes it', () => {
    const run = planRun('r', 'kingdomCome14');
    expect(sessionCircle(run)).toBe('kingdom');
    expect(run.circle).toBeUndefined();
  });

  it('lets the person\'s own placement win over the plan\'s circle', () => {
    expect(sessionCircle(planRun('r', 'kingdomCome14', { circle: 'nations' }))).toBe('nations');
  });

  it('has no circle for an unplaced prayer or an unknown plan', () => {
    expect(sessionCircle(prayer('a'))).toBeNull();
    expect(sessionCircle(planRun('r', 'no-such-plan'))).toBeNull();
    expect(sessionCircle(prayer('a', { circle: 'galaxies' }))).toBeNull();
  });
});

describe('altarOrder', () => {
  it('walks inner to outer, keeps each circle\'s given order, puts unplaced prayers last and marks each threshold', () => {
    const { prayers, starts } = altarOrder([
      prayer('loose-1'),
      prayer('nation', { circle: 'nations' }),
      prayer('home-1', { circle: 'household' }),
      planRun('kingdom-run', 'kingdomCome14'),
      prayer('heart', { circle: 'self' }),
      prayer('home-2', { circle: 'household' }),
      prayer('loose-2'),
    ]);
    expect(prayers.map((p) => p.id)).toEqual(['heart', 'home-1', 'home-2', 'nation', 'kingdom-run', 'loose-1', 'loose-2']);
    expect([...starts]).toEqual([[0, 'self'], [1, 'household'], [3, 'nations'], [4, 'kingdom'], [5, null]]);
  });

  it('skips circles with nothing due', () => {
    const { starts } = altarOrder([prayer('a', { circle: 'people' }), prayer('b', { circle: 'people' })]);
    expect([...starts]).toEqual([[0, 'people']]);
  });
});

describe('canPrayThroughAltar', () => {
  it('is offered only when the order would change something', () => {
    expect(canPrayThroughAltar([prayer('a', { circle: 'self' }), prayer('b')])).toBe(true);
    expect(canPrayThroughAltar([planRun('r', 'fruit10'), prayer('b')])).toBe(true);
    expect(canPrayThroughAltar([prayer('a'), prayer('b')])).toBe(false);
    expect(canPrayThroughAltar([prayer('a', { circle: 'self' })])).toBe(false);
    expect(canPrayThroughAltar(undefined)).toBe(false);
  });
});
