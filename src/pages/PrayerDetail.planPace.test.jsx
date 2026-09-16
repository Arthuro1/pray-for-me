// @vitest-environment jsdom
//
// The pace of a running plan, set on the plan's own card.
//
// Two things used to break the moment a reader changed the rhythm of a plan
// they had already started: the day number was recounted from the new pattern
// (day 16 of a daily plan became day 3 of a weekly one), and on any date the
// new pattern missed, the plan's whole card vanished — theme, passage,
// reflection and all. What must hold here: the card always has a day to show,
// the day it shows is the day the run actually reached, and choosing a pace
// stores a schedule that keeps it.
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
import { addDays, parseKey, planDayNumber, restingPlanDay } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import { t } from '../i18n';

const lang = 'fr';

// A 30-day plan that began 15 days ago: the reader is on day 16.
const START = addDays(todayKey(), -15);
const base = {
  id: 'p1',
  title: 'Trente jours pour les autres',
  description: '',
  status: 'active',
  created_at: '2026-07-01T00:00:00Z',
  prayer_categories: [],
  prayer_points: [],
  prayer_updates: [],
  prayer_testimonies: [],
};

const withSchedule = (schedule) => ({ ...base, schedule });

const daily = withSchedule({
  type: 'recurring', freq: 'daily', startDate: START,
  end: { kind: 'count', count: 30 }, plan: { id: 'others30', startDate: START },
});

// The same run, re-paced two days ago onto the weekday that fell two days ago:
// exactly one day of it (day 16) has landed since, and TODAY is not one of its
// days — the case that used to render nothing at all.
const PACED_ON = addDays(todayKey(), -2);
const weekly = withSchedule({
  type: 'recurring', freq: 'weekly', weekDays: [parseKey(PACED_ON).getDay()],
  startDate: PACED_ON, end: { kind: 'count', count: 15 },
  plan: { id: 'others30', startDate: START, dayOffset: 15, total: 30 },
});

const paused = withSchedule({
  type: 'none', plan: { id: 'others30', startDate: START, dayOffset: 15, total: 30 },
});

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: null });
  useFollowUpStore.setState({ followUps: {} });
  useCommunityStore.setState({ groups: [], prayers: [], prayerShares: {}, testimonies: [], userReactions: new Set() });
});

const renderDetail = (prayer, { store = {}, ...props } = {}) => {
  const updatePrayer = vi.fn();
  usePrayerStore.setState({
    prayers: [prayer], categories: [], completions: {}, settings: { language: lang },
    updatePrayer, ...store,
  });
  render(<PrayerDetail prayer={prayer} onBack={() => {}} onEdit={() => {}} lang={lang} {...props} />);
  return { updatePrayer };
};

const openPace = () => fireEvent.click(screen.getByText(t(lang, 'planPaceTitle')));
const pick = (labelKey) => fireEvent.click(screen.getByText(t(lang, labelKey)));

describe('the plan card always has a day to show', () => {
  it('shows today’s day for a plan running daily, with no "not today" note', () => {
    renderDetail(daily);
    expect(screen.getByText(/Jour 16 sur 30/)).toBeTruthy();
    expect(screen.queryByText(new RegExp(t(lang, 'planPaceResting')))).toBeNull();
  });

  it('still shows the day the run reached when today is not one of its days', () => {
    renderDetail(weekly);
    // This is the reported bug: the card rendered nothing at all here.
    expect(screen.getByText(/Jour 16 sur 30/)).toBeTruthy();
    expect(screen.getByText(new RegExp(t(lang, 'planPaceResting')))).toBeTruthy();
  });

  it('shows the day a paused run is holding, and no date for it', () => {
    renderDetail(paused);
    expect(screen.getByText(/Jour 16 sur 30/)).toBeTruthy();
    expect(screen.getByText(new RegExp(t(lang, 'planPacePausedNote')))).toBeTruthy();
  });

  it('counts out of the plan’s length, not the days it has left', () => {
    // The weekly run's own schedule says 15 — that is the REMAINDER.
    renderDetail(weekly);
    expect(screen.queryByText(/Jour 16 sur 15/)).toBeNull();
  });
});

describe('choosing a pace', () => {
  it('reports the pace the run is actually on', () => {
    renderDetail(daily);
    expect(screen.getByText(t(lang, 'planPaceDaily'))).toBeTruthy();
    cleanup();
    renderDetail(weekly);
    expect(screen.getAllByText(t(lang, 'planPaceSomeDays')).length).toBeGreaterThan(0);
  });

  it('stores a schedule that keeps the reader on day 16', () => {
    const { updatePrayer } = renderDetail(daily);
    openPace();
    pick('planPaceAlternate');
    expect(updatePrayer).toHaveBeenCalledTimes(1);
    const [id, patch] = updatePrayer.mock.calls[0];
    expect(id).toBe('p1');
    expect(patch.schedule.freq).toBe('interval');
    expect(patch.schedule.interval).toBe(2);
    expect(planDayNumber(patch.schedule, todayKey())).toBe(16);
    expect(patch.schedule.plan.startDate).toBe(START); // the run's own start never moves
  });

  it('pauses without losing the run', () => {
    const { updatePrayer } = renderDetail(daily);
    openPace();
    pick('planPacePause');
    const { schedule } = updatePrayer.mock.calls[0][1];
    expect(schedule.type).toBe('none');
    expect(schedule.plan.id).toBe('others30'); // the run used to be dropped here
    expect(restingPlanDay(schedule, todayKey()).dayNo).toBe(16);
  });

  it('resumes a paused run on the day it was holding', () => {
    const { updatePrayer } = renderDetail(paused);
    openPace();
    pick('planPaceDaily');
    const { schedule } = updatePrayer.mock.calls[0][1];
    expect(schedule.type).toBe('recurring');
    expect(planDayNumber(schedule, todayKey())).toBe(16);
    expect(schedule.end).toEqual({ kind: 'count', count: 15 });
  });

  it('is not offered on a prayer that carries no plan', () => {
    renderDetail(withSchedule({ type: 'recurring', freq: 'daily', startDate: START, end: { kind: 'never' } }));
    expect(screen.queryByText(t(lang, 'planPaceTitle'))).toBeNull();
  });

  it('is not offered once the prayer is answered', () => {
    renderDetail({ ...daily, status: 'answered' });
    expect(screen.queryByText(t(lang, 'planPaceTitle'))).toBeNull();
  });
});
