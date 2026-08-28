// @vitest-environment jsdom
//
// A running plan used to show one day only: today's. The calendar can now hand
// over any other day of the same run (`?day=` → the planDayKey prop), so a
// reader can re-read a day they missed or look at the next one. What must hold:
// the day on screen is the day that was asked for, it is clearly marked as not
// today with a way back, and a key the run does not actually contain changes
// nothing rather than inventing a day.
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
import { todayKey } from '../lib/prayedLog';
import { t } from '../i18n';

const lang = 'fr';

// A three-day fast that began the day before yesterday: today is day 3, and
// day 1 is a day the reader has already passed.
const START = addDays(todayKey(), -2);
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

const renderDetail = (props = {}) => {
  usePrayerStore.setState({ prayers: [prayer], categories: [], completions: {}, settings: { language: lang } });
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
});
