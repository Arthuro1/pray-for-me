import { describe, it, expect } from 'vitest';
import { notificationRoute, isUuid } from './notificationRoutes';
// The Edge Function's route builder — a parity test keeps the two lock-stepped
// so a push deep-link and an in-app click always land on the same page.
import { eventUrl } from '../../supabase/functions/_shared/eventNotify.ts';

const GROUP = '11111111-1111-1111-1111-111111111111';
const PRAYER = '22222222-2222-2222-2222-222222222222';

describe('notificationRoute', () => {
  it('deep-links prayer events to the community prayer page', () => {
    expect(notificationRoute({ type: 'community_update', metadata: { group_id: GROUP, community_prayer_id: PRAYER } }))
      .toBe(`/community/group/${GROUP}/prayer/${PRAYER}`);
  });

  it('routes group / friend / invitation events sensibly', () => {
    expect(notificationRoute({ type: 'role_change', metadata: { group_id: GROUP } })).toBe(`/community/group/${GROUP}`);
    expect(notificationRoute({ type: 'friend_request', metadata: {} })).toBe('/community');
    expect(notificationRoute({ type: 'group_invitation', metadata: { group_id: GROUP } })).toBe('/community');
  });

  it('routes a journey invitation to Together attention', () => {
    expect(notificationRoute({ type: 'plan_invitation', metadata: { plan_id: 'fast3' } })).toBe('/community');
    // Group-originated journey invitations enter the same consolidated queue.
    expect(notificationRoute({ type: 'plan_invitation', metadata: { plan_id: 'fast3', group_id: GROUP } })).toBe('/community');
  });

  it('falls back safely for missing/forged ids', () => {
    expect(notificationRoute({ type: 'community_update', metadata: { group_id: 'x', community_prayer_id: 'y' } })).toBe('/community');
    expect(notificationRoute({ type: 'answered', metadata: {} })).toBe('/community');
    expect(notificationRoute({ type: 'unknown', metadata: {} })).toBe('/community');
  });

  it('validates UUIDs', () => {
    expect(isUuid(GROUP)).toBe(true);
    expect(isUuid('nope')).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
});

describe('client / server route parity', () => {
  const cases = [
    ['community_update', { group_id: GROUP, community_prayer_id: PRAYER }],
    ['answered', { group_id: GROUP, community_prayer_id: PRAYER }],
    ['reaction_bucket', { group_id: GROUP, community_prayer_id: PRAYER }],
    ['testimony', { group_id: GROUP, community_prayer_id: PRAYER }],
    ['group_prayer_added', { group_id: GROUP }],
    ['membership_change', { group_id: GROUP }],
    ['role_change', { group_id: GROUP }],
    ['friend_request', {}],
    ['group_invitation', { group_id: GROUP }],
    ['plan_invitation', { plan_id: 'fast3' }],
    ['plan_invitation', { plan_id: 'fast3', group_id: GROUP }],
    ['community_update', { group_id: 'bad', community_prayer_id: 'bad' }],
  ];
  it('notificationRoute(client) === eventUrl(server) for every case', () => {
    for (const [type, metadata] of cases) {
      expect(notificationRoute({ type, metadata })).toBe(eventUrl(type, metadata));
    }
  });
});
