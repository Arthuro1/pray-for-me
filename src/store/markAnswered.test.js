// @vitest-environment jsdom
//
// Marking a prayer answered flips its status, stamps answered_at, queues the
// server write, records the (content-free) event, and — when a testimony is
// given — appends it as a new row without overwriting siblings.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub the Supabase client (its realtime layer throws at construct time on older
// Node in CI) and the offline mutation queue (IndexedDB isn't in jsdom).
vi.mock('../lib/supabase', () => {
  const chain = {
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => chain,
    eq: () => Promise.resolve({ data: null, error: null }),
    select: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return { supabase: { auth: { getUser: async () => ({ data: { user: null } }) }, from: () => chain } };
});
vi.mock('../lib/mutationQueue', () => ({ enqueue: vi.fn(), pendingPrayerIds: vi.fn(() => new Set()) }));
vi.mock('../lib/analytics', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, track: vi.fn() };
});

import usePrayerStore from './prayerStore';
import { enqueue } from '../lib/mutationQueue';
import { track, EVENTS } from '../lib/analytics';

const seed = (extra = {}) => ({ id: 'p1', title: 'x', status: 'active', prayer_testimonies: [], ...extra });

beforeEach(() => {
  usePrayerStore.setState({ prayers: [seed()], userId: null });
  vi.clearAllMocks();
});

describe('prayerStore.markAnswered', () => {
  it('flips status to answered, stamps answered_at, queues + records it', async () => {
    await usePrayerStore.getState().markAnswered('p1');
    const p = usePrayerStore.getState().prayers.find((x) => x.id === 'p1');
    expect(p.status).toBe('answered');
    expect(p.answered_at).toBeTruthy();
    expect(enqueue).toHaveBeenCalledWith('markAnswered', expect.objectContaining({ id: 'p1' }));
    expect(track).toHaveBeenCalledWith(EVENTS.PRAYER_ANSWERED);
  });

  it('appends a testimony as a new row when one is given', async () => {
    await usePrayerStore.getState().markAnswered('p1', 'God provided');
    const p = usePrayerStore.getState().prayers.find((x) => x.id === 'p1');
    expect(p.status).toBe('answered');
    expect(p.prayer_testimonies).toHaveLength(1);
    expect(p.prayer_testimonies[0].content).toBe('God provided');
  });

  it('does not add a testimony row for an empty/whitespace testimony', async () => {
    await usePrayerStore.getState().markAnswered('p1', '   ');
    const p = usePrayerStore.getState().prayers.find((x) => x.id === 'p1');
    expect(p.prayer_testimonies).toHaveLength(0);
  });
});
