// @vitest-environment jsdom
//
// Carrying a group request, then placing it on one's own altar. Carrying is ONE
// action: the wall row shows only "Carry this prayer"; the confirmation toast
// offers "Choose a circle", which can be ignored. The circle is the CARRIER's:
// it is written to their own copy only — never to the group's request, never
// through a community action — and it is independent of anything the author
// chose.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { act, render, screen, fireEvent, cleanup, within } from '@testing-library/react';

vi.mock('../../lib/supabase', () => {
  const chain = {
    upsert: () => chain, insert: () => chain, update: () => chain, delete: () => chain, select: () => chain,
    eq: () => chain, in: () => chain, not: () => chain, order: () => chain,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve) => resolve({ data: [], error: null }),
  };
  return {
    supabase: {
      auth: { getSession: async () => ({ data: { session: null } }), getUser: async () => ({ data: { user: null } }) },
      from: () => chain,
      rpc: async () => ({ data: null, error: null }),
    },
  };
});
vi.mock('../../lib/mutationQueue', () => ({ enqueue: vi.fn(), pendingPrayerIds: () => new Set() }));
const crypto = vi.hoisted(() => ({ canHold: true }));
vi.mock('../../lib/crypto/prayerCrypto', async (orig) => ({
  ...(await orig()),
  canHoldPrivateMetadata: () => crypto.canHold,
}));

import GroupPrayerRow from './GroupPrayerRow';
import Toaster from '../../components/shared/Toaster';
import CarryPlacementHost from '../../components/circles/CarryPlacementHost';
import usePrayerStore from '../../store/prayerStore';
import useCommunityStore from '../../store/communityStore';
import useToastStore from '../../store/toastStore';
import { t } from '../../i18n';

const lang = 'fr';
const user = { id: 'me', user_metadata: { full_name: 'Moi' } };
// The author placed this in THEIR "My house" — a value the carrier never inherits.
const request = {
  id: 'c-1', group_id: 'g-1', user_id: 'author', author_name: 'Marie', is_anonymous: false,
  title: 'Pour ma mère', description: '', created_at: '2026-10-01T00:00:00Z', circle: 'household',
  prayer_reactions: [{ count: 0 }], community_updates: [{ count: 0 }],
};
const copyOf = (extra = {}) => ({
  id: 'copy-1', community_origin_id: 'c-1', title: 'Pour ma mère', status: 'active',
  prayer_categories: [], prayer_points: [], prayer_updates: [], prayer_testimonies: [], ...extra,
});

const community = {
  toggleReaction: vi.fn(),
  setCommunityAnswered: vi.fn(),
  addTestimony: vi.fn(),
};
const updatePrayer = vi.fn((id, { circle }) => {
  usePrayerStore.setState((s) => ({ prayers: s.prayers.map((p) => (p.id === id ? { ...p, circle } : p)) }));
});

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  crypto.canHold = true;
  useToastStore.setState({ toasts: [] });
  community.toggleReaction.mockImplementation(async (id) => {
    useCommunityStore.setState((s) => {
      const next = new Set(s.userReactions);
      if (next.has(id)) next.delete(id); else next.add(id);
      return { userReactions: next };
    });
  });
  useCommunityStore.setState({ groups: [{ id: 'g-1', name: 'Église' }], userReactions: new Set(), ...community });
  usePrayerStore.setState({
    prayers: [],
    settings: { language: lang },
    updatePrayer,
    addFromCommunity: vi.fn(async () => {
      const copy = copyOf();
      usePrayerStore.setState({ prayers: [copy] });
      return { prayer: copy };
    }),
    softDeletePrayer: vi.fn(),
  });
});

// The wall row, plus the app-wide toast and placement dialog it hands off to.
const renderRow = () => render(
  <>
    <ul><GroupPrayerRow prayer={request} user={user} lang={lang} onOpen={() => {}} /></ul>
    <Toaster />
    <CarryPlacementHost />
  </>,
);
const carry = () => screen.getByRole('button', { name: t(lang, 'carryThisPrayer') });
const chooseCircle = () => screen.queryByRole('button', { name: t(lang, 'carryChooseCircle') });
const row = () => document.querySelector('.together-prayer');

describe('GroupPrayerRow — carry, then place on your altar', () => {
  it('carrying is one action: the row keeps one control, the toast offers a circle', async () => {
    renderRow();
    expect(within(row()).getAllByRole('button').map((b) => b.textContent)).not.toContain(t(lang, 'carryChooseCircle'));
    await act(async () => { fireEvent.click(carry()); });
    expect(community.toggleReaction).toHaveBeenCalledTimes(1);
    expect(usePrayerStore.getState().addFromCommunity).toHaveBeenCalledTimes(1);

    // The confirmation carries the one optional follow-up; the wall row does not.
    expect(screen.getByText(t(lang, 'carryAdded'))).toBeTruthy();
    expect(chooseCircle()).toBeTruthy();
    expect(within(row()).queryByRole('button', { name: t(lang, 'carryChooseCircle') })).toBeNull();
    // Nothing was placed on the carrier's behalf — not even the author's circle.
    expect(usePrayerStore.getState().prayers[0].circle).toBeUndefined();
    expect(updatePrayer).not.toHaveBeenCalled();
  });

  it('places the request on the carrier’s own copy only, and says only they see it', async () => {
    renderRow();
    await act(async () => { fireEvent.click(carry()); });
    fireEvent.click(chooseCircle());

    const dialog = screen.getByRole('dialog', { name: t(lang, 'carryCircleQuestion') });
    expect(within(dialog).getByText(t(lang, 'carryCircleHint'))).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: new RegExp(t(lang, 'circle_people')) }));

    expect(updatePrayer).toHaveBeenCalledTimes(1);
    expect(updatePrayer).toHaveBeenCalledWith('copy-1', { circle: 'people' });
    expect(screen.queryByRole('dialog')).toBeNull();
    // No community action carried it anywhere: one reaction toggle, nothing else.
    expect(community.toggleReaction).toHaveBeenCalledTimes(1);
    expect(community.setCommunityAnswered).not.toHaveBeenCalled();
    expect(community.addTestimony).not.toHaveBeenCalled();
    // The group's wall never shows the carrier's circle.
    expect(row().textContent).not.toContain(t(lang, 'circle_people'));
  });

  it('a carried request on a later visit shows only that it is carried — never the carrier’s circle', () => {
    useCommunityStore.setState({ userReactions: new Set(['c-1']) });
    usePrayerStore.setState({ prayers: [copyOf({ circle: 'church' })] });
    renderRow();
    expect(within(row()).getAllByRole('button').filter((b) => b.closest('.together-prayer__foot'))).toHaveLength(1);
    expect(row().textContent).not.toContain(t(lang, 'circle_church'));
    expect(chooseCircle()).toBeNull();
  });

  it('offers no placement where the copy could not keep the circle encrypted', async () => {
    crypto.canHold = false;
    renderRow();
    await act(async () => { fireEvent.click(carry()); });
    expect(screen.getByText(t(lang, 'carryAdded'))).toBeTruthy();
    expect(chooseCircle()).toBeNull();
  });

  it('laying the prayer down removes the copy and offers nothing to place', async () => {
    useCommunityStore.setState({ userReactions: new Set(['c-1']) });
    usePrayerStore.setState({ prayers: [copyOf()] });
    renderRow();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: t(lang, 'carryingLabel') })); });
    expect(usePrayerStore.getState().softDeletePrayer).toHaveBeenCalledWith('copy-1');
    expect(screen.getByText(t(lang, 'carryRemoved'))).toBeTruthy();
    expect(chooseCircle()).toBeNull();
  });
});
