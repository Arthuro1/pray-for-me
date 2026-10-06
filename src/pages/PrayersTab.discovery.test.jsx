// @vitest-environment jsdom
//
// The Journal stays visually quiet, but its tools stop being a guessing game:
// every control has a real accessible name, filters are reachable without first
// opening search once the list is long enough to need them, an active filter
// says so in words with one tap to undo it, and each tool is introduced once.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }));

import PrayersTab from './PrayersTab';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useLayoutStore from '../store/layoutStore';
import useCommunityStore from '../store/communityStore';
import { JOURNAL_HINTS, JOURNAL_HINTS_STORAGE_KEY } from '../lib/journalHints';
import { t } from '../i18n';

const lang = 'fr';
const prayer = (id, extra = {}) => ({
  id, title: `Prière ${id}`, status: 'active', created_at: '2026-01-01T00:00:00Z',
  prayer_categories: [], prayer_points: [], prayer_testimonies: [], ...extra,
});
const many = (n) => Array.from({ length: n }, (_, i) => prayer(`a${i + 1}`));

afterEach(cleanup);
beforeEach(() => {
  navigate.mockClear();
  localStorage.clear();
  useLayoutStore.setState({ fabSuppressed: false });
  useCommunityStore.setState({ prayerShares: {} });
  useAuthStore.setState({ user: null });
  usePrayerStore.setState({
    prayers: many(2), categories: [], settings: { language: lang }, loading: false,
  });
});

const renderJournal = () =>
  render(<MemoryRouter><PrayersTab onAdd={() => {}} /></MemoryRouter>);
// Every hint dismissed — for the tests that are not about hints.
const hintsSeen = () => localStorage.setItem(
  JOURNAL_HINTS_STORAGE_KEY,
  JSON.stringify({ version: 1, seen: [JOURNAL_HINTS.PEOPLE, JOURNAL_HINTS.SEARCH] }),
);

describe('Journal tools — findable, and named', () => {
  it('gives every header control a real name, not a mystery icon', () => {
    renderJournal();
    expect(screen.getByRole('button', { name: t(lang, 'search') })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: t(lang, 'emptyAddManual') }).length).toBeGreaterThan(0);
  });

  it('keeps the tool row away while the list is short enough to read', () => {
    usePrayerStore.setState({ prayers: many(2), categories: [{ id: 'c1', name: 'Famille' }] });
    hintsSeen();
    renderJournal();
    expect(screen.queryByRole('button', { name: t(lang, 'journalFilters') })).toBeNull();
  });

  it('stops hiding filters behind the search toggle once the list is long', () => {
    usePrayerStore.setState({ prayers: many(4), categories: [{ id: 'c1', name: 'Famille' }] });
    hintsSeen();
    renderJournal();
    // Reachable straight away — no need to discover search first.
    expect(screen.getByRole('button', { name: t(lang, 'journalFilters') })).toBeTruthy();
    // …and the search FIELD still only appears when asked for.
    expect(screen.queryByPlaceholderText(t(lang, 'search'))).toBeNull();
  });

  it('offers the People lens by name only when there are people to group', () => {
    hintsSeen();
    renderJournal();
    expect(screen.queryByRole('button', { name: t(lang, 'peopleView') })).toBeNull();

    cleanup();
    usePrayerStore.setState({
      prayers: [
        prayer('a1', { person_name: 'Ana' }),
        prayer('a2', { person_name: 'Ben' }),
        prayer('a3', { person_name: 'Chidi' }),
      ],
    });
    renderJournal();
    expect(screen.getByRole('button', { name: t(lang, 'peopleView') })).toBeTruthy();
  });
});

describe('Journal tools — an active filter is obvious and undoable', () => {
  beforeEach(() => {
    usePrayerStore.setState({ prayers: many(4), categories: [{ id: 'c1', name: 'Famille' }] });
    hintsSeen();
  });

  it('says filters are on, counts the results, and clears them in one tap', () => {
    renderJournal();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'search') }));
    fireEvent.change(screen.getByPlaceholderText(t(lang, 'search')), { target: { value: 'a1' } });

    const status = screen.getByRole('status');
    expect(within(status).getByText(t(lang, 'filtersOnLabel'))).toBeTruthy();
    expect(within(status).getByText(`1 ${t(lang, 'prayer')}`)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'clearFiltersBtn')) }));
    expect(screen.getByText('Prière a2')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('says nothing about filters while none are on', () => {
    renderJournal();
    expect(screen.queryByText(t(lang, 'filtersOnLabel'))).toBeNull();
  });

  it('tells screen readers that the filter control is currently on', () => {
    renderJournal();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'journalFilters') }));
    fireEvent.change(screen.getByRole('combobox', { name: t(lang, 'allCategories') }), {
      target: { value: 'c1' },
    });
    expect(screen.getByRole('button', {
      name: `${t(lang, 'journalFilters')} — ${t(lang, 'filtersOnLabel')}`,
    })).toBeTruthy();
  });
});

describe('Journal tools — introduced once, then never again', () => {
  it('introduces search and filtering when the journal grows', () => {
    usePrayerStore.setState({ prayers: many(4) });
    renderJournal();
    expect(screen.getByText(t(lang, 'journalDiscoverHint'))).toBeTruthy();
  });

  it('introduces the People lens contextually, and opens it', () => {
    usePrayerStore.setState({
      prayers: [
        prayer('a1', { person_name: 'Ana' }),
        prayer('a2', { person_name: 'Ben' }),
        prayer('a3', { person_name: 'Chidi' }),
      ],
    });
    renderJournal();
    expect(screen.getByText(t(lang, 'journalPeopleHint'))).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: t(lang, 'journalPeopleHintCta') }));
    expect(screen.getByText('Ana')).toBeTruthy();
    expect(screen.queryByText(t(lang, 'journalPeopleHint'))).toBeNull();
  });

  it('shows one hint at a time, never two', () => {
    usePrayerStore.setState({
      prayers: [
        prayer('a1', { person_name: 'Ana' }),
        prayer('a2', { person_name: 'Ben' }),
        prayer('a3', { person_name: 'Chidi' }),
        prayer('a4', { person_name: 'Dara' }),
      ],
    });
    renderJournal();
    expect(screen.getByText(t(lang, 'journalPeopleHint'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'journalDiscoverHint'))).toBeNull();
  });

  it('does not come back once dismissed', () => {
    usePrayerStore.setState({ prayers: many(4) });
    renderJournal();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'hintDismiss') }));
    expect(screen.queryByText(t(lang, 'journalDiscoverHint'))).toBeNull();

    cleanup();
    renderJournal();
    expect(screen.queryByText(t(lang, 'journalDiscoverHint'))).toBeNull();
  });
});
