// @vitest-environment jsdom
//
// Carrying a group request, then placing it on one's own altar (Milestone C,
// spec §50–51, §82). Carrying stays one tap; "Place on your altar" follows
// quietly and can be ignored. The circle is the CARRIER's: it is written to
// their own copy only — never to the group's request, never through a
// community action — and it is independent of anything the author chose.
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
import usePrayerStore from '../../store/prayerStore';
import useCommunityStore from '../../store/communityStore';
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

const renderRow = () => render(<ul><GroupPrayerRow prayer={request} user={user} lang={lang} onOpen={() => {}} /></ul>);
const carry = () => screen.getByRole('button', { name: t(lang, 'carryThisPrayer') });
const placeLink = () => screen.queryByRole('button', { name: t(lang, 'placeOnAltarLabel') });

describe('GroupPrayerRow — carry, then place on your altar', () => {
  it('carrying is one tap; the invitation to place it follows quietly', async () => {
    renderRow();
    expect(placeLink()).toBeNull();
    await act(async () => { fireEvent.click(carry()); });
    expect(community.toggleReaction).toHaveBeenCalledTimes(1);
    expect(usePrayerStore.getState().addFromCommunity).toHaveBeenCalledTimes(1);
    expect(placeLink()).toBeTruthy();
    // Nothing was placed on the carrier's behalf — not even the author's circle.
    expect(usePrayerStore.getState().prayers[0].circle).toBeUndefined();
    expect(updatePrayer).not.toHaveBeenCalled();
  });

  it('places the request on the carrier’s own copy only, and says only they see it', async () => {
    renderRow();
    await act(async () => { fireEvent.click(carry()); });
    fireEvent.click(placeLink());

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

    // The row now names where the carrier carries it.
    const name = t(lang, 'circle_people');
    expect(screen.getByRole('button', { name: t(lang, 'carryPlacedIn', { circle: name }) })).toBeTruthy();
    expect(placeLink()).toBeNull();
  });

  it('on a later visit, an unplaced carried request stays quiet; a placed one names its circle', () => {
    useCommunityStore.setState({ userReactions: new Set(['c-1']) });
    usePrayerStore.setState({ prayers: [copyOf()] });
    renderRow();
    expect(placeLink()).toBeNull();
    cleanup();

    usePrayerStore.setState({ prayers: [copyOf({ circle: 'church' })] });
    renderRow();
    const name = t(lang, 'circle_church');
    expect(screen.getByRole('button', { name: t(lang, 'carryPlacedIn', { circle: name }) })).toBeTruthy();
  });

  it('offers no placement where the copy could not keep the circle encrypted', async () => {
    crypto.canHold = false;
    renderRow();
    await act(async () => { fireEvent.click(carry()); });
    expect(placeLink()).toBeNull();
  });

  it('laying the prayer down removes the invitation with the copy', async () => {
    renderRow();
    await act(async () => { fireEvent.click(carry()); });
    expect(placeLink()).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: t(lang, 'carryingLabel') })); });
    expect(usePrayerStore.getState().softDeletePrayer).toHaveBeenCalledWith('copy-1');
    expect(placeLink()).toBeNull();
  });
});
