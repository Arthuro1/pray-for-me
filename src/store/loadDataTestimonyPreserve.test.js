// @vitest-environment jsdom
//
// Regression: a testimony written while marking a prayer answered is persisted
// through the offline mutation queue. If loadData refetches before that write
// reaches the server (still queued, offline, or mid-flush), reconciling against
// server truth must NOT drop the optimistic testimony — otherwise it vanishes
// from the reopened answered prayer. Mirrors the completions union in loadData.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mutable fixture the mocked Supabase reads from; each test seeds it.
const db = vi.hoisted(() => ({ prayersRows: [], categoriesRows: [] }));

vi.mock('../lib/supabase', () => {
  const dataFor = (table) => ({
    data: table === 'prayers' ? db.prayersRows
      : table === 'categories' ? db.categoriesRows
      : [], // prayer_completions, community_prayers, etc.
    error: null,
    status: 200,
  });
  const makeQuery = (table) => {
    const chain = {
      select: () => chain,
      update: () => chain,
      upsert: () => chain,
      insert: () => chain,
      delete: () => chain,
      eq: () => chain,
      in: () => chain,
      not: () => chain,
      gte: () => chain,
      order: () => Promise.resolve(dataFor(table)),
      maybeSingle: () => Promise.resolve({ data: null, error: null, status: 200 }),
      single: () => Promise.resolve({ data: null, error: null, status: 200 }),
      then: (resolve) => resolve(dataFor(table)),
    };
    return chain;
  };
  return {
    supabase: {
      auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
      from: (table) => makeQuery(table),
      rpc: async () => ({ data: null, error: null, status: 200 }),
    },
  };
});

// The local snapshot hydrates the optimistic testimony across a fresh session.
const snapshot = vi.hoisted(() => ({ value: null }));
vi.mock('../lib/dataCache', () => ({
  loadSnapshot: async () => snapshot.value,
  saveSnapshot: vi.fn(),
}));

// Nothing queued as a create; the testimony write is elsewhere in the queue.
vi.mock('../lib/mutationQueue', () => ({ enqueue: vi.fn(), pendingPrayerIds: vi.fn(() => new Set()) }));
// syncSettings is fire-and-forget; keep it inert so it never touches the network.
vi.mock('../lib/settingsSync', () => ({
  fetchUserSettings: async () => null,
  saveUserSettings: async () => {},
  touchesSyncedSettings: () => false,
}));
vi.mock('../push', () => ({ ensurePushSubscription: async () => {} }));
vi.mock('../lib/notificationPrefs', () => ({ isEventPushEnabled: async () => false }));
vi.mock('../lib/analytics', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, track: vi.fn() };
});

import usePrayerStore from './prayerStore';
import { testimonyList } from '../utils/prayer';

const answeredPrayer = (extra = {}) => ({
  id: 'p1', user_id: 'user-1', title: 'Healing', status: 'answered',
  community_origin_id: null, encryption_version: null, answered_at: '2026-07-15T10:00:00Z',
  prayer_updates: [], prayer_points: [], prayer_categories: [],
  prayer_testimonies: [], ...extra,
});

const testimonyRow = { id: 't-local', prayer_id: 'p1', content: 'God provided', author_name: '', created_at: '2026-07-15T10:00:00Z' };

beforeEach(() => {
  db.categoriesRows = [{ id: 'c1', user_id: 'user-1', name: 'Health', sort_order: 0 }];
  snapshot.value = null;
  usePrayerStore.setState({ prayers: [], categories: [], completions: {}, userId: null });
  vi.clearAllMocks();
});

describe('loadData testimony reconciliation', () => {
  it('keeps an optimistic testimony the server copy does not yet carry', async () => {
    // Local (snapshot + in-memory) has the just-written testimony; the server
    // prayer does not yet — its addTestimonyRow write is still queued.
    const local = answeredPrayer({ prayer_testimonies: [testimonyRow] });
    snapshot.value = { categories: [], prayers: [local], completions: {} };
    db.prayersRows = [answeredPrayer({ prayer_testimonies: [] })];

    await usePrayerStore.getState().loadData('user-1');

    const p = usePrayerStore.getState().prayers.find((x) => x.id === 'p1');
    expect(testimonyList(p).map((tm) => tm.content)).toEqual(['God provided']);
  });

  it('does not duplicate a testimony once the server has caught up', async () => {
    const local = answeredPrayer({ prayer_testimonies: [testimonyRow] });
    snapshot.value = { categories: [], prayers: [local], completions: {} };
    // Server now carries the same row (write flushed), same id.
    db.prayersRows = [answeredPrayer({ prayer_testimonies: [{ ...testimonyRow }] })];

    await usePrayerStore.getState().loadData('user-1');

    const p = usePrayerStore.getState().prayers.find((x) => x.id === 'p1');
    expect(testimonyList(p)).toHaveLength(1);
  });

  it('takes server testimonies when there is nothing pending locally', async () => {
    snapshot.value = { categories: [], prayers: [answeredPrayer()], completions: {} };
    db.prayersRows = [answeredPrayer({ prayer_testimonies: [{ ...testimonyRow, id: 't-server' }] })];

    await usePrayerStore.getState().loadData('user-1');

    const p = usePrayerStore.getState().prayers.find((x) => x.id === 'p1');
    expect(testimonyList(p).map((tm) => tm.content)).toEqual(['God provided']);
  });
});
