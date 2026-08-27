import { describe, it, expect } from 'vitest';
import { prayersForDay, groupBySlot, catchUpPrayers, monthDots, scheduleEnded, runningPlanIds, runningPlanProgress } from './planner.js';

// 2026-07-06 is a Monday (weekday 1); 2026-07-07 a Tuesday (weekday 2).
const cats = [
  { id: 'fam', week_days: [1] },
  { id: 'heal', week_days: [2] },
];

const base = (over) => ({
  id: over.id, status: 'active', prayer_categories: [], created_at: '2026-01-01', ...over,
});

describe('prayersForDay', () => {
  it('keeps full legacy behaviour for prayers without a schedule', () => {
    const prayers = [
      base({ id: 'a', prayer_categories: [{ category_id: 'fam' }] }),
      base({ id: 'b', prayer_categories: [{ category_id: 'heal' }] }),
      base({ id: 'c' }), // uncategorized → every day
      base({ id: 'd', week_days: [1] }),
    ];
    const monday = prayersForDay(prayers, cats, '2026-07-06').map((e) => e.prayer.id);
    expect(monday).toEqual(['a', 'c', 'd']);
  });

  it('a schedule takes full ownership of its prayer', () => {
    const prayers = [
      // In the "fam" Monday category, but scheduled only for Tuesdays.
      base({ id: 'a', prayer_categories: [{ category_id: 'fam' }], schedule: { type: 'recurring', freq: 'weekly', weekDays: [2], startDate: '2026-07-01' } }),
      base({ id: 'b', schedule: { type: 'once', date: '2026-07-06' } }),
    ];
    const monday = prayersForDay(prayers, cats, '2026-07-06');
    expect(monday.map((e) => e.prayer.id)).toEqual(['b']);
    expect(monday[0].source).toBe('once');
    const tuesday = prayersForDay(prayers, cats, '2026-07-07');
    expect(tuesday.map((e) => e.prayer.id)).toEqual(['a']);
    expect(tuesday[0].source).toBe('recurring');
  });

  it('answered prayers drop off the plan (until-answered)', () => {
    const prayers = [
      base({ id: 'a', status: 'answered', schedule: { type: 'recurring', freq: 'daily', startDate: '2026-07-01', end: { kind: 'answered' } } }),
    ];
    expect(prayersForDay(prayers, cats, '2026-07-06')).toEqual([]);
  });

  it('rotation limits a category to N prayers per day and covers all over the cycle', () => {
    const rotCats = [{ id: 'list', week_days: [0, 1, 2, 3, 4, 5, 6], rotation: { perDay: 2 } }];
    const prayers = ['p1', 'p2', 'p3', 'p4', 'p5'].map((id, i) =>
      base({ id, prayer_categories: [{ category_id: 'list' }], created_at: `2026-01-0${i + 1}` })
    );
    const seen = new Set();
    for (const day of ['2026-07-06', '2026-07-07', '2026-07-08']) {
      const ids = prayersForDay(prayers, rotCats, day).map((e) => e.prayer.id);
      expect(ids.length).toBeLessThanOrEqual(2);
      ids.forEach((id) => seen.add(id));
    }
    expect(seen.size).toBe(5);
  });
});

describe('groupBySlot', () => {
  it('buckets entries by slot with unslotted last as anytime', () => {
    const entries = [
      { prayer: { id: 'a' }, source: 'recurring', slot: 'morning' },
      { prayer: { id: 'b' }, source: 'category', slot: null },
      { prayer: { id: 'c' }, source: 'recurring', slot: 'evening' },
    ];
    const g = groupBySlot(entries);
    expect(g.morning.map((e) => e.prayer.id)).toEqual(['a']);
    expect(g.evening.map((e) => e.prayer.id)).toEqual(['c']);
    expect(g.anytime.map((e) => e.prayer.id)).toEqual(['b']);
  });
});

describe('catchUpPrayers', () => {
  it('lists missed occurrences, skipping completed and today-scheduled ones', () => {
    const prayers = [
      base({ id: 'missed', schedule: { type: 'once', date: '2026-07-05' } }),
      base({ id: 'done', schedule: { type: 'once', date: '2026-07-05' } }),
      base({ id: 'today', schedule: { type: 'recurring', freq: 'daily', startDate: '2026-07-01' } }),
    ];
    const completed = new Map([['done', new Set(['2026-07-05'])]]);
    const missed = catchUpPrayers(prayers, [], completed, '2026-07-06');
    expect(missed).toEqual([{ prayer: prayers[0], day: '2026-07-05' }]);
  });

  it('a completion on a later day counts as caught up (Pray now from detail)', () => {
    const prayers = [base({ id: 'p', schedule: { type: 'once', date: '2026-07-05' } })];
    // Prayed today via the detail page — logged on today, not the missed day.
    const completed = new Map([['p', new Set(['2026-07-06'])]]);
    expect(catchUpPrayers(prayers, [], completed, '2026-07-06')).toEqual([]);
  });

  it('a completion before the miss does not clear it', () => {
    const prayers = [base({ id: 'p', schedule: { type: 'once', date: '2026-07-05' } })];
    const completed = new Map([['p', new Set(['2026-07-03'])]]);
    expect(catchUpPrayers(prayers, [], completed, '2026-07-06')).toEqual([
      { prayer: prayers[0], day: '2026-07-05' },
    ]);
  });
});

