import { describe, it, expect } from 'vitest';
import {
  parseKey, toKey, addDays, diffDays,
  occursOn, occurrencesInRange, nextOccurrence, seriesEnded,
  planDayNumber, rotationForDay, toRRule, normalizeSchedule,
} from './schedule.js';

// 2026-07-04 is a Saturday; 2026-07-07 a Tuesday; 2026-07-10 a Friday.

describe('day keys', () => {
  it('round-trips local dates without timezone drift', () => {
    expect(toKey(parseKey('2026-07-04'))).toBe('2026-07-04');
    expect(parseKey('2026-07-04').getDay()).toBe(6); // Saturday, local
  });
  it('adds and diffs days across month boundaries', () => {
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01');
    expect(diffDays('2026-07-04', '2026-08-04')).toBe(31);
  });
});

describe('once', () => {
  const s = { type: 'once', date: '2026-07-14' };
  it('occurs only on its date', () => {
    expect(occursOn(s, '2026-07-14')).toBe(true);
    expect(occursOn(s, '2026-07-15')).toBe(false);
  });
  it('is ended once the date has passed', () => {
    expect(seriesEnded(s, '2026-07-14')).toBe(false);
    expect(seriesEnded(s, '2026-07-15')).toBe(true);
  });
});

describe('recurring patterns', () => {
  it('daily occurs every day from startDate', () => {
    const s = { type: 'recurring', freq: 'daily', startDate: '2026-07-04' };
    expect(occursOn(s, '2026-07-03')).toBe(false);
    expect(occursOn(s, '2026-07-04')).toBe(true);
    expect(occursOn(s, '2026-09-01')).toBe(true);
  });
  it('weekly matches the chosen weekdays (Tue & Fri)', () => {
    const s = { type: 'recurring', freq: 'weekly', weekDays: [2, 5], startDate: '2026-07-04' };
    expect(occursOn(s, '2026-07-07')).toBe(true);  // Tue
    expect(occursOn(s, '2026-07-10')).toBe(true);  // Fri
    expect(occursOn(s, '2026-07-08')).toBe(false); // Wed
  });
  it('interval hits every N days from startDate', () => {
    const s = { type: 'recurring', freq: 'interval', interval: 3, startDate: '2026-07-04' };
    expect(occursOn(s, '2026-07-04')).toBe(true);
    expect(occursOn(s, '2026-07-05')).toBe(false);
    expect(occursOn(s, '2026-07-07')).toBe(true);
  });
  it('monthly clamps the 31st to short months', () => {
    const s = { type: 'recurring', freq: 'monthly', dayOfMonth: 31, startDate: '2026-01-31' };
    expect(occursOn(s, '2026-01-31')).toBe(true);
    expect(occursOn(s, '2026-02-28')).toBe(true);  // clamped
    expect(occursOn(s, '2026-04-30')).toBe(true);  // clamped
    expect(occursOn(s, '2026-03-30')).toBe(false);
    expect(occursOn(s, '2026-03-31')).toBe(true);
  });
  it('yearly matches month/day (anniversaries)', () => {
    const s = { type: 'recurring', freq: 'yearly', month: 7, day: 14, startDate: '2026-07-14' };
    expect(occursOn(s, '2026-07-14')).toBe(true);
    expect(occursOn(s, '2027-07-14')).toBe(true);
    expect(occursOn(s, '2027-07-15')).toBe(false);
  });
});

describe('end conditions', () => {
  it('date end caps the series inclusively', () => {
    const s = { type: 'recurring', freq: 'daily', startDate: '2026-07-04', end: { kind: 'date', date: '2026-07-06' } };
    expect(occursOn(s, '2026-07-06')).toBe(true);
    expect(occursOn(s, '2026-07-07')).toBe(false);
    expect(seriesEnded(s, '2026-07-07')).toBe(true);
  });
  it('count end stops after N occurrences', () => {
    const s = { type: 'recurring', freq: 'weekly', weekDays: [2], startDate: '2026-07-04', end: { kind: 'count', count: 2 } };
    expect(occursOn(s, '2026-07-07')).toBe(true);  // #1
    expect(occursOn(s, '2026-07-14')).toBe(true);  // #2
    expect(occursOn(s, '2026-07-21')).toBe(false); // beyond count
    expect(seriesEnded(s, '2026-07-15')).toBe(true);
  });
  it('never/answered ends leave the series open (status is enforced outside)', () => {
    const s = { type: 'recurring', freq: 'daily', startDate: '2026-07-04', end: { kind: 'answered' } };
    expect(occursOn(s, '2027-07-04')).toBe(true);
    expect(seriesEnded(s, '2027-07-04')).toBe(false);
  });
});

