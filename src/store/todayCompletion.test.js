// @vitest-environment jsdom
//
// The single completion model: what remains today, what's been prayed, and
// whether the day is complete are all DERIVED from per-prayer completion
// records — no separate day-level flag exists to disagree with them.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub the Supabase client (its realtime layer throws at construct time on older
// Node in CI) and the offline mutation queue (IndexedDB isn't in jsdom).
vi.mock('../lib/supabase', () => {
  const chain = {
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => chain,
    eq: () => Promise.resolve({ data: null, error: null }),
    select: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return { supabase: { auth: { getUser: async () => ({ data: { user: null } }) }, from: () => chain } };
});
vi.mock('../lib/mutationQueue', () => ({ enqueue: vi.fn(), pendingPrayerIds: vi.fn(() => new Set()) }));
vi.mock('../lib/analytics', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, track: vi.fn() };
});

import usePrayerStore from './prayerStore';
import { enqueue } from '../lib/mutationQueue';
import { todayKey } from '../lib/prayedLog';

const DAY = todayKey();
const daily = { type: 'recurring', freq: 'daily', startDate: '2020-01-01', end: { kind: 'never' } };
const prayer = (id, extra = {}) => ({
  id, title: id, status: 'active', schedule: daily,
  prayer_categories: [], prayer_points: [], prayer_testimonies: [], ...extra,
});

const store = () => usePrayerStore.getState();

beforeEach(() => {
  usePrayerStore.setState({ prayers: [], categories: [], completions: {}, userId: null });
  vi.clearAllMocks();
});

describe('prayerStore — day completion selectors', () => {
  it('zero scheduled prayers: nothing remains, nothing completed, day NOT complete', () => {
    expect(store().getRemainingPrayersForDay(DAY)).toEqual([]);
    expect(store().getCompletedPrayersForDay(DAY)).toEqual([]);
    expect(store().isDayComplete(DAY)).toBe(false); // empty ≠ complete
  });

  it('one scheduled prayer: remains until marked, then the day is complete', () => {
    usePrayerStore.setState({ prayers: [prayer('p1')] });
    expect(store().getRemainingPrayersForDay(DAY).map((p) => p.id)).toEqual(['p1']);
    expect(store().isDayComplete(DAY)).toBe(false);

    store().markPrayedOn('p1', DAY);
    expect(store().getRemainingPrayersForDay(DAY)).toEqual([]);
    expect(store().getCompletedPrayersForDay(DAY).map((p) => p.id)).toEqual(['p1']);
    expect(store().isDayComplete(DAY)).toBe(true);
  });

  it('partial completion: completed prayers leave the remaining list one by one', () => {
    usePrayerStore.setState({ prayers: [prayer('p1'), prayer('p2'), prayer('p3')] });
    store().markPrayedOn('p2', DAY);
    expect(store().getRemainingPrayersForDay(DAY).map((p) => p.id).sort()).toEqual(['p1', 'p3']);
    expect(store().getCompletedPrayersForDay(DAY).map((p) => p.id)).toEqual(['p2']);
    expect(store().isDayComplete(DAY)).toBe(false);
  });

  it('markPrayedOn is idempotent — Back + advancing over a prayed prayer records once', () => {
    usePrayerStore.setState({ prayers: [prayer('p1')] });
    store().markPrayedOn('p1', DAY);
    store().markPrayedOn('p1', DAY);
    store().markPrayedOn('p1', DAY);
    expect(store().completions.p1).toEqual([DAY]);
    expect(enqueue).toHaveBeenCalledTimes(1); // one queued write, not three
  });

  it('a newly added prayer re-opens a previously completed day', () => {
    usePrayerStore.setState({ prayers: [prayer('p1')] });
    store().markPrayedOn('p1', DAY);
    expect(store().isDayComplete(DAY)).toBe(true);

    usePrayerStore.setState((s) => ({ prayers: [prayer('pNew'), ...s.prayers] }));
    expect(store().getRemainingPrayersForDay(DAY).map((p) => p.id)).toEqual(['pNew']);
    expect(store().isDayComplete(DAY)).toBe(false);
  });

  it('a prayer marked answered mid-session leaves remaining but still counts as prayed today', async () => {
    usePrayerStore.setState({ prayers: [prayer('p1'), prayer('p2')] });
    store().markPrayedOn('p1', DAY);
    await store().markAnswered('p1');
    // Not active any more → not remaining; its completion record still stands.
    expect(store().getRemainingPrayersForDay(DAY).map((p) => p.id)).toEqual(['p2']);
    expect(store().getCompletedPrayersForDay(DAY).map((p) => p.id)).toEqual(['p1']);
    // …and answering the LAST remaining prayer completes the day.
    await store().markAnswered('p2');
    expect(store().getRemainingPrayersForDay(DAY)).toEqual([]);
    expect(store().isDayComplete(DAY)).toBe(true);
  });

  it('offline completion: the optimistic record is queued for replay and drives the UI now', () => {
    usePrayerStore.setState({ prayers: [prayer('p1')], userId: 'u1' });
    store().markPrayedOn('p1', DAY);
    expect(enqueue).toHaveBeenCalledWith('logCompletion', expect.objectContaining({
      row: expect.objectContaining({ prayer_id: 'p1', day: DAY, user_id: 'u1' }),
    }));
    expect(store().isDayComplete(DAY)).toBe(true);
  });

  it('legacy prayers without a schedule still count (uncategorized = daily, unchanged)', () => {
    usePrayerStore.setState({ prayers: [prayer('legacy', { schedule: null })] });
    expect(store().getRemainingPrayersForDay(DAY).map((p) => p.id)).toEqual(['legacy']);
  });
});