describe('scheduleEnded / runningPlanIds', () => {
  // A guided plan: daily from startDate, capped after `count` occurrences.
  const planPrayer = (id, startDate, count, over = {}) => base({
    id,
    schedule: {
      type: 'recurring', freq: 'daily', startDate,
      end: { kind: 'count', count },
      plan: { id: `plan-${id}`, startDate },
    },
    ...over,
  });

  it('a count-capped series ends only after its last day', () => {
    const p = planPrayer('a', '2026-07-01', 7); // days 1–7 → last day 2026-07-07
    expect(scheduleEnded(p, '2026-07-07')).toBe(false);
    expect(scheduleEnded(p, '2026-07-08')).toBe(true);
  });

  it('a past one-time prayer is not "ended" — only recurring series are', () => {
    const p = base({ id: 'o', schedule: { type: 'once', date: '2026-07-01' } });
    expect(scheduleEnded(p, '2026-07-10')).toBe(false);
  });

  it('an until-answered series never ends on its own', () => {
    const p = base({ id: 'u', schedule: { type: 'recurring', freq: 'daily', startDate: '2026-07-01', end: { kind: 'answered' } } });
    expect(scheduleEnded(p, '2027-07-01')).toBe(false);
  });

  it('a finished plan releases its card; a running one stays claimed', () => {
    const prayers = [planPrayer('a', '2026-07-01', 7), planPrayer('b', '2026-07-05', 21)];
    const ids = runningPlanIds(prayers, '2026-07-10');
    expect(ids.has('plan-a')).toBe(false);
    expect(ids.has('plan-b')).toBe(true);
  });

  it('answered and unscheduled prayers never claim a plan', () => {
    const prayers = [planPrayer('a', '2026-07-01', 21, { status: 'answered' }), base({ id: 'c' })];
    expect(runningPlanIds(prayers, '2026-07-10').size).toBe(0);
  });
});

// A running plan used to be a dead end: its catalogue card said "Running" and
// opened a preview whose Start button was disabled. It now has to say WHICH day
// the reader is on and which prayer is carrying the run.
describe('runningPlanProgress', () => {
  const run = (id, planId, startDate, count, over = {}) => base({
    id,
    schedule: {
      type: 'recurring', freq: 'daily', startDate,
      end: { kind: 'count', count },
      plan: { id: planId, startDate },
    },
    ...over,
  });

  it('reports the day a run has reached, and the prayer carrying it', () => {
    const progress = runningPlanProgress([run('p-1', 'marriage30', '2026-07-01', 30)], '2026-07-12');
    expect(progress).toEqual({ marriage30: { prayerId: 'p-1', day: 12 } });
  });

  it('says nothing about a plan whose last day is behind the reader', () => {
    expect(runningPlanProgress([run('p-1', 'fast3', '2026-07-01', 3)], '2026-07-05')).toEqual({});
  });

  it('ignores a run that is no longer active, so the card cannot point at it', () => {
    const prayers = [
      run('archived', 'marriage30', '2026-07-01', 30, { status: 'answered' }),
      run('live', 'marriage30', '2026-07-01', 30),
    ];
    expect(runningPlanProgress(prayers, '2026-07-12').marriage30.prayerId).toBe('live');
  });

  // A moved or skipped occurrence leaves the plan running but off a plan day.
  // Callers read a null day as "running, not today" — never as an error.
  it('keeps the run but reports no day when today is not a plan day', () => {
    const weekly = base({
      id: 'p-1',
      schedule: {
        type: 'recurring', freq: 'weekly', weekDays: [1], startDate: '2026-07-06',
        end: { kind: 'count', count: 10 },
        plan: { id: 'altar7', startDate: '2026-07-06' },
      },
    });
    const progress = runningPlanProgress([weekly], '2026-07-07'); // Tuesday
    expect(progress.altar7.prayerId).toBe('p-1');
    expect(progress.altar7.day).toBeNull();
  });

  it('is empty when nothing is running', () => {
    expect(runningPlanProgress([base({ id: 'plain' })], '2026-07-06')).toEqual({});
  });
});

describe('monthDots', () => {
  it('counts entries per day by kind', () => {
    const prayers = [
      base({ id: 'a', schedule: { type: 'once', date: '2026-07-06' } }),
      base({ id: 'b', schedule: { type: 'recurring', freq: 'daily', startDate: '2026-07-01' } }),
      base({ id: 'c', prayer_categories: [{ category_id: 'fam' }] }),
    ];
    const dots = monthDots(prayers, cats, ['2026-07-06', '2026-07-07']);
    expect(dots['2026-07-06']).toEqual({ once: 1, recurring: 1, plan: 1 }); // Monday
    expect(dots['2026-07-07']).toEqual({ once: 0, recurring: 1, plan: 0 });
  });
});