describe('overrides', () => {
  const s = { type: 'recurring', freq: 'weekly', weekDays: [2], startDate: '2026-07-04' };
  it('skip removes a single occurrence without touching the series', () => {
    const ov = { '2026-07-07': { skip: true } };
    expect(occursOn(s, '2026-07-07', ov)).toBe(false);
    expect(occursOn(s, '2026-07-14', ov)).toBe(true);
  });
  it('movedTo relocates one occurrence', () => {
    const ov = { '2026-07-07': { movedTo: '2026-07-09' } };
    expect(occursOn(s, '2026-07-07', ov)).toBe(false);
    expect(occursOn(s, '2026-07-09', ov)).toBe(true);
  });
  it('a move honours the series end (no ghost occurrences)', () => {
    const capped = { ...s, end: { kind: 'count', count: 1 } };
    const ov = { '2026-07-14': { movedTo: '2026-07-16' } }; // #2 doesn't exist
    expect(occursOn(capped, '2026-07-16', ov)).toBe(false);
  });
});

describe('ranges and next occurrence', () => {
  const s = { type: 'recurring', freq: 'weekly', weekDays: [2, 5], startDate: '2026-07-01' };
  it('lists occurrences inside a month window', () => {
    expect(occurrencesInRange(s, '2026-07-01', '2026-07-14')).toEqual([
      '2026-07-03', '2026-07-07', '2026-07-10', '2026-07-14',
    ]);
  });
  it('finds the next occurrence from a day', () => {
    expect(nextOccurrence(s, '2026-07-08')).toBe('2026-07-10');
  });
  it('returns null when the series is over', () => {
    const done = { type: 'once', date: '2026-07-02' };
    expect(nextOccurrence(done, '2026-07-08')).toBeNull();
  });
});

describe('planDayNumber', () => {
  it('numbers plan days 1..N along the base pattern', () => {
    const s = { type: 'recurring', freq: 'daily', startDate: '2026-07-04', end: { kind: 'count', count: 9 }, plan: { id: 'upperRoom', startDate: '2026-07-04' } };
    expect(planDayNumber(s, '2026-07-04')).toBe(1);
    expect(planDayNumber(s, '2026-07-12')).toBe(9);
    expect(planDayNumber(s, '2026-07-05')).toBe(2);
  });
});

describe('rotationForDay', () => {
  const ids = ['a', 'b', 'c', 'd', 'e'];
  it('returns everything when the list fits in one day', () => {
    expect(rotationForDay(ids, 5, '2026-07-04')).toEqual(ids);
  });
  it('cycles through groups day by day and covers everyone', () => {
    const seen = new Set();
    for (let i = 0; i < 3; i++) {
      rotationForDay(ids, 2, addDays('2026-07-04', i)).forEach((id) => seen.add(id));
    }
    expect(seen.size).toBe(5);
  });
  it('is deterministic for a given day', () => {
    expect(rotationForDay(ids, 2, '2026-07-04')).toEqual(rotationForDay(ids, 2, '2026-07-04'));
  });
});

describe('toRRule', () => {
  it('serialises the supported patterns', () => {
    expect(toRRule({ type: 'recurring', freq: 'daily', startDate: '2026-07-04' })).toBe('FREQ=DAILY');
    expect(toRRule({ type: 'recurring', freq: 'weekly', weekDays: [2, 5], startDate: '2026-07-04' })).toBe('FREQ=WEEKLY;BYDAY=TU,FR');
    expect(toRRule({ type: 'recurring', freq: 'interval', interval: 3, startDate: '2026-07-04' })).toBe('FREQ=DAILY;INTERVAL=3');
    expect(toRRule({ type: 'recurring', freq: 'monthly', dayOfMonth: 15, startDate: '2026-07-04' })).toBe('FREQ=MONTHLY;BYMONTHDAY=15');
  });
  it('appends UNTIL/COUNT ends and skips one-time schedules', () => {
    expect(toRRule({ type: 'recurring', freq: 'daily', startDate: '2026-07-04', end: { kind: 'date', date: '2026-08-01' } })).toBe('FREQ=DAILY;UNTIL=20260801');
    expect(toRRule({ type: 'recurring', freq: 'daily', startDate: '2026-07-04', end: { kind: 'count', count: 21 } })).toBe('FREQ=DAILY;COUNT=21');
    expect(toRRule({ type: 'once', date: '2026-07-14' })).toBeNull();
  });
});

describe('normalizeSchedule', () => {
  it('rejects empty or invalid shapes', () => {
    expect(normalizeSchedule(null, '2026-07-04')).toBeNull();
    expect(normalizeSchedule({ type: 'once' }, '2026-07-04')).toBeNull();
    expect(normalizeSchedule({ type: 'recurring', freq: 'weekly', weekDays: [] }, '2026-07-04')).toBeNull();
  });
  it('defaults startDate to today and end to never', () => {
    const s = normalizeSchedule({ type: 'recurring', freq: 'daily' }, '2026-07-04');
    expect(s.startDate).toBe('2026-07-04');
    expect(s.end).toEqual({ kind: 'never' });
  });
  it('keeps until-answered and slot', () => {
    const s = normalizeSchedule(
      { type: 'recurring', freq: 'weekly', weekDays: [5, 2], slot: 'morning', end: { kind: 'answered' } },
      '2026-07-04'
    );
    expect(s.weekDays).toEqual([2, 5]);
    expect(s.slot).toBe('morning');
    expect(s.end).toEqual({ kind: 'answered' });
  });
});
