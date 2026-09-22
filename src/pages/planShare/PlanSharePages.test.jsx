// @vitest-environment jsdom
//
// The two pages a shared plan link opens: the public one (no account yet) and
// the signed-in one that finishes the join. French is the always-loaded locale.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const api = vi.hoisted(() => ({
  resolvePlanShareLink: vi.fn(),
  recordPlanShareJoin: vi.fn(),
}));
vi.mock('../../lib/planShareApi', () => api);
vi.mock('../../lib/analytics', () => ({ track: vi.fn(), EVENTS: { PLAN_LINK_JOINED: 'plan_link_joined' } }));

// Minimal stores: the pages only read a few fields and call three actions.
const state = vi.hoisted(() => ({
  prayer: { settings: { language: 'fr' }, prayers: [], loading: false, addPrayer: null },
  auth: { user: { id: 'me' } },
  community: { fetchFriends: null, sendFriendRequestToId: null },
}));
vi.mock('../../store/prayerStore', () => ({ default: (select) => select(state.prayer) }));
vi.mock('../../store/authStore', () => ({ default: (select) => select(state.auth) }));
vi.mock('../../store/communityStore', () => ({ default: (select) => select(state.community) }));

import PlanSharePublicPage from './PlanSharePublicPage';
import PlanJoinPage from './PlanJoinPage';
import { PLANS } from '../../content/prayerPlans';
import { PREPARING_IN_PRAYER } from '../../content/plans/preparingInPrayer';
import { pick } from '../../content/teaching';
import { savePendingPlanJoin } from '../../lib/planShareLink';
import { todayKey } from '../../lib/prayedLog';
import { t } from '../../i18n';

const lang = 'fr';
const plan = PLANS.find((p) => p.id === 'altar7');
const TOKEN = 'AbCdEfGhIjKlMnOpQrStUv';
const PATH = `/plans/altar7/${TOKEN}`;

function at(path, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/plans/:planId/:token?" element={element} />
        <Route path="/prayers/:id" element={<p>prayer page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  api.resolvePlanShareLink.mockResolvedValue({ data: { planId: 'altar7', inviterFirstName: 'Arthur', inviterId: 'arthur', active: true } });
  api.recordPlanShareJoin.mockResolvedValue({ data: true });
  state.prayer.prayers = [];
  state.prayer.loading = false;
  state.prayer.addPrayer = vi.fn(async () => 'new-prayer');
  state.community.fetchFriends = vi.fn(async () => ({ friends: [] }));
  state.community.sendFriendRequestToId = vi.fn(async () => ({}));
});

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('PlanSharePublicPage', () => {
  it('shows the whole plan and who invites, before any account is asked for', async () => {
    at(PATH, <PlanSharePublicPage lang={lang} onJoin={vi.fn()} onSignIn={vi.fn()} />);
    expect(await screen.findByText(t(lang, 'planShareInvitedBy', { name: 'Arthur' }))).toBeTruthy();
    expect(screen.getByText(t(lang, plan.titleKey))).toBeTruthy();
    expect(screen.getByText(pick(plan.intro, lang))).toBeTruthy();
    for (const day of plan.days) expect(screen.getByText(pick(day.theme, lang))).toBeTruthy();
  });

  it('previews a long plan the way the catalogue does: movements first, every day on request', async () => {
    at(`/plans/${PREPARING_IN_PRAYER.id}`, <PlanSharePublicPage lang={lang} onJoin={vi.fn()} onSignIn={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(t(lang, 'planShareJoin')).closest('button').disabled).toBe(false));
    for (const movement of PREPARING_IN_PRAYER.movements) expect(screen.getByText(t(lang, movement.titleKey))).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: t(lang, 'previewAllDays') }));
    expect(screen.getByText(pick(PREPARING_IN_PRAYER.days.at(-1).theme, lang))).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: t(lang, 'gospelReadMore') }));
    expect(screen.getByText(pick(PREPARING_IN_PRAYER.biblical.text, lang))).toBeTruthy();
  });

  it('remembers the choice across sign-up, then hands over to the account screen', async () => {
    const onJoin = vi.fn();
    at(PATH, <PlanSharePublicPage lang={lang} onJoin={onJoin} onSignIn={vi.fn()} />);
    await screen.findByText(t(lang, 'planShareInvitedBy', { name: 'Arthur' }));
    fireEvent.click(screen.getByText(t(lang, 'planShareJoin')));
    expect(onJoin).toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem('pfm_pending_plan_join'))).toMatchObject({ planId: 'altar7', token: TOKEN, startDate: todayKey() });
  });

  it('is simply the plan when the link was turned off', async () => {
    api.resolvePlanShareLink.mockResolvedValue({ data: { planId: 'altar7', inviterFirstName: null, inviterId: null, active: false } });
    const onJoin = vi.fn();
    at(PATH, <PlanSharePublicPage lang={lang} onJoin={onJoin} onSignIn={vi.fn()} />);
    expect(await screen.findByText(t(lang, 'planShareInvited'))).toBeTruthy();
    await waitFor(() => expect(screen.getByText(t(lang, 'planShareJoin')).closest('button').disabled).toBe(false));
    fireEvent.click(screen.getByText(t(lang, 'planShareJoin')));
    expect(JSON.parse(localStorage.getItem('pfm_pending_plan_join')).token).toBe(null);
  });

  it('says so for a plan that does not exist', () => {
    at('/plans/nope', <PlanSharePublicPage lang={lang} onJoin={vi.fn()} onSignIn={vi.fn()} />);
    expect(screen.getByText(t(lang, 'planShareUnavailable'))).toBeTruthy();
  });
});

