// @vitest-environment jsdom
//
// Today is driven by COMPLETION state: the altar card counts what remains,
// "Pray now" opens only unfinished prayers (resume, never repeat), completed
// prayers fold into a collapsed "Prayed today" row, and a fully-prayed day
// rests in the same card with a calm status and an explicit "Pray again" that
// walks the whole day.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

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
import { todayKey } from '../lib/prayedLog';
import { addDays } from '../lib/schedule';
import { t, tp } from '../i18n';

const lang = 'fr';
const DAY = todayKey();
const daily = { type: 'recurring', freq: 'daily', startDate: '2020-01-01', end: { kind: 'never' } };
const prayer = (id, title) => ({
  id, title, status: 'active', schedule: daily, created_at: '2026-01-01T00:00:00Z',
  prayer_categories: [], prayer_points: [], prayer_testimonies: [], prayer_updates: [],
});

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: null });
  useCommunityStore.setState({ prayerShares: {}, fetchPrayerShares: vi.fn() });
  useLayoutStore.setState({ fabSuppressed: false });
  usePrayerStore.setState({
    prayers: [prayer('p1', 'Prière un'), prayer('p2', 'Prière deux'), prayer('p3', 'Prière trois')],
    categories: [],
    completions: {},
    settings: { language: lang },
    loading: false,
    userId: null,
  });
});

const renderHome = () => render(<MemoryRouter><HomeTab onAdd={() => {}} /></MemoryRouter>);

