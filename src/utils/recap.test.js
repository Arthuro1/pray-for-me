import { describe, it, expect } from 'vitest';
import { weeklyRecap } from './recap.js';

// Build a local Date at midnight, n days before the reference.
const day = (ref, n) => { const d = new Date(ref); d.setDate(d.getDate() + n); return d.toISOString(); };

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
