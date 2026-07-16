// @vitest-environment jsdom
//
// An empty Community account gets ONE onboarding card — Join (primary), Create
// (secondary), Add friend (quiet link) — and no second "My groups" empty state
// with another Join button. Once groups exist, the list leads and creating /
// befriending shrink into header actions.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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
    fetchPendingCount: vi.fn(),
    fetchGroupActivity: vi.fn().mockResolvedValue([]),
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
  });

  it('once groups exist, the list leads and create/add-friend shrink into header actions', async () => {
    stubCommunity({ groups: [{ id: 'g1', name: 'Groupe Familial', role: 'member' }] });
    renderCommunity();
    expect(await screen.findByText('Groupe Familial')).toBeTruthy();
    expect(screen.getByText(t(lang, 'myGroups'))).toBeTruthy();
    // The onboarding card is gone; its big buttons are replaced by small
    // icon actions in the header.
    expect(screen.queryByText(t(lang, 'prayWithOthers'))).toBeNull();
    expect(screen.getByRole('button', { name: t(lang, 'createGroup') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t(lang, 'addFriend') })).toBeTruthy();
  });
});
