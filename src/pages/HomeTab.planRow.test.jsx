// @vitest-environment jsdom
//
// Today's hero card leads the page, so when a guided plan day is what remains
// it must read as that day — which plan, how far in, and the day's theme as the
// headline — instead of the plan's unchanging name. Once prayed, the row folds
// into the quiet "Prayed today" list, which is a receipt: the plan's name only,
// but correctly localized rather than the title the run was started with.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../lib/supabase', () => {
  const chain = {
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => chain,
    eq: () => Promise.resolve({ data: null, error: null }),
    select: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return { supabase: { auth: { getUser: async () => ({ data: { user: null } }) }, from: () => chain } };
});
vi.mock('../lib/mutationQueue', () => ({ enqueue: vi.fn(), pendingPrayerIds: vi.fn(() => new Set()) }));
vi.mock('../lib/analytics', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, track: vi.fn() };
});
vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));

import HomeTab from './HomeTab';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useCommunityStore from '../store/communityStore';
import useLayoutStore from '../store/layoutStore';
import { planDayContent } from '../content/prayerPlans';
import { pick } from '../content/teaching';
import { t } from '../i18n';
import { todayKey } from '../lib/prayedLog';
import { addDays } from '../lib/schedule';

const lang = 'fr';
const DAY = todayKey();
const PLAN = 'fast3';
const START = addDays(DAY, -1); // today is day 2 of 3
const dayLabel = t(lang, 'planDayOf', { n: 2, total: 3 });
const planName = t(lang, 'planFast3Title');
const theme = pick(planDayContent(PLAN, 2).theme, lang);

const planRun = {
  id: 'plan1',
  title: 'Titre enregistré',
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  prayer_categories: [], prayer_points: [], prayer_testimonies: [], prayer_updates: [],
  schedule: {
    type: 'recurring', freq: 'daily', startDate: START,
    end: { kind: 'count', count: 3 },
    plan: { id: PLAN, startDate: START },
  },
};

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: null });
  useCommunityStore.setState({ prayerShares: {}, fetchPrayerShares: vi.fn() });
  useLayoutStore.setState({ fabSuppressed: false });
  usePrayerStore.setState({
    prayers: [planRun],
    categories: [],
    completions: {},
    settings: { language: lang },
    loading: false,
    userId: null,
  });
});

const renderHome = () => render(<MemoryRouter><HomeTab onAdd={() => {}} /></MemoryRouter>);

describe('HomeTab — a plan day on Today', () => {
  it('headlines the day\'s theme and says which plan and day above it', () => {
    renderHome();
    // The hero eyebrow and the row's own context line both carry it.
    expect(screen.getAllByText(`${planName} · ${dayLabel}`).length).toBe(2);
    expect(screen.getAllByText(theme).length).toBe(2);
    expect(screen.queryByText('Titre enregistré')).toBeNull();
  });

  it('keeps the remaining count for an ordinary prayer', () => {
    usePrayerStore.setState({
      prayers: [{
        ...planRun, id: 'p2', title: 'Prière ordinaire',
        schedule: { type: 'recurring', freq: 'daily', startDate: START, end: { kind: 'never' } },
      }],
    });
    renderHome();
    expect(screen.getByText(t(lang, 'todayRemainingLabel', { n: 1 }))).toBeTruthy();
  });

  it('shows the plan\'s own name in the collapsed "Prayed today" list', () => {
    usePrayerStore.setState({ completions: { plan1: [DAY] } });
    renderHome();
    fireEvent.click(screen.getByText(new RegExp(t(lang, 'prayedTodayLabel'))));
    expect(screen.getByText(planName)).toBeTruthy();
    expect(screen.queryByText('Titre enregistré')).toBeNull();
  });
});
