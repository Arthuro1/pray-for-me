// @vitest-environment jsdom
//
// Journal decluttering + the optional People view: the People lens exists only
// when enough person data does; a filtered-zero offers Clear filters (never Add
// prayer); the count line appears only while filters narrow the list.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }));
vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../lib/mutationQueue', () => ({
  enqueue: vi.fn(),
  pendingPrayerIds: () => new Set(),
}));

import PrayersTab from './PrayersTab';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useCommunityStore from '../store/communityStore';
import useLayoutStore from '../store/layoutStore';
import useFollowUpStore from '../store/followUpStore';
import { todayKey } from '../lib/prayedLog';
import { t } from '../i18n';

const lang = 'fr';
const prayer = (id, extra = {}) => ({
  id, title: `Prière ${id}`, status: 'active', created_at: '2026-01-01T00:00:00Z',
  prayer_categories: [], prayer_points: [], prayer_testimonies: [], prayer_updates: [], ...extra,
});

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  navigate.mockClear();
  useLayoutStore.setState({ fabSuppressed: false });
  useCommunityStore.setState({ prayerShares: {} });
  useFollowUpStore.setState({ followUps: {} });
  usePrayerStore.setState({
    prayers: [prayer('a1'), prayer('a2')],
    categories: [],
    completions: {},
    settings: { language: lang },
    loading: false,
  });
  useAuthStore.setState({ user: null });
});

const renderJournal = () =>
  render(<MemoryRouter><PrayersTab onAdd={() => {}} /></MemoryRouter>);

const openPeopleView = () => {
  fireEvent.click(screen.getByRole('button', { name: t(lang, 'search') }));
  fireEvent.click(screen.getByRole('button', { name: t(lang, 'peopleView') }));
};

describe('Journal — counts & zero states', () => {
  it('shows NO count line without active filters (the segments carry the totals)', () => {
    renderJournal();
    expect(screen.queryByText(t(lang, 'resultsCount', { n: 2 }))).toBeNull();
  });

  it('shows "N results" only while a filter narrows the list', () => {
    renderJournal();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'search') }));
    fireEvent.change(screen.getByPlaceholderText(t(lang, 'search')), { target: { value: 'a1' } });
    expect(screen.getByText(`1 ${t(lang, 'prayer')}`)).toBeTruthy();
  });

  it('a filtered zero offers Clear filters — never another Add prayer nudge', () => {
    renderJournal();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'search') }));
    fireEvent.change(screen.getByPlaceholderText(t(lang, 'search')), { target: { value: 'zzz' } });
    expect(screen.getByText(t(lang, 'clearFiltersBtn'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'emptyAddManual'))).toBeNull();
    // The FAB stays available (prayers exist — only the filter hides them).
    expect(useLayoutStore.getState().fabSuppressed).toBe(true);
    // Clearing restores the list.
    fireEvent.click(screen.getByText(t(lang, 'clearFiltersBtn')));
    expect(screen.getByText('Prière a1')).toBeTruthy();
  });

  it('a truly empty Journal keeps the Add prayer call-to-action', () => {
    usePrayerStore.setState({ prayers: [] });
    renderJournal();
    expect(screen.getByText(t(lang, 'emptyAddManual'))).toBeTruthy();
    expect(useLayoutStore.getState().fabSuppressed).toBe(true);
  });
});

