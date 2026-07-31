// @vitest-environment jsdom
//
// Safety net for the community-updates timeline in PrayerDetail BEFORE it is
// extracted into a hook (useCommunityPrayerUpdates): the fetch-on-open, the
// send/delete handlers (with optimistic removal + refetch), and the live
// activity subscription's setup/teardown. Unlike the other PrayerDetail tests
// this does NOT mock CommunityUpdates away — instead it renders a prop-exposing
// stand-in that surfaces the data + handlers so they can be driven directly.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

vi.mock('../lib/supabase', () => {
  const chain = {
    upsert: () => chain, insert: () => chain, update: () => chain, delete: () => chain,
    select: () => chain, eq: () => chain, in: () => chain, not: () => chain, order: () => chain,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve) => resolve({ data: [], error: null }),
  };
  const channel = { on: () => channel, subscribe: () => channel };
  return {
    supabase: {
      auth: { getSession: async () => ({ data: { session: null } }), getUser: async () => ({ data: { user: { id: 'u1' } } }) },
      from: () => chain, rpc: async () => ({ data: null, error: null }),
      channel: () => channel, removeChannel: () => {},
    },
  };
});
vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../lib/mutationQueue', () => ({ enqueue: vi.fn(), pendingPrayerIds: () => new Set() }));
vi.mock('../components/GroupPrayerCalendar', () => ({ default: () => null }));
vi.mock('../components/CommunityTestimonies', () => ({ default: () => null }));
vi.mock('../components/FollowPrayerButton', () => ({ default: () => null }));
vi.mock('../components/rich/UpdateComposer', () => ({ default: () => null }));

// A prop-exposing stand-in: it renders the timeline and offers buttons that call
// the send/delete handlers the way the real composer/menu would.
vi.mock('../components/CommunityUpdates', () => ({
  default: ({ updates, loading, onSend, onDelete }) => (
    <div>
      <span data-testid="loading">{String(!!loading)}</span>
      <ul>{updates.map((u) => <li key={u.id}>{u.text}</li>)}</ul>
      <button onClick={() => onSend('A new word', [], false)}>send-word</button>
      <button onClick={() => onDelete('up1')}>delete-word</button>
    </div>
  ),
}));

import PrayerDetail from './PrayerDetail';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import useFollowUpStore from '../store/followUpStore';
import { toast } from '../store/toastStore';
import { t } from '../i18n';

const lang = 'fr';

const communityPrayer = (extra = {}) => ({
  id: 'c1', group_id: 'g1', user_id: 'u1', source_prayer_id: 'p1',
  title: 'Prière partagée', description: 'Détails', author_name: 'Grace',
  created_at: '2026-07-01T00:00:00Z', is_answered: false, category_ids: [], prayer_points: [],
  ...extra,
});

const wordRow = (id, text) => ({ id, text, author_name: 'Ami', created_at: '2026-07-01T00:00:00Z', attachments: [] });

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: { id: 'u1' } });
  useFollowUpStore.setState({ followUps: {} });
  usePrayerStore.setState({ prayers: [], categories: [], completions: {}, settings: { language: lang } });
});

const renderCommunity = (communitySpies = {}) => {
  useCommunityStore.setState({
    groups: [{ id: 'g1', name: 'Église', role: 'member' }],
    prayers: [communityPrayer()], prayerShares: {}, testimonies: [], userReactions: new Set(),
    subscribePrayerActivity: vi.fn(() => () => {}),
    refreshPrayer: vi.fn(),
    fetchUserReactions: vi.fn(),
    fetchPrayerUpdates: vi.fn().mockResolvedValue([wordRow('up1', 'Existing word')]),
    addUpdate: vi.fn().mockResolvedValue({}),
    deleteCommunityUpdate: vi.fn().mockResolvedValue({}),
    editCommunityUpdate: vi.fn().mockResolvedValue({}),
    ...communitySpies,
  });
  return render(<PrayerDetail communityPrayer={communityPrayer()} onBack={() => {}} onEdit={() => {}} lang={lang} />);
};

describe('PrayerDetail — community updates timeline', () => {
  it('fetches the timeline on open and renders it', async () => {
    const fetchPrayerUpdates = vi.fn().mockResolvedValue([wordRow('up1', 'Existing word')]);
    renderCommunity({ fetchPrayerUpdates });

    expect(await screen.findByText('Existing word')).toBeTruthy();
    expect(fetchPrayerUpdates).toHaveBeenCalledWith('c1');
  });

  it('sending a word calls addUpdate, then refetches the timeline', async () => {
    const addUpdate = vi.fn().mockResolvedValue({});
    const fetchPrayerUpdates = vi.fn()
      .mockResolvedValueOnce([wordRow('up1', 'Existing word')])
      .mockResolvedValue([wordRow('up1', 'Existing word'), wordRow('up2', 'A new word')]);
    renderCommunity({ addUpdate, fetchPrayerUpdates });

    await screen.findByText('Existing word');
    fireEvent.click(screen.getByText('send-word'));

    await waitFor(() => expect(addUpdate).toHaveBeenCalledWith(expect.objectContaining({
      prayerId: 'c1', userId: 'u1', text: 'A new word',
    })));
    // Refetched → the new word appears.
    expect(await screen.findByText('A new word')).toBeTruthy();
  });

  it('deleting a word optimistically removes it and calls deleteCommunityUpdate', async () => {
    const deleteCommunityUpdate = vi.fn().mockResolvedValue({});
    vi.spyOn(toast, 'success').mockImplementation(() => {});
    renderCommunity({ deleteCommunityUpdate });

    await screen.findByText('Existing word');
    fireEvent.click(screen.getByText('delete-word'));

    // Optimistic: the row disappears immediately.
    await waitFor(() => expect(screen.queryByText('Existing word')).toBeNull());
    expect(deleteCommunityUpdate).toHaveBeenCalledWith('up1', 'c1');
    expect(toast.success).toHaveBeenCalledWith(t(lang, 'wordDeleted'));
  });

  it('subscribes to live activity on open and unsubscribes on unmount', async () => {
    const unsubscribe = vi.fn();
    const subscribePrayerActivity = vi.fn(() => unsubscribe);
    const { unmount } = renderCommunity({ subscribePrayerActivity });

    await screen.findByText('Existing word');
    expect(subscribePrayerActivity).toHaveBeenCalledWith('c1', expect.any(Object));
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
