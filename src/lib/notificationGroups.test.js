import { describe, it, expect } from 'vitest';
import { groupNotifications } from './notificationGroups';

const G1 = '11111111-1111-4111-8111-111111111111';
const P1 = '22222222-2222-4222-8222-222222222222';
const P2 = '33333333-3333-4333-8333-333333333333';
const n = (id, type, extra = {}) => ({ id, type, read_at: null, group_id: null, metadata: {}, ...extra });

describe('groupNotifications', () => {
  it('folds alike notifications into one row led by the newest', () => {
    const rows = groupNotifications([
      n('a', 'friend_request'), n('b', 'friend_request'), n('c', 'group_invitation'), n('d', 'friend_request'),
    ]);
    expect(rows.map((r) => r.latest.id)).toEqual(['a', 'c']);
    expect(rows[0].ids).toEqual(['a', 'b', 'd']);
  });

  it('never merges notifications that lead to different prayers', () => {
    const rows = groupNotifications([
      n('a', 'community_update', { group_id: G1, metadata: { group_id: G1, community_prayer_id: P1 } }),
      n('b', 'community_update', { group_id: G1, metadata: { group_id: G1, community_prayer_id: P2 } }),
      n('c', 'community_update', { group_id: G1, metadata: { group_id: G1, community_prayer_id: P1 } }),
    ]);
    expect(rows.map((r) => r.ids)).toEqual([['a', 'c'], ['b']]);
  });

  it('keeps read and unread apart, so the unread dot stays honest', () => {
    const rows = groupNotifications([n('a', 'friend_request'), n('b', 'friend_request', { read_at: '2026-10-01T00:00:00Z' })]);
    expect(rows).toHaveLength(2);
  });
});
