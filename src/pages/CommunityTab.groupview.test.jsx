// @vitest-environment jsdom
//
// Behavioural safety net for GroupView's data layer BEFORE it is decomposed into
// hooks: the auto-add reconciliation, the live prayer-wall subscription, and the
// group-plan interactions (join / leave / end) that useGroupPlans now owns. These
// exercise the real GroupView against stubbed community + prayer stores, so a
// future extraction that changes behaviour fails here instead of in production.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import CommunityTab from './CommunityTab';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import usePrayerStore from '../store/prayerStore';
import { toast } from '../store/toastStore';
import { t } from '../i18n';

const lang = 'fr';
const ME = 'u1';

// A group-wall prayer with the shape PrayerListItem needs.
const wallPrayer = (id, extra = {}) => ({
  id, group_id: 'g1', user_id: 'other', author_name: 'A', is_anonymous: false,
  title: `Sujet ${id}`, description: '', is_answered: false, created_at: '2026-07-01T00:00:00Z',
  prayer_reactions: [{ count: 0 }], community_updates: [{ count: 0 }],
  ...extra,
});

function stubGroup(overrides = {}) {
  useCommunityStore.setState({
    groups: [{ id: 'g1', name: 'Groupe', role: 'member', created_by: 'owner' }],
    prayers: [],
    testimonies: [],
    loading: false,
    userReactions: new Set(),
    fetchGroups: vi.fn(),
    fetchFriends: vi.fn().mockResolvedValue({ friends: [] }),
    fetchFriendRequests: vi.fn().mockResolvedValue({ requests: [] }),
    fetchGroupInvitations: vi.fn().mockResolvedValue({ invitations: [] }),
    fetchPlanInvitations: vi.fn().mockResolvedValue({ invitations: [] }),
    fetchPendingCount: vi.fn(),
    fetchGroupActivity: vi.fn().mockResolvedValue([]),
    setActiveGroup: vi.fn(),
    addPrayer: vi.fn().mockResolvedValue({}),
    setGroupAutoAdd: vi.fn().mockResolvedValue({}),
    subscribeGroupPrayers: vi.fn(() => () => {}),
    leaveGroup: vi.fn().mockResolvedValue({}),
    fetchUserReactions: vi.fn(),
    fetchGroupPlans: vi.fn().mockResolvedValue({ plans: [] }),
    startGroupPlan: vi.fn().mockResolvedValue({}),
    joinGroupPlan: vi.fn().mockResolvedValue({}),
    leaveGroupPlan: vi.fn().mockResolvedValue({}),
    endGroupPlan: vi.fn().mockResolvedValue({}),
    subscribeGroupPlans: vi.fn(() => () => {}),
    ...overrides,
  });
}

const renderGroup = () => render(
  <MemoryRouter initialEntries={['/community/group/g1']}>
    <Routes><Route path="/community/group/:groupId" element={<CommunityTab />} /></Routes>
  </MemoryRouter>
);

