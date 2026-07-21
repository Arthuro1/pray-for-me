// @vitest-environment jsdom
//
// Regression: marking a shared prayer answered from the COMMUNITY (group) view
// must mirror onto the personal source prayer, so an answered group request no
// longer lingers as "active" on the owner's personal Journal. The ownership
// guard (communityPrayer.user_id === user.id) means a group admin answering
// someone else's request stays a community-only edit.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../lib/supabase', () => {
  const chain = {
    upsert: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    not: () => chain,
    order: () => chain,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve) => resolve({ data: [], error: null }),
  };
  const channel = { on: () => channel, subscribe: () => channel };
  return {
    supabase: {
      auth: { getSession: async () => ({ data: { session: null } }), getUser: async () => ({ data: { user: { id: 'u1' } } }) },
      from: () => chain,
      rpc: async () => ({ data: null, error: null }),
      channel: () => channel,
      removeChannel: () => {},
    },
  };
});
vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../lib/mutationQueue', () => ({ enqueue: vi.fn(), pendingPrayerIds: () => new Set() }));

// Isolate the answered flow from the heavy community children (calendar,
// updates, testimonies, follow button) — none of them are under test here.
vi.mock('../components/GroupPrayerCalendar', () => ({ default: () => null }));
vi.mock('../components/CommunityUpdates', () => ({ default: () => null }));
vi.mock('../components/CommunityTestimonies', () => ({ default: () => null }));
vi.mock('../components/FollowPrayerButton', () => ({ default: () => null }));
// A stand-in composer whose confirm button calls onSend with no testimony —
// exactly what the real answered composer does when confirmed empty.
vi.mock('../components/rich/UpdateComposer', () => ({
  default: ({ onSend, sendLabel }) => (
    <button onClick={() => onSend('', [])}>{sendLabel}</button>
  ),
}));

import PrayerDetail from './PrayerDetail';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import useFollowUpStore from '../store/followUpStore';
import { t } from '../i18n';

const lang = 'fr';

const communityPrayer = (extra = {}) => ({
  id: 'c1',
  group_id: 'g1',
  user_id: 'u1',
  source_prayer_id: 'p1',
  title: 'Prière partagée',
  description: 'Détails',
  author_name: 'Grace',
  created_at: '2026-07-01T00:00:00Z',
  is_answered: false,
  category_ids: [],
  prayer_points: [],
  ...extra,
});

const personalSource = (extra = {}) => ({
  id: 'p1',
  title: 'Prière partagée',
  description: 'Détails',
  status: 'active',
  created_at: '2026-07-01T00:00:00Z',
  prayer_categories: [],
  prayer_points: [],
  prayer_updates: [],
  prayer_testimonies: [],
  ...extra,
});

// A copy saved into the viewer's own list via "I'm praying" — linked back to the
// group request by community_origin_id (never source_prayer_id).
const savedCopy = (extra = {}) => ({
  id: 'sc1',
  community_origin_id: 'c1',
  title: 'Prière partagée',
  description: 'Détails',
  status: 'active',
  created_at: '2026-07-01T00:00:00Z',
  prayer_categories: [],
  prayer_points: [],
  prayer_updates: [],
  prayer_testimonies: [],
  ...extra,
});

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: { id: 'u1' } });
  useFollowUpStore.setState({ followUps: {} });
});

// Spies are injected into the stores BEFORE render, so the component captures
// them in its handler closures from the first commit (setting them afterward
// would leave the already-attached click handler pointing at the real actions).
const renderCommunity = (cp, sourcePrayer, { role = 'member', prayerSpies = {}, communitySpies = {} } = {}) => {
  usePrayerStore.setState({
    prayers: sourcePrayer ? [sourcePrayer] : [],
    categories: [], completions: {}, settings: { language: lang },
    ...prayerSpies,
  });
  useCommunityStore.setState({
    groups: [{ id: 'g1', name: 'Église', role }],
    prayers: [cp], prayerShares: {}, testimonies: [], userReactions: new Set(),
    ...communitySpies,
  });
  return render(<PrayerDetail communityPrayer={cp} onBack={() => {}} onEdit={() => {}} lang={lang} />);
};

