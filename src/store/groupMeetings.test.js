// Group prayer meetings never send their details in the clear: the call link,
// the place, the title and the notes travel only inside the group-key
// ciphertext, and come back readable for members. Without a group key the
// write fails closed instead of storing plaintext.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true });
});

const rec = vi.hoisted(() => ({ writes: [], rows: [], keyAvailable: true }));

vi.mock('../lib/supabase', () => {
  const makeQuery = (table) => {
    const chain = {
      insert: (payload) => { rec.writes.push({ table, op: 'insert', payload }); rec.rows.push(payload); return chain; },
      update: (payload) => { rec.writes.push({ table, op: 'update', payload }); return chain; },
      delete: () => chain,
      select: () => chain,
      eq: () => chain,
      then: (resolve) => resolve({ data: rec.rows, error: null }),
    };
    return chain;
  };
  return {
    supabase: {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'user-1' } } } }) },
      from: (table) => makeQuery(table),
      rpc: async () => ({ data: null, error: null }),
      channel: () => ({ on() { return this; }, subscribe() { return this; } }),
      removeChannel: () => {},
    },
  };
});

vi.mock('../lib/crypto/groupKeys', () => {
  let key;
  const ensureGroupKey = async () => {
    if (!rec.keyAvailable) return null;
    key ||= await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    return { key, version: 1 };
  };
  const groupKeyResolver = () => ensureGroupKey;
  return { ensureGroupKey, groupKeyResolver, revokeMemberAndRotate: vi.fn() };
});

import useCommunityStore, { GROUP_ENCRYPTION_UNAVAILABLE } from './communityStore';

const GROUP = '99999999-9999-4999-8999-999999999999';
const MEETING = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const LINK = 'https://zoom.us/j/8812345?pwd=secret';
const PLACE = '12 rue de la Paix';

const meetingFields = (details) => ({
  id: MEETING,
  isNew: true,
  groupId: GROUP,
  userId: 'user-1',
  schedule: { type: 'recurring', freq: 'weekly', weekDays: [2], startDate: '2026-10-20' },
  startTime: '20:00',
  timezone: 'Europe/Paris',
  durationMinutes: 60,
  details,
});

beforeEach(() => {
  rec.writes = [];
  rec.rows = [];
  rec.keyAvailable = true;
});

describe('group prayer meetings', () => {
  it('stores timing in the clear and every detail only as ciphertext', async () => {
    const details = { title: 'Prière du mardi', mode: 'online', link: LINK, place: '', notes: 'Bring your requests' };
    expect(await useCommunityStore.getState().saveGroupMeeting(meetingFields(details))).toEqual({});

    const [write] = rec.writes;
    expect(write).toMatchObject({ table: 'group_meetings', op: 'insert' });
    expect(write.payload).toMatchObject({ id: MEETING, group_id: GROUP, start_time: '20:00', timezone: 'Europe/Paris', key_version: 1 });
    const sent = JSON.stringify(write.payload);
    for (const secret of [LINK, 'zoom', 'Prière du mardi', 'Bring your requests']) expect(sent).not.toContain(secret);
    expect(Object.keys(write.payload)).not.toContain('link');
  });

  it('reads back the details for members', async () => {
    const details = { title: '', mode: 'in_person', link: '', place: PLACE, notes: '' };
    await useCommunityStore.getState().saveGroupMeeting(meetingFields(details));
    const { meetings } = await useCommunityStore.getState().fetchGroupMeetings(GROUP);
    expect(meetings).toHaveLength(1);
    expect(meetings[0]).toMatchObject({ id: MEETING, mode: 'in_person', place: PLACE, _locked: false });
  });

  it('fails closed without the group key', async () => {
    rec.keyAvailable = false;
    const details = { title: '', mode: 'online', link: LINK, place: '', notes: '' };
    expect(await useCommunityStore.getState().saveGroupMeeting(meetingFields(details))).toEqual({ error: GROUP_ENCRYPTION_UNAVAILABLE });
    expect(rec.writes).toHaveLength(0);
  });
});
