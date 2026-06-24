import { describe, it, expect } from 'vitest';
import { testimonyList, prayerOnDay, prayerPriority } from './prayer.js';

describe('prayerPriority', () => {
  const orderById = { a: 0, b: 1, c: 2 };

  it('uses the highest-priority (lowest index) category', () => {
    expect(prayerPriority({ prayer_categories: [{ category_id: 'c' }, { category_id: 'a' }] }, orderById)).toBe(0);
  });

  it('sorts uncategorized prayers last', () => {
    expect(prayerPriority({ prayer_categories: [] }, orderById)).toBe(Infinity);
  });

  it('treats unknown categories as lowest priority', () => {
    expect(prayerPriority({ prayer_categories: [{ category_id: 'zzz' }] }, orderById)).toBe(Infinity);
  });
});

describe('prayerOnDay', () => {
  const active = { status: 'active', prayer_categories: [{ category_id: 'c1' }] };

  it('excludes non-active prayers', () => {
    expect(prayerOnDay({ status: 'answered' }, 1, ['c1'])).toBe(false);
  });

  it('uncategorized prayers show every day', () => {
    expect(prayerOnDay({ status: 'active', prayer_categories: [] }, 3, [])).toBe(true);
  });

  it('follows categories when no per-prayer override', () => {
    expect(prayerOnDay(active, 1, ['c1'])).toBe(true);   // c1 scheduled this day
    expect(prayerOnDay(active, 1, ['c2'])).toBe(false);  // c1 not scheduled this day
  });

  it('per-prayer week_days override wins over categories', () => {
    const p = { ...active, week_days: [2] };
    expect(prayerOnDay(p, 2, [])).toBe(true);        // override matches, ignores category days
    expect(prayerOnDay(p, 1, ['c1'])).toBe(false);   // override excludes even though category would include
  });
});

describe('testimonyList', () => {
  it('returns the testimonies array when present', () => {
    const arr = [{ id: '1', content: 'Praise', created_at: 'x' }];
    expect(testimonyList({ testimonies: arr })).toBe(arr);
  });

  it('falls back to the legacy single testimony field', () => {
    const out = testimonyList({ testimony: 'Old one', answered_at: '2026-01-01' });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: 'legacy', content: 'Old one', created_at: '2026-01-01' });
  });

  it('prefers the array over the legacy field', () => {
    const arr = [{ id: '1', content: 'New', created_at: 'x' }];
    expect(testimonyList({ testimonies: arr, testimony: 'Old' })).toBe(arr);
  });

  it('returns an empty array when there is nothing', () => {
    expect(testimonyList({})).toEqual([]);
    expect(testimonyList(null)).toEqual([]);
  });
});