describe('Journal — People view', () => {
  const withPeople = () => {
    usePrayerStore.setState({
      prayers: [
        prayer('a1'),
        prayer('m1', { for_other: true, person_name: 'Marc' }),
        prayer('m2', { for_other: true, person_name: 'Marc', status: 'answered' }),
        prayer('j1', { for_other: true, person_name: 'Julie', prayer_updates: [{ id: 'u1', text: 'Opération réussie', created_at: '2026-07-15' }] }),
      ],
    });
  };

  it('stays hidden when insufficient person data exists', () => {
    renderJournal(); // only unnamed prayers
    expect(screen.queryByRole('button', { name: t(lang, 'peopleView') })).toBeNull();
  });

  it('groups related prayers by person with accurate counts and latest update', () => {
    withPeople();
    renderJournal();
    openPeopleView();
    expect(screen.getByText('Marc')).toBeTruthy();
    expect(screen.getByText('Julie')).toBeTruthy();
    // Marc: 1 active · 1 answered
    expect(screen.getByText(`1 ${t(lang, 'active2')} · 1 ${t(lang, 'answered2')}`)).toBeTruthy();
    // Julie's latest update surfaces on her card.
    expect(screen.getByText('Opération réussie')).toBeTruthy();
  });

  it('selecting a person opens their related prayers only', () => {
    withPeople();
    renderJournal();
    openPeopleView();
    fireEvent.click(screen.getByText('Marc'));
    expect(screen.getByText('Prière m1')).toBeTruthy();
    expect(screen.getByText('Prière m2')).toBeTruthy();
    expect(screen.queryByText('Prière j1')).toBeNull();
    expect(screen.queryByText('Prière a1')).toBeNull();
  });

  it('a pending follow-up date appears on the person card', () => {
    withPeople();
    useFollowUpStore.setState({ followUps: { m1: { date: '2099-01-05', status: 'pending' } } });
    renderJournal();
    openPeopleView();
    // The label carries the localized date; assert on its stable prefix.
    const label = t(lang, 'followUpNext', { date: '' }).trim();
    expect(screen.getByText((text) => text.startsWith(label))).toBeTruthy();
  });
});

describe('Journal — Pray for [name]', () => {
  const dayKey = todayKey();
  const openJulie = () => {
    usePrayerStore.setState({
      prayers: [
        prayer('j1', { for_other: true, person_name: 'Julie' }),
        prayer('j2', { for_other: true, person_name: 'Julie' }),
        prayer('j3', { for_other: true, person_name: 'Julie', status: 'answered' }),
        prayer('m1', { for_other: true, person_name: 'Marc' }),
      ],
    });
    renderJournal();
    openPeopleView();
    fireEvent.click(screen.getByText('Julie'));
  };

  it('offers ONE contextual action counting only the person’s active, not-yet-prayed requests', () => {
    openJulie();
    expect(screen.getByText(t(lang, 'prayForPerson', { name: 'Julie', n: 2 }))).toBeTruthy();
  });

  it('the session walks only that person’s prayers and records ordinary completions', () => {
    openJulie();
    fireEvent.click(screen.getByText(t(lang, 'prayForPerson', { name: 'Julie', n: 2 })));
    // First of Julie's prayers opens — never Marc's.
    expect(screen.getAllByText('Prière j1').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText(t(lang, 'continueBtn')));
    expect(usePrayerStore.getState().completions.j1).toContain(dayKey);
    // Leaving midway keeps progress; reopening resumes with the unfinished one.
    fireEvent.click(screen.getByLabelText(t(lang, 'close')));
    expect(screen.getByText(t(lang, 'prayForPerson', { name: 'Julie', n: 1 }))).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'prayForPerson', { name: 'Julie', n: 1 })));
    expect(screen.getAllByText('Prière j2').length).toBeGreaterThan(0);
  });

  it('shows a quiet complete state once every active request was prayed today', () => {
    usePrayerStore.setState({ completions: { j1: [dayKey], j2: [dayKey] } });
    openJulie();
    expect(screen.getByText(t(lang, 'personPrayedToday', { name: 'Julie' }))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'prayForPerson', { name: 'Julie', n: 2 }))).toBeNull();
    expect(screen.getByText(t(lang, 'prayAgainBtn'))).toBeTruthy();
  });

  it('no action renders for a person with no active prayers', () => {
    usePrayerStore.setState({
      prayers: [
        prayer('j3', { for_other: true, person_name: 'Julie', status: 'answered' }),
        prayer('m1', { for_other: true, person_name: 'Marc' }),
      ],
    });
    renderJournal();
    openPeopleView();
    fireEvent.click(screen.getByText('Julie'));
    expect(screen.queryByText(t(lang, 'prayAgainBtn'))).toBeNull();
    expect(screen.queryByText((text) => text.startsWith('Prier pour Julie'))).toBeNull();
  });
});
