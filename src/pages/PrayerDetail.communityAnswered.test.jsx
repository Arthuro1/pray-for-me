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

// Isolate the answered flow from the community lists (updates, testimonies) —
// neither is under test here.
vi.mock('../components/CommunityUpdates', () => ({ default: () => null }));
vi.mock('../components/CommunityTestimonies', () => ({ default: () => null }));
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
import { t, tp } from '../i18n';

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

// A copy saved into the viewer's own list via "Carry this prayer" — linked back to the
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
// "Mark answered" opens the answered flow; its Confirm completes it.
const confirmAnswered = () => {
  fireEvent.click(screen.getByRole('button', { name: t(lang, 'markAnswered') }));
  fireEvent.click(screen.getByRole('button', { name: t(lang, 'confirm') }));
};

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

    confirmAnswered();
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

    confirmAnswered();
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

    confirmAnswered();
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

describe('PrayerDetail — "Carry this prayer" mirrors the personal list', () => {
  it('no longer carrying a prayer removes the saved copy that carrying added', async () => {
    const toggleReaction = vi.fn(async () => {});
    const fetchReactors = vi.fn(async () => ({ reactors: [] }));
    const softDeletePrayer = vi.fn();
    // The viewer is already praying (reaction on) and has a saved copy in their
    // list — turning the reaction off must remove that copy.
    renderCommunity(communityPrayer({ user_id: 'u2' }), savedCopy(), {
      communitySpies: { toggleReaction, fetchReactors, userReactions: new Set(['c1']) },
      prayerSpies: { softDeletePrayer },
    });

    // Already carrying: the pressed button says so, in the reader's language.
    const carrying = screen.getByRole('button', { name: t(lang, 'carryingLabel') });
    expect(carrying.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(carrying);
    await Promise.resolve();
    await Promise.resolve();

    expect(toggleReaction).toHaveBeenCalledWith('c1', 'u1');
    expect(softDeletePrayer).toHaveBeenCalledWith('sc1');
  });

  it('no longer carrying a prayer never deletes a prayer the viewer only shared', async () => {
    const toggleReaction = vi.fn(async () => {});
    const fetchReactors = vi.fn(async () => ({ reactors: [] }));
    const softDeletePrayer = vi.fn();
    // The viewer OWNS this request and shared it (source_prayer_id → p1); there is
    // no saved copy, so un-praying must not delete their own source prayer.
    renderCommunity(communityPrayer({ user_id: 'u1' }), personalSource(), {
      communitySpies: { toggleReaction, fetchReactors, userReactions: new Set(['c1']) },
      prayerSpies: { softDeletePrayer },
    });

    // Already carrying: the pressed button says so, in the reader's language.
    const carrying = screen.getByRole('button', { name: t(lang, 'carryingLabel') });
    expect(carrying.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(carrying);
    await Promise.resolve();
    await Promise.resolve();

    expect(toggleReaction).toHaveBeenCalledWith('c1', 'u1');
    expect(softDeletePrayer).not.toHaveBeenCalled();
  });
});

describe('PrayerDetail — the action row on a group request', () => {
  const fetchReactors = vi.fn(async () => ({ reactors: [] }));

  it('leads with Carry until the reader carries it', () => {
    renderCommunity(communityPrayer({ user_id: 'u2' }), null, { communitySpies: { fetchReactors } });
    expect(screen.getByRole('button', { name: t(lang, 'carryThisPrayer') }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.queryByRole('button', { name: t(lang, 'prayNow') })).toBeNull();
  });

  it('leads with Pray now once carried, Carrying beside it', () => {
    renderCommunity(communityPrayer({ user_id: 'u2' }), savedCopy(), {
      communitySpies: { fetchReactors, userReactions: new Set(['c1']) },
    });
    expect(screen.getByRole('button', { name: t(lang, 'prayNow') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t(lang, 'carryingLabel') }).getAttribute('aria-pressed')).toBe('true');
  });

  it('says who is asking first: the author and the group, before the title', () => {
    renderCommunity(communityPrayer({ user_id: 'u2' }), null, { communitySpies: { fetchReactors } });
    const title = screen.getByRole('heading', { level: 1 });
    const author = screen.getByText('Grace');
    expect(author.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText(t(lang, 'audienceFromGroup', { name: 'Église' }))).toBeTruthy();
  });

  it('counts the reader as "you" in the carry band, never as a number beside "Carrying"', () => {
    const prayer = communityPrayer({ user_id: 'u2', prayer_reactions: [{ count: 3 }] });
    renderCommunity(prayer, savedCopy(), {
      communitySpies: { fetchReactors, userReactions: new Set(['c1']) },
    });
    expect(screen.getByText(tp(lang, 'carryYouAndOthers', 2))).toBeTruthy();
    expect(screen.queryByText(tp(lang, 'carryCount', 3))).toBeNull();
  });

  it('counts everyone when the reader does not carry it yet', () => {
    const prayer = communityPrayer({ user_id: 'u2', prayer_reactions: [{ count: 1 }] });
    renderCommunity(prayer, null, { communitySpies: { fetchReactors } });
    expect(screen.getByText(tp(lang, 'carryCount', 1))).toBeTruthy();
  });

  it('offers a member a testimony, never Mark answered', () => {
    renderCommunity(communityPrayer({ user_id: 'u2' }), null, { communitySpies: { fetchReactors } });
    expect(screen.getByRole('button', { name: t(lang, 'postTestimony') })).toBeTruthy();
    expect(screen.queryByRole('button', { name: t(lang, 'markAnswered') })).toBeNull();
  });

  it('keeps every flow folded until its tool is pressed', () => {
    renderCommunity(communityPrayer(), personalSource(), { communitySpies: { fetchReactors } });
    expect(screen.queryByRole('button', { name: t(lang, 'confirm') })).toBeNull();
    const tool = screen.getByRole('button', { name: t(lang, 'markAnswered') });
    fireEvent.click(tool);
    expect(tool.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: t(lang, 'confirm') })).toBeTruthy();
    // Pressing the same tool again folds it away.
    fireEvent.click(tool);
    expect(screen.queryByRole('button', { name: t(lang, 'confirm') })).toBeNull();
  });
});
