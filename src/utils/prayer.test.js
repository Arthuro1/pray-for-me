import { describe, it, expect } from 'vitest';
import { testimonyList, prayerOnDay, prayerPriority, communityToPersonalInsert, mirrorSavedCopy, sortByOrder } from './prayer.js';

describe('mirrorSavedCopy', () => {
  const saved = { id: 'sc1', community_origin_id: 'c1', title: 'old', description: 'old', status: 'active', answered_at: null };

  it('mirrors shared content and drops to answered when the group request is answered', () => {
    const c = { id: 'c1', title: 'new', description: 'newd', prayer_points: [{ id: 'pp1', title: 'p', verses: [] }], is_answered: true };
    expect(mirrorSavedCopy(saved, c)).toEqual({
      title: 'new', description: 'newd',
      prayer_points: [{ id: 'pp1', title: 'p', verses: [] }],
      status: 'answered', answered_at: null,
    });
  });

  it('reactivates the copy when the group request is reopened', () => {
    const answeredCopy = { ...saved, status: 'answered', answered_at: '2026-07-02T00:00:00Z' };
    const c = { id: 'c1', title: 'new', description: 'newd', prayer_points: [], is_answered: false };
    const out = mirrorSavedCopy(answeredCopy, c);
    expect(out.status).toBe('active');
    expect(out.answered_at).toBeNull();
  });

  it('keeps an existing answered_at when the copy is already answered', () => {
    const answeredCopy = { ...saved, status: 'answered', answered_at: '2026-07-02T00:00:00Z' };
    const c = { id: 'c1', title: 'new', description: 'newd', prayer_points: [], is_answered: true };
    expect(mirrorSavedCopy(answeredCopy, c).answered_at).toBe('2026-07-02T00:00:00Z');
  });

  it('keeps the saved snapshot when an encrypted group row is temporarily locked', () => {
    const locked = {
      id: 'c1', title: '', description: '', prayer_points: [], is_answered: false,
      encrypted_payload: { v: 2, iv: 'redacted', data: 'redacted' }, _locked: true,
    };

    expect({ ...saved, ...mirrorSavedCopy(saved, locked) }).toEqual(saved);
  });
});

describe('communityToPersonalInsert', () => {
  it('maps a named community prayer to a personal insert payload', () => {
    const cp = { id: 'c1', title: 'Heal', description: 'd', is_anonymous: false, author_name: 'Marie' };
    expect(communityToPersonalInsert(cp, 'Cell', 'u1')).toEqual({
      user_id: 'u1', title: 'Heal', description: 'd', status: 'active',
      community_origin_id: 'c1', origin_author_name: 'Marie',
      origin_is_anonymous: false, origin_group_name: 'Cell',
      // Legacy rows carry no source-language metadata → null (heuristic fallback).
      content_language: null,
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
  it('returns the prayer_testimonies rows when present', () => {
    const rows = [{ id: '1', content: 'Praise', created_at: '2026-01-01' }];
    expect(testimonyList({ prayer_testimonies: rows })).toEqual(rows);
  });

  it('falls back to the legacy single testimony field', () => {
    const out = testimonyList({ testimony: 'Old one', answered_at: '2026-01-01' });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: 'legacy', content: 'Old one', created_at: '2026-01-01' });
  });

  it('uses the legacy testimonies jsonb array as a source', () => {
    const arr = [{ id: '1', content: 'New', created_at: '2026-01-01' }];
    expect(testimonyList({ testimonies: arr, testimony: 'Old' })).toEqual(arr);
  });

  it('merges child rows with the legacy jsonb array, chronologically', () => {
    const out = testimonyList({
      prayer_testimonies: [{ id: 'r', content: 'newer row', created_at: '2026-03-01' }],
      testimonies: [{ id: 'j', content: 'older jsonb', created_at: '2026-01-01' }],
    });
    expect(out.map((t) => t.content)).toEqual(['older jsonb', 'newer row']);
  });

  it('dedups a backfilled row against its legacy jsonb twin by id', () => {
    const out = testimonyList({
      prayer_testimonies: [{ id: 'same', content: 'canonical', created_at: '2026-01-01' }],
      testimonies: [{ id: 'same', content: 'stale legacy copy', created_at: '2026-01-01' }],
    });
    expect(out).toHaveLength(1);
    expect(out[0].content).toBe('canonical');
  });

  it('returns an empty array when there is nothing', () => {
    expect(testimonyList({})).toEqual([]);
    expect(testimonyList(null)).toEqual([]);
  });
});
