import { describe, it, expect } from 'vitest';
import { computeStreak, weeklyRecap } from './streak.js';

// Build a local Date at midnight, n days before the reference.
const day = (ref, n) => { const d = new Date(ref); d.setDate(d.getDate() + n); return d.toISOString(); };

describe('computeStreak', () => {
  const today = new Date(2026, 5, 24); // 2026-06-24 local

  it('counts consecutive days ending today', () => {
    const prayers = [{ created_at: day(today, 0) }, { updated_at: day(today, -1) }, { answered_at: day(today, -2) }];
    expect(computeStreak(prayers, today)).toBe(3);
  });

  it('still counts when the last activity was yesterday', () => {
    expect(computeStreak([{ created_at: day(today, -1) }], today)).toBe(1);
  });

  it('breaks the streak on a gap', () => {
    const prayers = [{ created_at: day(today, 0) }, { created_at: day(today, -2) }];
    expect(computeStreak(prayers, today)).toBe(1);
  });

  it('is 0 when the most recent activity is older than yesterday', () => {
    expect(computeStreak([{ created_at: day(today, -3) }], today)).toBe(0);
  });

  it('is 0 with no prayers', () => {
    expect(computeStreak([], today)).toBe(0);
  });

  it('dedupes multiple activities on the same day', () => {
    const prayers = [{ created_at: day(today, 0), updated_at: day(today, 0), answered_at: day(today, 0) }];
    expect(computeStreak(prayers, today)).toBe(1);
  });
});

describe('weeklyRecap', () => {
  const now = new Date(2026, 5, 24);
  it('counts answered prayers and testimonies within the last 7 days', () => {
    const prayers = [
      { answered_at: day(now, -1), testimonies: [{ content: 'a', created_at: day(now, -1) }] },
      { answered_at: day(now, -10) }, // too old
      { testimonies: [{ content: 'b', created_at: day(now, 0) }] },
    ];
    expect(weeklyRecap(prayers, now)).toEqual({ answered: 1, testimonies: 2 });
  });
});
