// @vitest-environment jsdom
//
// A running plan used to show one day only: today's. The calendar can now hand
// over any other day of the same run (`?day=` → the planDayKey prop), so a
// reader can re-read a day they missed or look at the next one. What must hold:
// the day on screen is the day that was asked for, it is clearly marked as not
// today with a way back, and a key the run does not actually contain changes
// nothing rather than inventing a day.
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
import { addDays } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import { t } from '../i18n';

const lang = 'fr';

// A three-day fast that began the day before yesterday: today is day 3, and
// day 1 is a day the reader has already passed.
const START = addDays(todayKey(), -2);
const DAY_2 = addDays(START, 1);
const prayer = {
  id: 'p1',
  title: 'Jeûne de trois jours',
  description: '',
  status: 'active',
  created_at: '2026-07-01T00:00:00Z',
  prayer_categories: [],
  prayer_points: [],
  prayer_updates: [],
  prayer_testimonies: [],
  schedule: {
    type: 'recurring', freq: 'daily', startDate: START, end: { kind: 'count', count: 3 },
    plan: { id: 'fast3', startDate: START },
  },
};

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: null });
  useFollowUpStore.setState({ followUps: {} });
  useCommunityStore.setState({ groups: [], prayers: [], prayerShares: {}, testimonies: [], userReactions: new Set() });
});

const renderDetail = ({ store = {}, ...props } = {}) => {
  usePrayerStore.setState({
    prayers: [prayer], categories: [], completions: {}, settings: { language: lang }, ...store,
  });
  return render(<PrayerDetail prayer={prayer} onBack={() => {}} onEdit={() => {}} lang={lang} {...props} />);
};

describe('PrayerDetail — a plan day chosen on the calendar', () => {
  it('shows today’s day when no other day was asked for', () => {
    renderDetail();
    expect(screen.getByText(/Jour 3 sur 3/)).toBeTruthy();
    expect(screen.queryByText(t(lang, 'planBackToToday'))).toBeNull();
  });

  it('shows the day the calendar handed over instead', () => {
    renderDetail({ planDayKey: START });
    expect(screen.getByText(/Jour 1 sur 3/)).toBeTruthy();
    expect(screen.queryByText(/Jour 3 sur 3/)).toBeNull();
  });

  it('marks that day as not today, and offers the way back', () => {
    const onShowToday = vi.fn();
    renderDetail({ planDayKey: START, onShowToday });
    expect(screen.getByText(new RegExp(t(lang, 'planViewingOtherDay')))).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'planBackToToday')));
    expect(onShowToday).toHaveBeenCalled();
  });

  it('falls back to today for a date the run does not contain', () => {
    // Before the plan started, and after it ended — neither is a day of this run.
    for (const key of [addDays(START, -1), addDays(START, 5)]) {
      renderDetail({ planDayKey: key });
      expect(screen.getByText(/Jour 3 sur 3/), key).toBeTruthy();
      expect(screen.queryByText(t(lang, 'planBackToToday')), key).toBeNull();
      cleanup();
    }
  });

  it('ignores a malformed day rather than breaking the page', () => {
    renderDetail({ planDayKey: 'not-a-date' });
    expect(screen.getByText(/Jour 3 sur 3/)).toBeTruthy();
  });

  // A day the reader MOVED on the calendar opens on the date they moved it to —
  // which the recurrence pattern knows nothing about. Numbering it from the
  // pattern alone gave day 2 the number of whatever day sits on that date, and
  // when the plan has no such day the entire card disappeared, taking the way
  // back with it.
  it('opens a moved day as the day it still is', () => {
    const TOMORROW = addDays(todayKey(), 1);
    const movedPrayer = { ...prayer, schedule_overrides: { [DAY_2]: { movedTo: TOMORROW } } };
    renderDetail({
      prayer: movedPrayer, store: { prayers: [movedPrayer] }, planDayKey: TOMORROW,
    });
    expect(screen.getByText(/Jour 2 sur 3/)).toBeTruthy();
  });
});

