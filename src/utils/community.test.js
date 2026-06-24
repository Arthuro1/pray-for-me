import { describe, it, expect } from 'vitest';
import { toError, orderedPair, updatePrayerInList, buildSharesMap } from './community.js';

describe('toError', () => {
  it('wraps a supabase error message', () => {
    expect(toError({ message: 'boom' })).toEqual({ error: 'boom' });
  });
  it('is undefined-safe', () => {
    expect(toError(null)).toEqual({ error: undefined });
  });
});

describe('orderedPair', () => {
  it('orders two ids ascending (matches user_id < friend_id)', () => {
    expect(orderedPair('b', 'a')).toEqual(['a', 'b']);
    expect(orderedPair('a', 'b')).toEqual(['a', 'b']);
  });
});

describe('updatePrayerInList', () => {
  const list = [{ id: '1', n: 1 }, { id: '2', n: 2 }];
  it('updates only the matching prayer immutably', () => {
    const out = updatePrayerInList(list, '2', (p) => ({ ...p, n: 99 }));
    expect(out).toEqual([{ id: '1', n: 1 }, { id: '2', n: 99 }]);
    expect(list[1].n).toBe(2); // original untouched
  });
  it('returns an equivalent list when no id matches', () => {
    expect(updatePrayerInList(list, 'x', (p) => ({ ...p, n: 0 }))).toEqual(list);
  });
});

describe('buildSharesMap', () => {
  it('groups shares by source prayer with name, anonymity and praying count', () => {
    const rows = [
      { source_prayer_id: 'p1', group_id: 'g1', is_anonymous: false, groups: { name: 'Cell' }, prayer_reactions: [{ count: 3 }] },
      { source_prayer_id: 'p1', group_id: 'g2', is_anonymous: true, groups: { name: 'Youth' }, prayer_reactions: [{ count: 0 }] },
      { source_prayer_id: 'p2', group_id: 'g1', is_anonymous: false, groups: null, prayer_reactions: [] },
    ];
    const map = buildSharesMap(rows);
    expect(map.p1).toEqual([
      { groupId: 'g1', groupName: 'Cell', isAnonymous: false, prayingCount: 3 },
      { groupId: 'g2', groupName: 'Youth', isAnonymous: true, prayingCount: 0 },
    ]);
    expect(map.p2[0]).toEqual({ groupId: 'g1', groupName: '?', isAnonymous: false, prayingCount: 0 });
  });
  it('returns an empty map for no rows', () => {
    expect(buildSharesMap(null)).toEqual({});
  });
});
