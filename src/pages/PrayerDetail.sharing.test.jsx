// @vitest-environment jsdom
//
// Safety net for PrayerDetail's PERSONAL-mode sharing sync BEFORE it is extracted
// into usePrayerSharing: loading the user's groups + share map on open, following
// the community copy for a saved-from-community prayer, and fetching member
// activity for a shared prayer. Renders personal mode (a `prayer` prop, no
// `communityPrayer`) with a signed-in user so the effects actually run.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

vi.mock('../lib/supabase', () => {
  const chain = {
    upsert: () => chain, insert: () => chain, update: () => chain, delete: () => chain,
    select: () => chain, eq: () => chain, in: () => chain, not: () => chain, order: () => chain,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve) => resolve({ data: [], error: null }),
  };
  return {
    supabase: {
      auth: { getSession: async () => ({ data: { session: null } }), getUser: async () => ({ data: { user: { id: 'u1' } } }) },
      from: () => chain, rpc: async () => ({ data: null, error: null }),
    },
  };
});
vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../lib/mutationQueue', () => ({ enqueue: vi.fn(), pendingPrayerIds: () => new Set() }));

import PrayerDetail from './PrayerDetail';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import useFollowUpStore from '../store/followUpStore';
import { t } from '../i18n';

const lang = 'fr';
const base = (extra = {}) => ({
  id: 'p1', title: 'Ma prière', description: 'Détails', status: 'active',
  created_at: '2026-07-01T00:00:00Z', prayer_categories: [], prayer_points: [],
  prayer_updates: [], prayer_testimonies: [], ...extra,
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: { id: 'u1' } });
  useFollowUpStore.setState({ followUps: {} });
});

const renderPersonal = (prayer, { communitySpies = {}, prayerSpies = {} } = {}) => {
  usePrayerStore.setState({
    prayers: [prayer], categories: [], completions: {}, settings: { language: lang },
    refreshFromCommunity: vi.fn(),
    fetchSharedActivity: vi.fn().mockResolvedValue({ testimonies: [], updates: [] }),
    ...prayerSpies,
  });
  useCommunityStore.setState({
    groups: [], prayers: [], prayerShares: {}, testimonies: [], userReactions: new Set(),
    fetchGroups: vi.fn(), fetchPrayerShares: vi.fn(),
    ...communitySpies,
  });
  return render(<PrayerDetail prayer={prayer} onBack={() => {}} onEdit={() => {}} lang={lang} />);
};

describe('PrayerDetail — personal-mode sharing sync', () => {
  it('loads the group list and share map on open', async () => {
    const fetchGroups = vi.fn();
    const fetchPrayerShares = vi.fn();
    renderPersonal(base(), { communitySpies: { fetchGroups, fetchPrayerShares } });

    await waitFor(() => expect(fetchPrayerShares).toHaveBeenCalledWith('u1'));
    // Groups were empty, so they're loaded too.
    expect(fetchGroups).toHaveBeenCalledWith('u1');
  });

  it('does not reload the group list when groups are already present', async () => {
    const fetchGroups = vi.fn();
    const fetchPrayerShares = vi.fn();
    renderPersonal(base(), {
      communitySpies: { groups: [{ id: 'g1', name: 'X', role: 'member' }], fetchGroups, fetchPrayerShares },
    });

    await waitFor(() => expect(fetchPrayerShares).toHaveBeenCalledWith('u1'));
    expect(fetchGroups).not.toHaveBeenCalled();
  });

  it('follows the community copy for a saved-from-community prayer', async () => {
    const refreshFromCommunity = vi.fn();
    const fetchSharedActivity = vi.fn().mockResolvedValue({ testimonies: [], updates: [] });
    renderPersonal(base({ community_origin_id: 'c9' }), { prayerSpies: { refreshFromCommunity, fetchSharedActivity } });

    await waitFor(() => expect(refreshFromCommunity).toHaveBeenCalledWith('p1'));
    // A shared prayer also pulls its member activity, keyed by the prayer.
    await waitFor(() => expect(fetchSharedActivity).toHaveBeenCalled());
    expect(fetchSharedActivity.mock.calls[0][0]).toMatchObject({ id: 'p1' });
  });

  it('neither follows nor fetches activity for a prayer that was never shared', async () => {
    const refreshFromCommunity = vi.fn();
    const fetchSharedActivity = vi.fn().mockResolvedValue({ testimonies: [], updates: [] });
    renderPersonal(base(), { prayerSpies: { refreshFromCommunity, fetchSharedActivity } });

    await waitFor(() => {}); // let effects settle
    expect(refreshFromCommunity).not.toHaveBeenCalled();
    expect(fetchSharedActivity).not.toHaveBeenCalled();
  });

  it('shows locked personal points and updates from their readable group mirrors', async () => {
    const locked = base({
      prayer_points: [{ id: 'pt1', title: '', verses: [], _locked: true }],
      prayer_updates: [{
        id: 'up1', prayer_id: 'p1', text: '', attachments: [], _locked: true,
        author_name: 'Cabrel Fokam', created_at: '2026-06-29T10:00:00Z',
      }],
    });
    const fetchSharedActivity = vi.fn().mockResolvedValue({
      prayers: [{
        id: 'cp1', group_id: 'g1',
        prayer_points: [{ id: 'pt1', title: 'Prier pour la guérison', verses: [] }],
      }],
      updates: [{
        id: 'cup1', community_prayer_id: 'cp1', text: 'La situation va mieux', attachments: [],
        author_name: 'Cabrel Fokam', created_at: '2026-06-29T10:00:01Z',
      }],
      testimonies: [],
    });
    renderPersonal(locked, {
      communitySpies: { prayerShares: { p1: [{ groupId: 'g1', groupName: 'Église' }] } },
      prayerSpies: { fetchSharedActivity },
    });

    expect(await screen.findByText('Prier pour la guérison')).toBeTruthy();
    expect(await screen.findByText('La situation va mieux')).toBeTruthy();
    expect(screen.queryByText(t(lang, 'updateSyncing'))).toBeNull();
    // The mirror is a recovery view, not permission to overwrite ciphertext the
    // current device cannot authenticate.
    expect(screen.queryByRole('button', { name: t(lang, 'tipRemovePoint') })).toBeNull();
    expect(screen.queryByText(t(lang, 'addVerse'))).toBeNull();
  });
});
