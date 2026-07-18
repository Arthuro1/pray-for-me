// The intercession queue must contain ONLY requests the user explicitly took on
// — never every request from every group — and its remaining/resume math rides
// the ordinary per-prayer completion records, so filters can never corrupt them.
import { describe, it, expect } from 'vitest';
import { intercessionQueue, dueIntercessionQueue, queueSources, filterQueue, remainingInQueue } from './intercession';

const own = (id) => ({ id, status: 'active', for_other: false });
const forOther = (id) => ({ id, status: 'active', for_other: true, person_name: 'Marc' });
const saved = (id) => ({ id, status: 'active', for_other: false, community_origin_id: `c-${id}`, origin_group_name: 'Église' });

describe('intercessionQueue — explicit commitments only', () => {
  it('includes for-other prayers and saved community copies, nothing else', () => {
    const queue = intercessionQueue([own('a'), forOther('b'), saved('c')]);
    expect(queue.map((p) => p.id)).toEqual(['b', 'c']);
  });

  it('excludes answered prayers and rows locked on this device', () => {
    const queue = intercessionQueue([
      { ...forOther('b'), status: 'answered' },
      { ...saved('c'), _locked: true },
      forOther('d'),
    ]);
    expect(queue.map((p) => p.id)).toEqual(['d']);
  });

  it('is empty for a user with only ordinary personal prayers (Grace never sees it)', () => {
    expect(intercessionQueue([own('a'), own('b')])).toEqual([]);
  });
});

describe('queueSources / filterQueue', () => {
  it('reports a single source when only one kind feeds the queue — no filters needed', () => {
    expect(queueSources([forOther('b')]).count).toBe(1);
    expect(queueSources([saved('c')]).count).toBe(1);
    expect(queueSources([forOther('b'), saved('c')]).count).toBe(2);
  });

  it('filters by source without touching the prayers themselves', () => {
    const queue = [forOther('b'), saved('c')];
    expect(filterQueue(queue, 'personal').map((p) => p.id)).toEqual(['b']);
    expect(filterQueue(queue, 'groups').map((p) => p.id)).toEqual(['c']);
    expect(filterQueue(queue, 'all')).toEqual(queue);
  });
});

describe('dueIntercessionQueue — schedule-aware default', () => {
  // 2026-07-17 is a Friday (weekday 5). A weekly Monday schedule is NOT due.
  const dayKey = '2026-07-17';
  const weeklyOn = (weekday) => ({
    type: 'recurring', freq: 'weekly', weekDays: [weekday], startDate: '2026-01-01',
  });

  it('excludes a weekly prayer not due today and includes one that is due', () => {
    const notDue = { ...forOther('mon'), schedule: weeklyOn(1) };
    const due = { ...forOther('fri'), schedule: weeklyOn(5) };
    const queue = dueIntercessionQueue([notDue, due], [], dayKey);
    expect(queue.map((p) => p.id)).toEqual(['fri']);
  });

  it('keeps the existing fallback for legacy unscheduled prayers (due daily)', () => {
    const legacy = { ...saved('legacy'), prayer_categories: [] };
    const queue = dueIntercessionQueue([legacy], [], dayKey);
    expect(queue.map((p) => p.id)).toEqual(['legacy']);
  });

  it('includes a prayer-chain commitment only on its claimed day', () => {
    const chained = { ...saved('x'), schedule: weeklyOn(1) }; // itself not due Friday
    const claimToday = [{ community_prayer_id: 'c-x', day: dayKey }];
    const claimTomorrow = [{ community_prayer_id: 'c-x', day: '2026-07-18' }];
    expect(dueIntercessionQueue([chained], [], dayKey, claimToday).map((p) => p.id)).toEqual(['x']);
    expect(dueIntercessionQueue([chained], [], dayKey, claimTomorrow)).toEqual([]);
  });

  it('a claim on someone else’s prayer never pulls in an uncarried request', () => {
    const ordinary = own('a'); // not carried at all
    expect(dueIntercessionQueue([ordinary], [], dayKey, [{ community_prayer_id: 'c-a', day: dayKey }])).toEqual([]);
  });

  it('every carried request stays available via intercessionQueue even when not due', () => {
    const notDue = { ...forOther('mon'), schedule: weeklyOn(1) };
    expect(dueIntercessionQueue([notDue], [], dayKey)).toEqual([]);
    expect(intercessionQueue([notDue]).map((p) => p.id)).toEqual(['mon']);
  });
});

describe('remainingInQueue — resume after a partial session', () => {
  it('drops prayers already completed on the day, keeping order (first unfinished leads)', () => {
    const queue = [forOther('b'), saved('c'), forOther('d')];
    const completions = { b: ['2026-07-17'], x: ['2026-07-17'] };
    expect(remainingInQueue(queue, completions, '2026-07-17').map((p) => p.id)).toEqual(['c', 'd']);
  });

  it("a completion on another day doesn't count for today", () => {
    const queue = [forOther('b')];
    expect(remainingInQueue(queue, { b: ['2026-07-16'] }, '2026-07-17')).toHaveLength(1);
  });
});
