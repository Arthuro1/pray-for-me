// @vitest-environment jsdom
//
// The Journal header states each thing once: ONE segmented control carrying the
// Active/Answered counts (no stat cards), search folded behind an icon, and a
// category filter that only exists once categories do.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }));

import PrayersTab from './PrayersTab';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useLayoutStore from '../store/layoutStore';
import { t } from '../i18n';

const lang = 'fr';
const prayer = (id, extra = {}) => ({
  id, title: `Prière ${id}`, status: 'active', created_at: '2026-01-01T00:00:00Z',
  prayer_categories: [], prayer_points: [], prayer_testimonies: [], ...extra,
});

afterEach(cleanup);
beforeEach(() => {
  navigate.mockClear();
  useLayoutStore.setState({ fabSuppressed: false });
  usePrayerStore.setState({
    prayers: [prayer('a1'), prayer('a2'), prayer('x1', { status: 'answered', answered_at: new Date().toISOString() })],
    categories: [],
    settings: { language: lang },
    loading: false,
  });
  useAuthStore.setState({ user: null });
});

const renderJournal = () =>
  render(<MemoryRouter><PrayersTab onAdd={() => {}} /></MemoryRouter>);

describe('PrayersTab — simplified header', () => {
  it('one segmented control carries the counts; the stat cards are gone', () => {
    renderJournal();
    expect(screen.getByRole('button', { name: `${t(lang, 'active')} 2` })).toBeTruthy();
    expect(screen.getByRole('button', { name: `${t(lang, 'answered')} 1` })).toBeTruthy();
    // The three large statistic cards no longer exist. ("Active"/"Answered"
    // legitimately remain as the segment labels, so assert on the third card's
    // unique label and value instead.)
    expect(screen.queryByText(t(lang, 'thisWeek'))).toBeNull();
    expect(screen.queryByText('+1')).toBeNull();
  });

  it('search is folded behind an icon and its text survives segment switches', () => {
    renderJournal();
    expect(screen.queryByPlaceholderText(t(lang, 'search'))).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'search') }));
    const input = screen.getByPlaceholderText(t(lang, 'search'));
    fireEvent.change(input, { target: { value: 'a1' } });
    expect(screen.getByText('Prière a1')).toBeTruthy();
    expect(screen.queryByText('Prière a2')).toBeNull();

    // Switch to Answered and back: the search text (and filtering) is preserved.
    fireEvent.click(screen.getByRole('button', { name: `${t(lang, 'answered')} 1` }));
    fireEvent.click(screen.getByRole('button', { name: `${t(lang, 'active')} 2` }));
    expect(screen.getByPlaceholderText(t(lang, 'search')).value).toBe('a1');
    expect(screen.queryByText('Prière a2')).toBeNull();
  });

  it('hides the category filter control when no categories exist', () => {
    renderJournal();
    expect(screen.queryByRole('button', { name: t(lang, 'allCategories') })).toBeNull();
    usePrayerStore.setState({ categories: [{ id: 'c1', name: 'Famille', emoji: '👪', color: '#7c5cfc' }] });
    cleanup();
    renderJournal();
    expect(screen.getByRole('button', { name: t(lang, 'allCategories') })).toBeTruthy();
  });

  it('shows "answered this week" as quiet text inside the Answered segment', () => {
    renderJournal();
    expect(screen.queryByText(t(lang, 'answeredThisWeek', { n: 1 }))).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: `${t(lang, 'answered')} 1` }));
    expect(screen.getByText(t(lang, 'answeredThisWeek', { n: 1 }))).toBeTruthy();
  });

  it('empty Journal keeps its contextual Add CTA and suppresses the FAB', () => {
    usePrayerStore.setState({ prayers: [] });
    renderJournal();
    expect(screen.getByText(t(lang, 'emptyAddManual'))).toBeTruthy();
    expect(useLayoutStore.getState().fabSuppressed).toBe(true);
  });

  it('a non-empty Journal releases the FAB', () => {
    renderJournal();
    expect(useLayoutStore.getState().fabSuppressed).toBe(false);
  });
});
