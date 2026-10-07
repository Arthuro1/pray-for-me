// @vitest-environment jsdom
//
// The prayer's circle leads its hero as spiritual context — above the labels,
// which become one quiet line — and can be placed or changed in place. A
// change touches only the circle: never the rhythm, labels or history.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

vi.mock('../lib/supabase', () => {
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
vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../lib/mutationQueue', () => ({ enqueue: vi.fn(), pendingPrayerIds: () => new Set() }));
const crypto = vi.hoisted(() => ({ canHold: true }));
vi.mock('../lib/crypto/prayerCrypto', async (orig) => ({
  ...(await orig()),
  canHoldPrivateMetadata: () => crypto.canHold,
}));

import PrayerDetail from './PrayerDetail';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import useFollowUpStore from '../store/followUpStore';
import { t } from '../i18n';

const lang = 'fr';
const base = (extra = {}) => ({
  id: 'p1', title: 'Pour Sarah', description: '', status: 'active', created_at: '2026-07-01T00:00:00Z',
  prayer_categories: [], prayer_points: [], prayer_updates: [], prayer_testimonies: [], ...extra,
});
const updatePrayer = vi.fn();

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  crypto.canHold = true;
  localStorage.clear();
  useAuthStore.setState({ user: null });
  useFollowUpStore.setState({ followUps: {} });
  useCommunityStore.setState({ groups: [], prayers: [], prayerShares: {}, testimonies: [], userReactions: new Set() });
});

const renderDetail = (prayer, categories = []) => {
  usePrayerStore.setState({ prayers: [prayer], categories, completions: {}, settings: { language: lang }, updatePrayer });
  return render(<PrayerDetail prayer={prayer} onBack={() => {}} onEdit={() => {}} lang={lang} />);
};

describe('PrayerDetail — the circle', () => {
  it('leads the hero, with the labels as one quiet line beneath', () => {
    const { container } = renderDetail(
      base({ circle: 'household', prayer_categories: [{ category_id: 'c1' }, { category_id: 'c2' }] }),
      [{ id: 'c1', name: 'Mariage', color: '#f00' }, { id: 'c2', name: 'Guérison', color: '#0f0' }],
    );
    const hero = container.querySelector('.prayer-detail__hero');
    expect(within(hero).getByText(t(lang, 'circle_household'))).toBeTruthy();
    expect(within(hero).getByText('Mariage · Guérison')).toBeTruthy();
    // No coloured label pills in the hero any more.
    expect(hero.querySelector('.status-pill')).toBeNull();
  });

  it('changes the circle in place, and nothing else', () => {
    renderDetail(base({ circle: 'household', schedule: { type: 'weekly', days: [1] } }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'changeCircle') }));
    const dialog = screen.getByRole('dialog', { name: t(lang, 'changeCircle') });
    fireEvent.click(within(dialog).getByRole('button', { name: new RegExp(t(lang, 'circle_people')) }));
    expect(updatePrayer).toHaveBeenCalledTimes(1);
    expect(updatePrayer).toHaveBeenCalledWith('p1', { circle: 'people' });
    expect(screen.queryByRole('dialog', { name: t(lang, 'changeCircle') })).toBeNull();
  });

  it('lets an older prayer be placed, and a placed one be returned to "Your prayers"', () => {
    renderDetail(base());
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'placeInCircle') }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: new RegExp(t(lang, 'circle_church')) }));
    expect(updatePrayer).toHaveBeenCalledWith('p1', { circle: 'church' });

    cleanup();
    renderDetail(base({ circle: 'church' }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'changeCircle') }));
    // Choosing the current circle again takes it back — the circle is never required.
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: new RegExp(t(lang, 'circle_church')) }));
    expect(updatePrayer).toHaveBeenLastCalledWith('p1', { circle: null });
  });

  it('offers no circle control where the circle could not stay encrypted', () => {
    crypto.canHold = false;
    renderDetail(base());
    expect(screen.queryByRole('button', { name: t(lang, 'placeInCircle') })).toBeNull();
  });

  it('offers no circle control on a carried copy of a community prayer', () => {
    renderDetail(base({ community_origin_id: 'c-9', origin_group_name: 'Groupe' }));
    expect(screen.queryByRole('button', { name: t(lang, 'placeInCircle') })).toBeNull();
    expect(screen.queryByRole('button', { name: t(lang, 'changeCircle') })).toBeNull();
  });
});
