import { describe, it, expect } from 'vitest';
// Imports the Edge Function's pure payload module directly (no npm: specifiers
// there, so Vitest can transpile it) — the exact builder send-event-notifications
// uses, so the privacy guarantees asserted here hold in production.
import { eventPayload, eventUrl, eventTag, digestPayload, EVENT_MSG, DIGEST_MSG } from '../../supabase/functions/_shared/eventNotify.ts';

const TYPES = Object.keys(EVENT_MSG.en);
const LANGS = Object.keys(EVENT_MSG);

const GROUP = '11111111-1111-1111-1111-111111111111';
const PRAYER = '22222222-2222-2222-2222-222222222222';

// Sensitive content that must NEVER reach a push payload. It is never passed to
// the builder — the point is there is no channel for it.
const SECRET = 'Healing for Mom after her diagnosis';

describe('event push payloads carry no prayer content', () => {
  it('every type in every language yields only generic, content-free copy', () => {
    for (const lang of LANGS) {
      for (const type of TYPES) {
        const p = JSON.parse(eventPayload(type, lang, { group_id: GROUP, community_prayer_id: PRAYER, secret: SECRET }));
        expect(p.title).toBe(EVENT_MSG[lang][type].title);
        expect(p.body).toBe(EVENT_MSG[lang][type].body);
        // The secret is never in the serialized payload.
        expect(JSON.stringify(p)).not.toContain(SECRET);
      }
    }
  });

  it('falls back to English for an unknown language', () => {
    const p = JSON.parse(eventPayload('friend_request', 'xx', {}));
    expect(p.title).toBe(EVENT_MSG.en.friend_request.title);
  });

  it('carries the notificationId through for click attribution', () => {
    const p = JSON.parse(eventPayload('answered', 'en', { group_id: GROUP, community_prayer_id: PRAYER }, 'abc'));
    expect(p.notificationId).toBe('abc');
  });
});

describe('eventUrl builds safe internal routes from validated ids only', () => {
  it('deep-links prayer events to the community prayer page', () => {
    expect(eventUrl('community_update', { group_id: GROUP, community_prayer_id: PRAYER }))
      .toBe(`/community/group/${GROUP}/prayer/${PRAYER}`);
    expect(eventUrl('answered', { group_id: GROUP, community_prayer_id: PRAYER }))
      .toBe(`/community/group/${GROUP}/prayer/${PRAYER}`);
  });

  it('routes group events to the group page', () => {
    expect(eventUrl('group_prayer_added', { group_id: GROUP })).toBe(`/community/group/${GROUP}`);
    expect(eventUrl('role_change', { group_id: GROUP })).toBe(`/community/group/${GROUP}`);
  });

  it('routes friend/invitation events to the community hub', () => {
    expect(eventUrl('friend_request', {})).toBe('/community');
    expect(eventUrl('group_invitation', { group_id: GROUP })).toBe('/community');
  });

  it('falls back safely when ids are missing or malformed', () => {
    expect(eventUrl('community_update', { group_id: 'not-a-uuid', community_prayer_id: 'x' })).toBe('/community');
    expect(eventUrl('community_update', { group_id: GROUP, community_prayer_id: 'bad' })).toBe(`/community/group/${GROUP}`);
    expect(eventUrl('answered', {})).toBe('/community');
  });
});

describe('digestPayload batches into one content-free summary', () => {
  it('interpolates the count, routes to the inbox, and leaks nothing, in every language', () => {
    for (const lang of Object.keys(DIGEST_MSG)) {
      const p = JSON.parse(digestPayload(lang, 4));
      expect(p.body).toContain('4');
      expect(p.url).toBe('/notifications');
      expect(p.tag).toBe('digest');
      expect(JSON.stringify(p)).not.toContain(SECRET);
    }
  });

  it('falls back to English for an unknown language', () => {
    const p = JSON.parse(digestPayload('xx', 2));
    expect(p.body).toBe(DIGEST_MSG.en.body.replace('{count}', '2'));
  });
});

describe('eventTag is stable per entity so pushes collapse instead of stacking', () => {
  it('keys on the prayer id when present', () => {
    expect(eventTag('community_update', { community_prayer_id: PRAYER })).toBe(`community_update:${PRAYER}`);
  });
  it('keys on the group id otherwise, then the bare type', () => {
    expect(eventTag('role_change', { group_id: GROUP })).toBe(`role_change:${GROUP}`);
    expect(eventTag('friend_request', {})).toBe('friend_request');
  });
});