// Reading back over a day already prayed, or ahead to one still to come, is a
// pair of arrows on the day itself (and a swipe, covered in the browser spec) —
// no trip out to the calendar and back for each day. What must hold: a step
// only ever lands on a real day of THIS run, the ends of the plan are dead
// ends, and the page around the day stays about today.
describe('PrayerDetail — paging between the days of a plan', () => {
  const prev = () => screen.getByRole('button', { name: new RegExp(t(lang, 'planPrevDay')) });
  const next = () => screen.getByRole('button', { name: new RegExp(t(lang, 'planNextDay')) });

  it('steps back to the day before the one on screen', () => {
    const onGoToDay = vi.fn();
    renderDetail({ onGoToDay });
    fireEvent.click(prev());
    expect(onGoToDay).toHaveBeenCalledWith(DAY_2);
  });

  it('steps forward to the next day of the run', () => {
    const onGoToDay = vi.fn();
    renderDetail({ planDayKey: START, onGoToDay });
    fireEvent.click(next());
    expect(onGoToDay).toHaveBeenCalledWith(DAY_2);
  });

  it('has no day before the first or after the last', () => {
    const onGoToDay = vi.fn();
    renderDetail({ planDayKey: START, onGoToDay });
    expect(prev().disabled).toBe(true);
    cleanup();
    renderDetail({ onGoToDay }); // today is day 3 of 3
    expect(next().disabled).toBe(true);
    expect(onGoToDay).not.toHaveBeenCalled();
  });

  it('steps over a day that was skipped', () => {
    const skipped = { ...prayer, schedule_overrides: { [DAY_2]: { skip: true } } };
    const onGoToDay = vi.fn();
    renderDetail({ prayer: skipped, store: { prayers: [skipped] }, onGoToDay });
    fireEvent.click(prev());
    expect(onGoToDay).toHaveBeenCalledWith(START);
  });

  it('moves between days with the arrow keys', () => {
    const onGoToDay = vi.fn();
    renderDetail({ onGoToDay });
    // French reads left to right, so the left arrow is the day before.
    fireEvent.keyDown(screen.getByText(/Jour 3 sur 3/).closest('section'), { key: 'ArrowLeft' });
    expect(onGoToDay).toHaveBeenCalledWith(DAY_2);
  });

  it('offers nothing to page to when the host cannot open another day', () => {
    renderDetail(); // no onGoToDay
    expect(prev().disabled).toBe(true);
    expect(next().disabled).toBe(true);
  });

  it('says plainly when the day on screen has not arrived yet', () => {
    const starting = {
      ...prayer,
      schedule: { ...prayer.schedule, startDate: todayKey(), plan: { id: 'fast3', startDate: todayKey() } },
    };
    const tomorrow = addDays(todayKey(), 1);
    renderDetail({ prayer: starting, store: { prayers: [starting] }, planDayKey: tomorrow });
    expect(screen.getByText(new RegExp(t(lang, 'planDayUpcoming')))).toBeTruthy();
    expect(screen.queryByText(new RegExp(t(lang, 'planViewingOtherDay')))).toBeNull();
  });

  it('shows what a past day held: that it was prayed, and what was written then', () => {
    const withNote = {
      ...prayer,
      prayer_updates: [
        { id: 'u1', text: 'Jour un: paix', created_at: `${START}T09:00:00` },
        { id: 'u2', text: 'Écrit aujourd’hui', created_at: `${todayKey()}T09:00:00` },
      ],
    };
    renderDetail({
      prayer: withNote,
      store: { prayers: [withNote], completions: { p1: [START] } },
      planDayKey: START,
    });
    // The trace is a reminder of that day, not a second copy of the whole
    // activity list: only the note actually written on day 1 appears in it.
    const trace = screen.getByText(t(lang, 'planDayNotes')).closest('section');
    expect(within(trace).getByText('Jour un: paix')).toBeTruthy();
    expect(within(trace).queryByText('Écrit aujourd’hui')).toBeNull();
    expect(within(trace).getByText(t(lang, 'prayedOnDay'))).toBeTruthy();
  });

  it('keeps the trace off today, where the activity list already carries it', () => {
    const withNote = {
      ...prayer,
      prayer_updates: [{ id: 'u1', text: 'Note du jour', created_at: `${todayKey()}T09:00:00` }],
    };
    renderDetail({ prayer: withNote, store: { prayers: [withNote], completions: { p1: [todayKey()] } } });
    expect(screen.queryByText(t(lang, 'planDayNotes'))).toBeNull();
  });
});
