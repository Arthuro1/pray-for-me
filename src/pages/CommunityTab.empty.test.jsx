// @vitest-environment jsdom
//
// An empty Community account gets ONE onboarding card — Join (primary), Create
// (secondary), Add friend (quiet link) — and no second "My groups" empty state
// with another Join button. Once groups exist, the list leads and creating /
// befriending shrink into header actions.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import CommunityTab from './CommunityTab';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';

const lang = 'fr';
afterEach(cleanup);

function stubCommunity(overrides = {}) {
  useCommunityStore.setState({
    groups: [],
    fetchGroups: vi.fn(),
    fetchFriends: vi.fn().mockResolvedValue({ friends: [] }),
    fetchFriendRequests: vi.fn().mockResolvedValue({ requests: [] }),
    fetchGroupInvitations: vi.fn().mockResolvedValue({ invitations: [] }),
    fetchPlanInvitations: vi.fn().mockResolvedValue({ invitations: [] }),
    fetchPendingCount: vi.fn(),
    fetchGroupActivity: vi.fn().mockResolvedValue([]),
    fetchCommunityFeed: vi.fn().mockResolvedValue([]),
    ...overrides,
  });
}

beforeEach(() => {
  usePrayerStore.setState({ settings: { language: lang } });
  useAuthStore.setState({ user: { id: 'u1' } });
});

const renderCommunity = () =>
  render(<MemoryRouter><CommunityTab /></MemoryRouter>);

describe('CommunityTab — empty state consolidation', () => {
  it('shows one onboarding card with join-first hierarchy and NO duplicate empty section', async () => {
    stubCommunity();
    renderCommunity();
    expect(await screen.findByText(t(lang, 'prayWithOthers'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'communityEmptyDesc'))).toBeTruthy();
    // Exactly ONE Join action on the page — the old "My groups" empty state
    // (with its second Join button) is gone.
    expect(screen.getAllByText(t(lang, 'joinGroupCta'))).toHaveLength(1);
    expect(screen.queryByText(t(lang, 'myGroups'))).toBeNull();
    expect(screen.queryByText(t(lang, 'noGroups'))).toBeNull();
    // Create group and Add friend are present, secondary and quiet.
    expect(screen.getAllByText(t(lang, 'createGroup'))).toHaveLength(1);
    expect(screen.getAllByText(t(lang, 'addFriend'))).toHaveLength(1);
    // Each action carries a clear line icon (an inline SVG, currentColor).
    expect(screen.getByRole('button', { name: t(lang, 'joinGroupCta') }).querySelector('svg')).toBeTruthy();
    expect(screen.getByRole('button', { name: t(lang, 'createGroup') }).querySelector('svg')).toBeTruthy();
    expect(screen.getByRole('button', { name: t(lang, 'addFriend') }).querySelector('svg')).toBeTruthy();
  });

  it('once groups exist, the list leads and create/add-friend shrink into header actions', async () => {
    stubCommunity({ groups: [{ id: 'g1', name: 'Groupe Familial', role: 'member' }] });
    renderCommunity();
    expect(await screen.findByText('Groupe Familial')).toBeTruthy();
    expect(screen.getByText(t(lang, 'myGroups'))).toBeTruthy();
    // The onboarding card is gone; its big buttons are replaced by small
    // icon actions in the header.
    expect(screen.queryByText(t(lang, 'prayWithOthers'))).toBeNull();
    // The header actions are icon-only buttons, each with an inline SVG icon.
    expect(screen.getByRole('button', { name: t(lang, 'joinGroupCta') }).querySelector('svg')).toBeTruthy();
    expect(screen.getByRole('button', { name: t(lang, 'createGroup') }).querySelector('svg')).toBeTruthy();
    expect(screen.getByRole('button', { name: t(lang, 'addFriend') }).querySelector('svg')).toBeTruthy();
  });

  it('does not load or render a prayer-request feed on the Community hub', async () => {
    const fetchCommunityFeed = vi.fn().mockResolvedValue([{
      id: 'p1',
      group_id: 'g1',
      title: 'Hidden hub request',
      created_at: '2026-07-01T00:00:00Z',
      prayer_reactions: [{ count: 2 }],
    }]);
    stubCommunity({
      groups: [{ id: 'g1', name: 'Groupe Familial', role: 'member' }],
      fetchCommunityFeed,
    });
    renderCommunity();

    expect(await screen.findByText('Groupe Familial')).toBeTruthy();
    expect(fetchCommunityFeed).not.toHaveBeenCalled();
    expect(screen.queryByText(t(lang, 'prayerRequests'))).toBeNull();
    expect(screen.queryByText('Hidden hub request')).toBeNull();
  });
});

describe('GroupView — progressive list tools', () => {
  const wallPrayer = (id, extra = {}) => ({
    id, group_id: 'g1', user_id: 'other', author_name: 'A', is_anonymous: false,
    title: `Sujet ${id}`, description: '', is_answered: false, created_at: '2026-07-01T00:00:00Z',
    prayer_reactions: [{ count: 0 }], community_updates: [{ count: 0 }],
    ...extra,
  });

  const stubGroupView = (prayers) => stubCommunity({
    groups: [{ id: 'g1', name: 'Groupe', role: 'member' }],
    prayers,
    loading: false,
    testimonies: [],
    userReactions: new Set(),
    setActiveGroup: vi.fn(),
    subscribeGroupPrayers: vi.fn(() => () => {}),
    fetchUserReactions: vi.fn(),
  });

  const renderGroup = () => render(
    <MemoryRouter initialEntries={['/community/group/g1']}>
      <Routes><Route path="/community/group/:groupId" element={<CommunityTab />} /></Routes>
    </MemoryRouter>
  );

  it('a tiny all-active group shows neither search nor status filters', async () => {
    stubGroupView([wallPrayer('a'), wallPrayer('b')]);
    renderGroup();
    expect(await screen.findByText('Sujet a')).toBeTruthy();
    expect(screen.queryByPlaceholderText(t(lang, 'searchRequests'))).toBeNull();
    expect(screen.queryByRole('button', { name: t(lang, 'answered') })).toBeNull();
  });

  it('status filters appear once BOTH active and answered requests exist', async () => {
    stubGroupView([wallPrayer('a'), wallPrayer('b', { is_answered: true })]);
    renderGroup();
    expect(await screen.findByText('Sujet a')).toBeTruthy();
    expect(screen.getByRole('button', { name: t(lang, 'answered') })).toBeTruthy();
    // Still too few requests for search.
    expect(screen.queryByPlaceholderText(t(lang, 'searchRequests'))).toBeNull();
  });

  it('search appears once the wall is long enough to need it', async () => {
    stubGroupView(Array.from({ length: 6 }, (_, i) => wallPrayer(String(i))));
    renderGroup();
    expect(await screen.findByText('Sujet 0')).toBeTruthy();
    expect(screen.getByPlaceholderText(t(lang, 'searchRequests'))).toBeTruthy();
  });
});