describe('HomeTab — remaining vs completed', () => {
  it('counts only what REMAINS today, not the total scheduled', () => {
    usePrayerStore.setState({ completions: { p1: [DAY] } });
    renderHome();
    expect(screen.getByText(t(lang, 'todayRemainingLabel', { n: 2 }))).toBeTruthy();
    // The completed prayer left the main list and sits in the collapsed row.
    expect(screen.queryByText('Prière un')).toBeNull();
    expect(screen.getByText(new RegExp(t(lang, 'prayedTodayLabel')))).toBeTruthy();
    fireEvent.click(screen.getByText(new RegExp(t(lang, 'prayedTodayLabel'))));
    expect(screen.getByText('Prière un')).toBeTruthy();
  });

  it('"Pray now" opens a session on only the remaining prayers (resume, no repeats)', () => {
    usePrayerStore.setState({ completions: { p1: [DAY] } });
    renderHome();
    fireEvent.click(screen.getByText(t(lang, 'beginPrayer')));
    // The session resumes with the first UNFINISHED request…
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(within(screen.getByRole('dialog')).getByText('Prière deux')).toBeTruthy();
    // …and its walk is 2 steps, not 3 (the prayed one is not repeated).
    expect(screen.getByText('1 / 2')).toBeTruthy();
  });

  it('advancing in the session updates Home the moment it closes (partial exit + resume)', () => {
    renderHome();
    expect(screen.getByText(t(lang, 'todayRemainingLabel', { n: 3 }))).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'beginPrayer')));
    fireEvent.click(screen.getByText(t(lang, 'continueBtn'))); // past p1
    fireEvent.click(screen.getByLabelText(t(lang, 'close'))); // leave halfway
    // Home now counts 2 remaining; reopening resumes at p2.
    expect(screen.getByText(t(lang, 'todayRemainingLabel', { n: 2 }))).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'beginPrayer')));
    expect(within(screen.getByRole('dialog')).getByText('Prière deux')).toBeTruthy();
  });

  it('all prayers completed: a clear status (not a button) and an explicit "Pray again"', () => {
    usePrayerStore.setState({ completions: { p1: [DAY], p2: [DAY], p3: [DAY] } });
    renderHome();
    expect(screen.getByRole('status').textContent).toContain(t(lang, 'todayCompleteTitle'));
    expect(screen.queryByText(t(lang, 'beginPrayer'))).toBeNull();
    // "Pray again" walks ALL of today's prayers again, explicitly.
    fireEvent.click(screen.getByText(t(lang, 'prayAgain')));
    expect(screen.getByText('1 / 3')).toBeTruthy();
    expect(within(screen.getByRole('dialog')).getByText('Prière un')).toBeTruthy();
  });

  it('a completed day rests in the same altar card: how many were prayed, then the ways to stay', () => {
    usePrayerStore.setState({
      completions: { p1: [DAY], p2: [DAY], p3: [DAY] },
      settings: { language: lang, dailyReminderEnabled: true, dailyReminderTime: '06:00' },
    });
    renderHome();
    const altar = screen.getByRole('region', { name: t(lang, 'todayCompleteTitle') });
    expect(within(altar).getByText(tp(lang, 'todayPrayedCount', 3))).toBeTruthy();
    expect(within(altar).getByText(t(lang, 'remainWithGod'))).toBeTruthy();
    expect(within(altar).getByText(new RegExp(t(lang, 'nextReminder')))).toBeTruthy();
    // The reminder is said once, inside the card.
    expect(screen.getAllByText(new RegExp(t(lang, 'nextReminder')))).toHaveLength(1);
  });

  it('what was prayed and what was missed fold into one panel, each row naming its count', () => {
    const missed = { ...prayer('m1', 'Prière manquée'), schedule: { type: 'once', date: addDays(DAY, -1) } };
    usePrayerStore.setState((s) => ({ prayers: [...s.prayers, missed], completions: { p1: [DAY] } }));
    renderHome();
    const prayed = screen.getByRole('button', { name: `${t(lang, 'prayedTodayLabel')} 1` });
    const catchUp = screen.getByRole('button', { name: `${t(lang, 'catchUpTitle')} 1` });
    expect(prayed.closest('.today-folds')).toBe(catchUp.closest('.today-folds'));
  });

  // Today answers "what am I bringing before God today?", not "how is my
  // prayer list organized?": no circle overview, no per-circle counts, and no
  // circle name on the hero or the rows — circles live in the Journal and on a
  // prayer's own page.
  it('shows no circle overview, counts or circle names — only what to pray', () => {
    usePrayerStore.setState({
      prayers: [
        { ...prayer('p1', 'Prière un'), circle: 'household', for_other: true, person_name: 'Marie' },
        { ...prayer('p2', 'Prière deux'), circle: 'household' },
        { ...prayer('p3', 'Prière trois'), circle: 'nations' },
      ],
    });
    renderHome();
    for (const circle of ['household', 'nations']) {
      expect(screen.queryByText(t(lang, `circle_${circle}`))).toBeNull();
    }
    expect(screen.queryByRole('navigation')).toBeNull();
    // The hero keeps the one detail that helps someone pray: who it is for.
    expect(screen.getByText(t(lang, 'forPersonLabel', { name: 'Marie' }))).toBeTruthy();
    expect(screen.getByText(t(lang, 'beginPrayer'))).toBeTruthy();
  });

  it('a completed day offers an optional "Remain with God" — stillness, not a reward', () => {
    usePrayerStore.setState({ completions: { p1: [DAY], p2: [DAY], p3: [DAY] } });
    renderHome();
    fireEvent.click(screen.getByText(t(lang, 'remainWithGod')));
    const dialog = screen.getByRole('dialog', { name: t(lang, 'remainWithGod') });
    // A choice of duration and a way out — nothing generated, nothing counted.
    expect(within(dialog).getByText(t(lang, 'remain30s'))).toBeTruthy();
    expect(within(dialog).getByText(t(lang, 'remain1m'))).toBeTruthy();
    fireEvent.click(within(dialog).getByText(t(lang, 'remain30s')));
    expect(within(dialog).getByText(t(lang, 'remainStill'))).toBeTruthy();
    expect(dialog.textContent).not.toMatch(/\d+\s*(s|sec|%)/);
    fireEvent.click(within(dialog).getByText(t(lang, 'remainFinish')));
    expect(screen.queryByRole('dialog', { name: t(lang, 'remainWithGod') })).toBeNull();
  });

  it('a prayer added after the day was complete re-opens Today', () => {
    usePrayerStore.setState({
      prayers: [prayer('p1', 'Prière un')],
      completions: { p1: [DAY] },
    });
    const { rerender } = renderHome();
    expect(screen.getByRole('status').textContent).toContain(t(lang, 'todayCompleteTitle'));

    usePrayerStore.setState((s) => ({ prayers: [prayer('pNew', 'Nouvelle prière'), ...s.prayers] }));
    rerender(<MemoryRouter><HomeTab onAdd={() => {}} /></MemoryRouter>);
    expect(screen.getByText(t(lang, 'todayRemainingLabel', { n: 1 }))).toBeTruthy();
    expect(screen.getByText(t(lang, 'beginPrayer'))).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('completions recorded elsewhere (onboarding / post-save session) reflect on Home', () => {
    // Onboarding and PrayerSavedStep call the same markPrayedOn — simulate one.
    usePrayerStore.getState().markPrayedOn('p1', DAY);
    renderHome();
    expect(screen.getByText(t(lang, 'todayRemainingLabel', { n: 2 }))).toBeTruthy();
  });

  it('"Pray now" in catch-up walks the missed prayers, recording each on the day it was missed', () => {
    const YESTERDAY = addDays(DAY, -1);
    const missed = {
      id: 'm1', title: 'Prière manquée', status: 'active',
      schedule: { type: 'once', date: YESTERDAY }, created_at: '2026-01-01T00:00:00Z',
      prayer_categories: [], prayer_points: [], prayer_testimonies: [], prayer_updates: [],
    };
    // Alongside today's daily prayers, so both walks coexist on the page.
    usePrayerStore.setState((s) => ({ prayers: [...s.prayers, missed] }));
    renderHome();

    // Open the collapsed catch-up section, then start its walk (scoped to the
    // catch-up panel so it can't be confused with Today's "Pray now").
    fireEvent.click(screen.getByText(new RegExp(t(lang, 'catchUpTitle'))));
    const panel = document.getElementById('today-catch-up');
    fireEvent.click(within(panel).getByText(t(lang, 'prayNow')));

    // The immersive session opens on the missed request, walking only it.
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Prière manquée')).toBeTruthy();
    expect(within(dialog).getByText('1 / 1')).toBeTruthy();

    // Finishing records the completion on the MISSED day, not today — so it
    // clears from catch-up exactly like the per-item checkmark would.
    fireEvent.click(within(dialog).getByText(t(lang, 'amenBtn')));
    expect(usePrayerStore.getState().completions.m1).toEqual([YESTERDAY]);
  });

  it('empty Today: keeps the explanatory Add CTA and suppresses the floating Add button', () => {
    usePrayerStore.setState({ prayers: [], completions: {} });
    renderHome();
    expect(screen.getByText(t(lang, 'emptyAddManual'))).toBeTruthy();
    expect(useLayoutStore.getState().fabSuppressed).toBe(true);
  });

  it('empty Today: offers prayer plans as the other way in', () => {
    usePrayerStore.setState({ prayers: [], completions: {} });
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<HomeTab onAdd={() => {}} />} />
          <Route path="/plans" element={<p>plans page</p>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText(t(lang, 'explorePlan')));
    expect(screen.getByText('plans page')).toBeTruthy();
  });

  it('non-empty Today releases the FAB', () => {
    renderHome();
    expect(useLayoutStore.getState().fabSuppressed).toBe(false);
  });
});