describe('PlanJoinPage', () => {
  it('starts the plan chosen before sign-up, counts the join and offers the friend request', async () => {
    savePendingPlanJoin({ planId: 'altar7', token: TOKEN, startDate: todayKey() });
    at(PATH, <PlanJoinPage />);
    expect(await screen.findByText(t(lang, 'journeyBeginsToday'))).toBeTruthy();
    expect(state.prayer.addPrayer).toHaveBeenCalledTimes(1);
    expect(state.prayer.addPrayer.mock.calls[0][0].schedule.plan).toMatchObject({ id: 'altar7', startDate: todayKey() });
    expect(api.recordPlanShareJoin).toHaveBeenCalledWith(TOKEN, 'altar7');
    expect(localStorage.getItem('pfm_onboarded')).toBe('1');
    expect(localStorage.getItem('pfm_pending_plan_join')).toBe(null);

    fireEvent.click(await screen.findByText(t(lang, 'planShareAddFriend', { name: 'Arthur' })));
    await waitFor(() => expect(state.community.sendFriendRequestToId).toHaveBeenCalledWith('arthur', 'me'));
    expect(await screen.findByText(t(lang, 'requestSent'))).toBeTruthy();
  });

  it('waits for the journal before starting, so an existing run is never duplicated', async () => {
    savePendingPlanJoin({ planId: 'altar7', token: TOKEN, startDate: todayKey() });
    state.prayer.loading = true;
    const view = at(PATH, <PlanJoinPage />);
    await screen.findByText(t(lang, 'planShareJoin'));
    expect(state.prayer.addPrayer).not.toHaveBeenCalled();

    state.prayer.loading = false;
    state.prayer.prayers = [{
      id: 'running-1',
      status: 'active',
      schedule: { type: 'recurring', freq: 'daily', startDate: todayKey(), end: { kind: 'count', count: 7 }, plan: { id: 'altar7', startDate: todayKey() } },
    }];
    view.rerender(
      <MemoryRouter initialEntries={[PATH]}>
        <Routes><Route path="/plans/:planId/:token?" element={<PlanJoinPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText(t(lang, 'planShareAlreadyRunning'))).toBeTruthy();
    expect(state.prayer.addPrayer).not.toHaveBeenCalled();
  });

  it('asks an existing member before starting anything', async () => {
    at(PATH, <PlanJoinPage />);
    fireEvent.click(await screen.findByText(t(lang, 'planShareJoin')));
    expect(await screen.findByText(t(lang, 'journeyBeginsToday'))).toBeTruthy();
    expect(state.prayer.addPrayer).toHaveBeenCalledTimes(1);
  });

  it('never counts the sharer opening their own link', async () => {
    api.resolvePlanShareLink.mockResolvedValue({ data: { planId: 'altar7', inviterFirstName: 'Arthur', inviterId: 'me', active: true } });
    at(PATH, <PlanJoinPage />);
    expect(await screen.findByText(t(lang, 'planShareOwnLink'))).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'planShareJoin')));
    await screen.findByText(t(lang, 'journeyBeginsToday'));
    expect(api.recordPlanShareJoin).not.toHaveBeenCalled();
    expect(screen.queryByText(t(lang, 'planShareAddFriend', { name: 'Arthur' }))).toBeNull();
  });

  it('offers no friend request to someone who is already a friend', async () => {
    state.community.fetchFriends = vi.fn(async () => ({ friends: [{ id: 'arthur', name: 'Arthur' }] }));
    at(PATH, <PlanJoinPage />);
    fireEvent.click(await screen.findByText(t(lang, 'planShareJoin')));
    await screen.findByText(t(lang, 'journeyBeginsToday'));
    await waitFor(() => expect(state.community.fetchFriends).toHaveBeenCalled());
    expect(screen.queryByText(t(lang, 'planShareAddFriend', { name: 'Arthur' }))).toBeNull();
  });
});
