import { describe, it, expect } from 'vitest';
import { testimonyList, prayerOnDay, prayerPriority, appendTestimony, communityToPersonalInsert, sortByOrder } from './prayer.js';

describe('appendTestimony', () => {
  it('appends a trimmed testimony with injected id/time', () => {
    const out = appendTestimony([{ id: 'a', content: 'old' }], '  praise!  ', 'new-id', '2026-01-01');
    expect(out).toHaveLength(2);
    expect(out[1]).toEqual({ id: 'new-id', content: 'praise!', created_at: '2026-01-01' });
  });
  it('preserves prior testimonies and does not mutate the input', () => {
    const existing = [{ id: 'a', content: 'old' }];
    appendTestimony(existing, 'x', 'id2', 't');
    expect(existing).toHaveLength(1);
  });
  it('skips blank input', () => {
    expect(appendTestimony([{ id: 'a' }], '   ', 'id', 't')).toEqual([{ id: 'a' }]);
    expect(appendTestimony(undefined, '', 'id', 't')).toEqual([]);
  });
});

describe('communityToPersonalInsert', () => {
  it('maps a named community prayer to a personal insert payload', () => {
    const cp = { id: 'c1', title: 'Heal', description: 'd', is_anonymous: false, author_name: 'Marie' };
    expect(communityToPersonalInsert(cp, 'Cell', 'u1')).toEqual({
      user_id: 'u1', title: 'Heal', description: 'd', status: 'active',
      community_origin_id: 'c1', origin_author_name: 'Marie',
      origin_is_anonymous: false, origin_group_name: 'Cell',
    });
  });
  it('drops the author name when anonymous and defaults missing description', () => {
    const cp = { id: 'c2', title: 'T', is_anonymous: true, author_name: 'Marie' };
    const out = communityToPersonalInsert(cp, null, 'u1');
    expect(out.origin_author_name).toBeNull();
    expect(out.origin_is_anonymous).toBe(true);
    expect(out.description).toBe('');
  });
});

describe('sortByOrder', () => {
  it('reorders categories to match the id order', () => {
    const cats = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(sortByOrder(cats, ['c', 'a', 'b']).map((c) => c.id)).toEqual(['c', 'a', 'b']);
  });
  it('does not mutate the input array', () => {
    const cats = [{ id: 'a' }, { id: 'b' }];
    sortByOrder(cats, ['b', 'a']);
    expect(cats.map((c) => c.id)).toEqual(['a', 'b']);
  });
});

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
