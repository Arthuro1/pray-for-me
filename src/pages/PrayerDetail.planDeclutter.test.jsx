// @vitest-environment jsdom
//
// A guided plan run is a different kind of page from an ordinary prayer.
//
// The day on screen already names the theme, the passage and the prompts; the
// run comes back on its own rhythm; and none of the words on it were written by
// the reader. So the generic prayer page around it was mostly saying the same
// thing twice, or asking questions a plan cannot answer: an AI "ways to pray"
// panel competing with the day's prompts, a recurrence summary repeating the
// rhythm row below it, a scripture hunt for a run that leads with Scripture, a
// follow-up reminder for a prayer that returns by itself, a translate toggle
// over content that is already translated, and a privacy badge for content the
// reader never authored.
//
// What must hold here: a plan run is stripped of exactly those, an ordinary
// prayer keeps every one of them, and nothing a reader actually put on the
// prayer (points, notes, an existing follow-up) is ever hidden by the stripping.
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

// Deliberately NOT the plan's own name: a run started in another language wrote
// its title into the prayer, and the page must not keep showing that copy.
const STALE_TITLE = 'Thirty Days For Others';

const base = (extra = {}) => ({
  id: 'p1',
  title: STALE_TITLE,
  description: 'Stale stored subtitle',
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

describe('a plan run is walked, not updated and answered', () => {
  it('offers neither Add update nor Mark answered in the hero', () => {
    renderDetail(planRun());
    expect(screen.queryByText(t(lang, 'addUpdateBtn'))).toBeNull();
    expect(screen.queryByText(t(lang, 'markAnswered'))).toBeNull();
    // Pray now is the one thing a plan day asks for.
    expect(screen.getByRole('button', { name: t(lang, 'prayNow') })).toBeTruthy();
  });

  it('keeps both on an ordinary prayer', () => {
    renderDetail(ordinary());
    expect(screen.getByText(t(lang, 'addUpdateBtn'))).toBeTruthy();
    expect(screen.getAllByText(t(lang, 'markAnswered')).length).toBe(1);
  });

  it('keeps the history and its composer — that is where a prayed note lands', () => {
    // PlanDayTrace reads those notes back when the reader pages to a past day,
    // so removing the timeline with the buttons would break both.
    const { container } = renderDetail(planRun());
    expect(screen.getByText(t(lang, 'evolutions'))).toBeTruthy();
    expect(container.querySelector('#pd-updates [contenteditable]')).toBeTruthy();
  });
});

describe('a plan run states its rhythm exactly once', () => {
  it('asks it on the plan card, not as a summary line above it', () => {
    renderDetail(planRun());
    expect(screen.getByText(t(lang, 'planPaceTitle'))).toBeTruthy();
    expect(screen.queryByText(scheduleSummary(planRun().schedule, lang))).toBeNull();
  });

  it('keeps the summary on an ordinary recurring prayer, which has no rhythm row', () => {
    renderDetail(ordinary());
    expect(screen.queryByText(t(lang, 'planPaceTitle'))).toBeNull();
    expect(screen.getByText(scheduleSummary(ordinary().schedule, lang))).toBeTruthy();
  });

  it('opens the ONE scheduler from that row — there is no second pace control', () => {
    renderDetail(planRun());
    fireEvent.click(screen.getByText(t(lang, 'planPaceTitle')));
    // The ordinary scheduler, asking its ordinary question.
    expect(screen.getByText(t(lang, 'schedWhenAppear'))).toBeTruthy();
    expect(screen.getByRole('radio', { name: new RegExp(t(lang, 'planPacePause')) })).toBeTruthy();
  });
});

describe('the overflow menu on a plan run', () => {
  it('drops the scripture hunt, the follow-up, the editor and the second scheduler', () => {
    renderDetail(planRun());
    openMenu();
    expect(menuItem('viewScripture')).toBeNull();
    expect(menuItem('followUpTitle')).toBeNull();
    // The plan's words are the plan's own, and the rhythm is asked on the card.
    expect(menuItem('edit')).toBeNull();
    expect(menuItem('editSchedule')).toBeNull();
    // What is still the reader's own stays.
    expect(menuItem('pin')).toBeTruthy();
    expect(menuItem('delete')).toBeTruthy();
  });

  it('keeps all of them on an ordinary prayer', () => {
    renderDetail(ordinary());
    openMenu();
    expect(menuItem('viewScripture')).toBeTruthy();
    expect(menuItem('followUpTitle')).toBeTruthy();
    expect(menuItem('edit')).toBeTruthy();
    expect(menuItem('editSchedule')).toBeTruthy();
  });

  it('never takes away a follow-up a plan run already has', () => {
    useFollowUpStore.setState({ followUps: { p1: { date: addDays(todayKey(), 3), status: 'pending' } } });
    renderDetail(planRun());
    openMenu();
    expect(menuItem('followUpTitle')).toBeTruthy();
  });
});

describe('a plan run shows the plan’s own words, in the reader’s language', () => {
  it('reads the title and subtitle from the plan, not the copy frozen at start', () => {
    renderDetail(planRun());
    expect(screen.getByText(t(lang, 'plan30Title'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'plan30Sub'))).toBeTruthy();
    expect(screen.queryByText(STALE_TITLE)).toBeNull();
  });

  it('is not editable in place — the name belongs to the plan', () => {
    const { container } = renderDetail(planRun());
    fireEvent.click(screen.getByText(t(lang, 'plan30Title')));
    expect(container.querySelector('.constellation-detail__title-input')).toBeNull();
  });

  it('an ordinary prayer keeps its own title, editable in place', () => {
    const { container } = renderDetail(ordinary());
    expect(screen.getByText(STALE_TITLE)).toBeTruthy();
    fireEvent.click(screen.getByText(STALE_TITLE));
    expect(container.querySelector('.constellation-detail__title-input')).toBeTruthy();
  });
});

describe('neither privacy nor translation applies to plan content', () => {
  it('shows no audience badge on a plan run', () => {
    renderDetail(planRun());
    expect(screen.queryByText(t(lang, 'audiencePrivate'))).toBeNull();
  });

  it('still shows it on an ordinary prayer', () => {
    renderDetail(ordinary());
    expect(screen.getByText(t(lang, 'audiencePrivate'))).toBeTruthy();
  });

  it('never offers to AI-translate a plan that is already translated', () => {
    // content_language is what makes the toggle appear at all.
    renderDetail(planRun({ content_language: 'de' }));
    expect(screen.queryByText(t(lang, 'seeTranslation'))).toBeNull();
  });

  it('still offers it on an ordinary prayer written in another language', () => {
    renderDetail(ordinary({ content_language: 'de' }));
    expect(screen.getByText(t(lang, 'seeTranslation'))).toBeTruthy();
  });
});
