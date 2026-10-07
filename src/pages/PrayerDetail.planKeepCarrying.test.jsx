// @vitest-environment jsdom
//
// The end of a guided plan turns temporary formation into lasting prayer:
// "What do you want to keep carrying?" Choosing a theme opens the composer in
// the plan's circle, with the theme as a starting point above an empty field.
// Nothing is created on the reader's behalf — the old flow saved prayers with
// pre-written titles, and that must never come back.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

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

import PrayerDetail from './PrayerDetail';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import useFollowUpStore from '../store/followUpStore';
import { circleContent } from '../content/intercessionCircles';
import { getPlanPrefs } from '../lib/planPrefs';
import { addDays } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import { t } from '../i18n';

const lang = 'fr';

// "Your Kingdom come" — 14 days, begun three weeks ago: its last day is behind.
const START = addDays(todayKey(), -21);
const finishedRun = {
  id: 'run-1',
  title: 'Que ton règne vienne',
  status: 'active',
  created_at: '2026-07-01T00:00:00Z',
  prayer_categories: [],
  prayer_points: [],
  prayer_updates: [],
  prayer_testimonies: [],
  schedule: {
    type: 'recurring', freq: 'daily', startDate: START,
    end: { kind: 'count', count: 14 }, plan: { id: 'kingdomCome14', startDate: START },
  },
};

const addPrayer = vi.fn();

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  addPrayer.mockClear();
  useAuthStore.setState({ user: null });
  useFollowUpStore.setState({ followUps: {} });
  useCommunityStore.setState({ groups: [], prayers: [], prayerShares: {}, testimonies: [], userReactions: new Set() });
  usePrayerStore.setState({ prayers: [finishedRun], categories: [], completions: {}, settings: { language: lang }, addPrayer });
});

const keepCarrying = () => screen.getByRole('region', { name: t(lang, 'planKeepCarryingHeading') });

describe('PrayerDetail — a finished plan asks what to keep carrying', () => {
  it('opens the composer in the plan\'s circle with the chosen theme, and creates nothing itself', () => {
    const onPrayInCircle = vi.fn();
    render(<PrayerDetail prayer={finishedRun} onBack={() => {}} onEdit={() => {}} onPrayInCircle={onPrayInCircle} lang={lang} />);

    const theme = circleContent('kingdom').themes[1].title.fr;
    fireEvent.click(within(keepCarrying()).getByRole('button', { name: theme }));

    expect(onPrayInCircle).toHaveBeenCalledWith('kingdom', { prompt: theme });
    expect(addPrayer).not.toHaveBeenCalled();
    expect(getPlanPrefs('kingdomCome14').completedAt).toBeTruthy();
  });

  it('asks nothing where the page cannot open the composer', () => {
    render(<PrayerDetail prayer={finishedRun} onBack={() => {}} onEdit={() => {}} lang={lang} />);
    expect(screen.queryByRole('region', { name: t(lang, 'planKeepCarryingHeading') })).toBeNull();
    expect(addPrayer).not.toHaveBeenCalled();
  });
});