describe('PrayerDetail — community answered mirrors the personal source', () => {
  it('marking a shared prayer answered in the group also marks its personal source answered', async () => {
    const setCommunityAnswered = vi.fn(async () => ({}));
    const markAnswered = vi.fn(async () => {});
    renderCommunity(communityPrayer(), personalSource(), {
      communitySpies: { setCommunityAnswered }, prayerSpies: { markAnswered },
    });

    fireEvent.click(screen.getByRole('button', { name: t(lang, 'confirm') }));
    // let the awaited handler chain settle
    await Promise.resolve();
    await Promise.resolve();

    expect(setCommunityAnswered).toHaveBeenCalledWith('c1', true);
    expect(markAnswered).toHaveBeenCalledWith('p1');
  });

  it('resuming a shared prayer in the group reactivates its personal source', async () => {
    const setCommunityAnswered = vi.fn(async () => ({}));
    const markActive = vi.fn(async () => {});
    renderCommunity(communityPrayer({ is_answered: true }), personalSource({ status: 'answered', answered_at: '2026-07-02T00:00:00Z' }), {
      communitySpies: { setCommunityAnswered }, prayerSpies: { markActive },
    });

    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'resumePrayer')) }));
    await Promise.resolve();
    await Promise.resolve();

    expect(setCommunityAnswered).toHaveBeenCalledWith('c1', false);
    expect(markActive).toHaveBeenCalledWith('p1');
  });

  it('does NOT touch the personal list when a group admin answers someone else’s request', async () => {
    const setCommunityAnswered = vi.fn(async () => ({}));
    const markAnswered = vi.fn(async () => {});
    // Prayer authored by another user (u2), viewer u1 is only a group admin, and
    // the source prayer is not in the viewer's own list.
    renderCommunity(communityPrayer({ user_id: 'u2' }), null, {
      role: 'admin', communitySpies: { setCommunityAnswered }, prayerSpies: { markAnswered },
    });

    fireEvent.click(screen.getByRole('button', { name: t(lang, 'confirm') }));
    await Promise.resolve();
    await Promise.resolve();

    expect(setCommunityAnswered).toHaveBeenCalledWith('c1', true);
    expect(markAnswered).not.toHaveBeenCalled();
  });
});

describe('PrayerDetail — community answered mirrors a saved-from-community copy', () => {
  it('answering a group request also answers the copy the viewer saved via "I\'m praying"', async () => {
    const setCommunityAnswered = vi.fn(async () => ({}));
    const markAnswered = vi.fn(async () => {});
    // The group request is authored by someone else (u2); the viewer (admin) saved
    // it into their own list, so their copy is linked by community_origin_id, not
    // source_prayer_id. Answering the request must complete that saved copy.
    renderCommunity(communityPrayer({ user_id: 'u2' }), savedCopy(), {
      role: 'admin', communitySpies: { setCommunityAnswered }, prayerSpies: { markAnswered },
    });

    fireEvent.click(screen.getByRole('button', { name: t(lang, 'confirm') }));
    await Promise.resolve();
    await Promise.resolve();

    expect(setCommunityAnswered).toHaveBeenCalledWith('c1', true);
    expect(markAnswered).toHaveBeenCalledWith('sc1');
  });

  it('resuming a group request reactivates the saved copy', async () => {
    const setCommunityAnswered = vi.fn(async () => ({}));
    const markActive = vi.fn(async () => {});
    renderCommunity(
      communityPrayer({ user_id: 'u2', is_answered: true }),
      savedCopy({ status: 'answered', answered_at: '2026-07-02T00:00:00Z' }),
      { role: 'admin', communitySpies: { setCommunityAnswered }, prayerSpies: { markActive } },
    );

    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'resumePrayer')) }));
    await Promise.resolve();
    await Promise.resolve();

    expect(setCommunityAnswered).toHaveBeenCalledWith('c1', false);
    expect(markActive).toHaveBeenCalledWith('sc1');
  });
});

describe('PrayerDetail — "I\'m praying" toggle mirrors the personal list', () => {
  it('un-tapping "I\'m praying" removes the saved copy it added', async () => {
    const toggleReaction = vi.fn(async () => {});
    const fetchReactors = vi.fn(async () => ({ reactors: [] }));
    const softDeletePrayer = vi.fn();
    // The viewer is already praying (reaction on) and has a saved copy in their
    // list — turning the reaction off must remove that copy.
    renderCommunity(communityPrayer({ user_id: 'u2' }), savedCopy(), {
      communitySpies: { toggleReaction, fetchReactors, userReactions: new Set(['c1']) },
      prayerSpies: { softDeletePrayer },
    });

    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'iAmPraying')) }));
    await Promise.resolve();
    await Promise.resolve();

    expect(toggleReaction).toHaveBeenCalledWith('c1', 'u1');
    expect(softDeletePrayer).toHaveBeenCalledWith('sc1');
  });

  it('un-tapping "I\'m praying" never deletes a prayer the viewer only shared', async () => {
    const toggleReaction = vi.fn(async () => {});
    const fetchReactors = vi.fn(async () => ({ reactors: [] }));
    const softDeletePrayer = vi.fn();
    // The viewer OWNS this request and shared it (source_prayer_id → p1); there is
    // no saved copy, so un-praying must not delete their own source prayer.
    renderCommunity(communityPrayer({ user_id: 'u1' }), personalSource(), {
      communitySpies: { toggleReaction, fetchReactors, userReactions: new Set(['c1']) },
      prayerSpies: { softDeletePrayer },
    });

    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'iAmPraying')) }));
    await Promise.resolve();
    await Promise.resolve();

    expect(toggleReaction).toHaveBeenCalledWith('c1', 'u1');
    expect(softDeletePrayer).not.toHaveBeenCalled();
  });
});