beforeEach(() => {
  usePrayerStore.setState({
    settings: { language: lang }, prayers: [], categories: [],
    addPrayer: vi.fn().mockResolvedValue({}), addFromCommunity: vi.fn().mockResolvedValue({}),
  });
  useAuthStore.setState({ user: { id: ME } });
  vi.spyOn(toast, 'success').mockImplementation(() => {});
  vi.spyOn(toast, 'error').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('GroupView — auto-add reconciliation', () => {
  it('copies other members\' requests into my list when auto-add is on', async () => {
    const addFromCommunity = vi.fn().mockResolvedValue({});
    usePrayerStore.setState({ addFromCommunity });
    stubGroup({
      groups: [{ id: 'g1', name: 'Groupe', role: 'member', created_by: 'owner', autoAdd: true }],
      prayers: [wallPrayer('a'), wallPrayer('b')],
    });
    renderGroup();

    await screen.findByText('Sujet a');
    // Both wall prayers belong to 'other', so both get copied, tagged with the group.
    await waitFor(() => expect(addFromCommunity).toHaveBeenCalledTimes(2));
    expect(addFromCommunity).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), 'Groupe');
  });

  it('never re-copies my own requests', async () => {
    const addFromCommunity = vi.fn().mockResolvedValue({});
    usePrayerStore.setState({ addFromCommunity });
    stubGroup({
      groups: [{ id: 'g1', name: 'Groupe', role: 'member', created_by: 'owner', autoAdd: true }],
      prayers: [wallPrayer('mine', { user_id: ME }), wallPrayer('theirs')],
    });
    renderGroup();

    await screen.findByText('Sujet mine');
    await waitFor(() => expect(addFromCommunity).toHaveBeenCalledTimes(1));
    expect(addFromCommunity).toHaveBeenCalledWith(expect.objectContaining({ id: 'theirs' }), 'Groupe');
  });

  it('does nothing when auto-add is off', async () => {
    const addFromCommunity = vi.fn().mockResolvedValue({});
    usePrayerStore.setState({ addFromCommunity });
    stubGroup({ prayers: [wallPrayer('a')] }); // group.autoAdd is undefined
    renderGroup();

    await screen.findByText('Sujet a');
    expect(addFromCommunity).not.toHaveBeenCalled();
  });
});

describe('GroupView — live prayer wall', () => {
  it('subscribes to the group on mount and unsubscribes on unmount', async () => {
    const unsubscribe = vi.fn();
    const subscribeGroupPrayers = vi.fn(() => unsubscribe);
    stubGroup({ prayers: [wallPrayer('a')], subscribeGroupPrayers });
    const { unmount } = renderGroup();

    await screen.findByText('Sujet a');
    expect(subscribeGroupPrayers).toHaveBeenCalledWith('g1');
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});

describe('GroupView — group plan interactions', () => {
  const withPlan = (plan) => stubGroup({
    fetchGroupPlans: vi.fn().mockResolvedValue({ plans: [plan] }),
  });

  it('joining a shared plan calls joinGroupPlan and flips to the joined badge', async () => {
    const joinGroupPlan = vi.fn().mockResolvedValue({});
    withPlan({ id: 'gp1', plan_id: 'fast3', start_date: '2999-01-01', added_by: 'other', participantCount: 2, joinedByMe: false });
    useCommunityStore.setState({ joinGroupPlan });
    renderGroup();

    fireEvent.click(await screen.findByRole('button', { name: t(lang, 'groupPlanJoinCta') }));

    await waitFor(() => expect(joinGroupPlan).toHaveBeenCalledWith('gp1', 'g1', ME));
    await waitFor(() => expect(screen.getByText(t(lang, 'groupPlanJoinedBadge'))).toBeTruthy());
    expect(screen.queryByRole('button', { name: t(lang, 'groupPlanJoinCta') })).toBeNull();
    expect(toast.success).toHaveBeenCalledWith(t(lang, 'planStarted'));
  });

  it('ending a plan I started calls endGroupPlan after confirmation and removes it', async () => {
    const endGroupPlan = vi.fn().mockResolvedValue({});
    // added_by === me ⇒ the "end" action is offered.
    withPlan({ id: 'gp1', plan_id: 'fast3', start_date: '2999-01-01', added_by: ME, participantCount: 1, joinedByMe: false });
    useCommunityStore.setState({ endGroupPlan });
    renderGroup();

    await screen.findByText(t(lang, 'groupPlansHeading'));
    // Open the plan row's overflow menu, choose End, then confirm.
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'groupPlansHeading') }));
    fireEvent.click(screen.getByText(t(lang, 'groupPlanEnd')));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'groupPlanEnd') }));

    await waitFor(() => expect(endGroupPlan).toHaveBeenCalledWith('gp1'));
    await waitFor(() => expect(screen.queryByText(t(lang, 'groupPlansHeading'))).toBeNull());
  });
});
