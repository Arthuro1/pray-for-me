// @vitest-environment jsdom
//
// A guided plan run is a different kind of page from an ordinary prayer.
//
// The day on screen already names the theme, the passage and the prompts, and
// the run comes back on its own rhythm — so everything the generic prayer page
// wrapped around it was saying the same thing twice: an AI "ways to pray" panel
// competing with the day's prompts, a recurrence summary repeating the pace row
// right below it, a scripture hunt for a run that leads with Scripture, a
// follow-up reminder for a prayer that returns by itself.
//
// What must hold here: a plan run is stripped of exactly those, an ordinary
// prayer keeps every one of them, and nothing a reader actually put on the
// prayer (points, an existing follow-up) is ever hidden by the stripping.
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
import { addDays } from '../lib/schedule';
import { scheduleSummary } from '../lib/scheduleDraft';
import { todayKey } from '../lib/prayedLog';
import { t } from '../i18n';

const lang = 'fr';

const base = (extra = {}) => ({
  id: 'p1',
  title: 'Trente jours pour les autres',
  description: '',
  status: 'active',
  created_at: '2026-07-01T00:00:00Z',
  prayer_categories: [],
  prayer_points: [],
  prayer_updates: [],
  prayer_testimonies: [],
  ...extra,
});

// A 30-day plan that began 15 days ago: the reader is on day 16 of the run.
const START = addDays(todayKey(), -15);
const planRun = (extra = {}) => base({
  schedule: {
    type: 'recurring', freq: 'daily', startDate: START,
    end: { kind: 'count', count: 30 }, plan: { id: 'others30', startDate: START },
  },
  ...extra,
});

// The same rhythm with no plan behind it — an ordinary recurring prayer.
const ordinary = (extra = {}) => base({
  schedule: { type: 'recurring', freq: 'daily', startDate: START, end: { kind: 'never' } },
  ...extra,
});

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: null });
  useFollowUpStore.setState({ followUps: {} });
  useCommunityStore.setState({ groups: [], prayers: [], prayerShares: {}, testimonies: [], userReactions: new Set() });
});

const renderDetail = (prayer) => {
  usePrayerStore.setState({
    prayers: [prayer], categories: [], completions: {}, settings: { language: lang },
  });
  return render(<PrayerDetail prayer={prayer} onBack={() => {}} onEdit={() => {}} lang={lang} />);
};

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: t(lang, 'options') }));
const menuItem = (key) => screen.queryByRole('menuitem', { name: t(lang, key) });

describe('a plan run drops the generic ways-to-pray panel', () => {
  it('shows no points panel, no AI suggestions and no manual point on a plan run', () => {
    renderDetail(planRun());
    // The day itself is on screen — it is what says how to pray.
    expect(screen.getByText(/Jour 16 sur 30/)).toBeTruthy();
    expect(screen.queryByText(t(lang, 'waysToPray'))).toBeNull();
    expect(screen.queryByText(t(lang, 'prayerSuggestionsCta'))).toBeNull();
    expect(screen.queryByText(t(lang, 'addPointManually'))).toBeNull();
    expect(screen.queryByText(t(lang, 'needHelpFindingWords'))).toBeNull();
  });

  it('keeps the whole panel on an ordinary prayer', () => {
    renderDetail(ordinary());
    expect(screen.getByText(t(lang, 'waysToPray'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'prayerSuggestionsCta'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'addPointManually'))).toBeTruthy();
  });

  it('still shows points an older run carries — decluttering hides affordances, not content', () => {
    renderDetail(planRun({ prayer_points: [{ id: 'pp1', title: 'Pour mon voisin', verses: [] }] }));
    expect(screen.getByText('Pour mon voisin')).toBeTruthy();
    expect(screen.getByText(t(lang, 'waysToPray'))).toBeTruthy();
    // …without inviting more of them to be written beside the day.
    expect(screen.queryByText(t(lang, 'prayerSuggestionsCta'))).toBeNull();
    expect(screen.queryByText(t(lang, 'addPointManually'))).toBeNull();
  });
});

describe('a plan run states its rhythm exactly once', () => {
  it('drops the recurrence summary when the pace row is on screen', () => {
    renderDetail(planRun());
    expect(screen.getByText(t(lang, 'planPaceTitle'))).toBeTruthy();
    // The pace row already reports "Every day"; the summary pill above it said
    // the same thing in different words.
    expect(screen.queryByText(scheduleSummary(planRun().schedule, lang))).toBeNull();
  });

  it('keeps the summary on an ordinary recurring prayer, which has no pace row', () => {
    renderDetail(ordinary());
    expect(screen.queryByText(t(lang, 'planPaceTitle'))).toBeNull();
    expect(screen.getByText(scheduleSummary(ordinary().schedule, lang))).toBeTruthy();
  });

  it('never opens the pace disclosure onto an empty control', () => {
    // A run whose last day is behind it has nothing left to re-pace: the row
    // used to offer "Change" and then reveal nothing at all.
    const OLD = addDays(todayKey(), -60);
    renderDetail(base({
      schedule: {
        type: 'recurring', freq: 'daily', startDate: OLD,
        end: { kind: 'count', count: 30 }, plan: { id: 'others30', startDate: OLD },
      },
    }));
    expect(screen.queryByText(t(lang, 'planPaceTitle'))).toBeNull();
    // …and the rhythm is still stated, so an ended run never goes silent.
    expect(screen.getByText(t(lang, 'seriesEnded'))).toBeTruthy();
  });
});

describe('the overflow menu on a plan run', () => {
  it('drops the scripture hunt and the follow-up reminder', () => {
    renderDetail(planRun());
    openMenu();
    expect(menuItem('viewScripture')).toBeNull();
    expect(menuItem('followUpTitle')).toBeNull();
    // The rest of the menu is untouched — including the full scheduler, which
    // is still the only way to ask for a rhythm the pace row cannot express.
    expect(menuItem('pin')).toBeTruthy();
    expect(menuItem('editSchedule')).toBeTruthy();
    expect(menuItem('delete')).toBeTruthy();
  });

  it('keeps both on an ordinary prayer', () => {
    renderDetail(ordinary());
    openMenu();
    expect(menuItem('viewScripture')).toBeTruthy();
    expect(menuItem('followUpTitle')).toBeTruthy();
  });

  it('never takes away a follow-up a plan run already has', () => {
    useFollowUpStore.setState({ followUps: { p1: { date: addDays(todayKey(), 3), status: 'pending' } } });
    renderDetail(planRun());
    openMenu();
    expect(menuItem('followUpTitle')).toBeTruthy();
  });
});
