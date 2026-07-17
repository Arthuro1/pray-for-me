// The intercession queue must contain ONLY requests the user explicitly took on
// — never every request from every group — and its remaining/resume math rides
// the ordinary per-prayer completion records, so filters can never corrupt them.
import { describe, it, expect } from 'vitest';
import { intercessionQueue, queueSources, filterQueue, remainingInQueue } from './intercession';

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
