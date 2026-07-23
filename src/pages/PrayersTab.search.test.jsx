// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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
import { t } from '../i18n';

const lang = 'fr';
const prayer = (id, extra = {}) => ({
  id,
  title: `Prière ${id}`,
  description: '',
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-07-01T00:00:00Z',
  prayer_categories: [],
  prayer_points: [],
  prayer_updates: [],
  prayer_testimonies: [],
  ...extra,
});

const rows = [
  prayer('mission', {
    title: 'Voyage missionnaire',
    description: 'Préparation de l’équipe',
    person_name: 'Anna',
    prayer_categories: [{ category_id: 'ministry' }],
  }),
  prayer('health', {
    title: 'Santé de Marc',
    person_name: 'Marc',
    prayer_updates: [{ id: 'u1', text: 'Opération réussie', created_at: '2026-07-20T00:00:00Z' }],
  }),
  prayer('answered-month', {
    title: 'Paix à la maison',
    status: 'answered',
    answered_at: '2026-07-12T00:00:00Z',
    prayer_testimonies: [{ id: 'tm1', content: 'La relation a été restaurée', created_at: '2026-07-12T00:00:00Z' }],
  }),
  prayer('answered-earlier', {
    title: 'Travail',
    status: 'answered',
    answered_at: '2026-05-12T00:00:00Z',
  }),
];

const renderJournal = () => render(
  <MemoryRouter>
    <PrayersTab onAdd={() => {}} />
  </MemoryRouter>
);

afterEach(cleanup);
beforeEach(() => {
  useLayoutStore.setState({ fabSuppressed: false });
  useAuthStore.setState({ user: null });
  useCommunityStore.setState({
    prayerShares: {
      health: [{ groupId: 'hope', groupName: 'Groupe Espoir', prayingCount: 2 }],
    },
  });
  usePrayerStore.setState({
    prayers: rows,
    categories: [{ id: 'ministry', name: 'Ministère', emoji: '⛪', color: '#76538a' }],
    settings: { language: lang },
    loading: false,
    completions: {},
  });
});

describe('Journal retrieval', () => {
  it('opens filters as a modal overlay and closes it with Escape', () => {
    renderJournal();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'journalFilters') }));

    const dialog = screen.getByRole('dialog', { name: t(lang, 'journalFilters') });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.parentElement.className).toContain('fixed');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: t(lang, 'journalFilters') })).toBeNull();
  });

  it('finds active prayers by update text and explains the match locally', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderJournal();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'search') }));
    fireEvent.change(screen.getByRole('textbox', { name: t(lang, 'search') }), {
      target: { value: 'opération' },
    });

    expect(screen.getByText('Santé de Marc')).toBeTruthy();
    expect(screen.getByText('Opération réussie')).toBeTruthy();
    expect(screen.queryByText('Voyage missionnaire')).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('uses the same search across answered prayers and testimonies', () => {
    renderJournal();
    fireEvent.click(screen.getByRole('button', { name: `${t(lang, 'answered')} 2` }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'search') }));
    fireEvent.change(screen.getByRole('textbox', { name: t(lang, 'search') }), {
      target: { value: 'restauree' },
    });

    expect(screen.getByText('Paix à la maison')).toBeTruthy();
    expect(screen.queryByText('Travail')).toBeNull();
    expect(screen.getByText(`1 ${t(lang, 'prayer')}`)).toBeTruthy();
  });

  it('filters by source/group without exposing another permanent control', () => {
    renderJournal();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'journalFilters') }));
    fireEvent.change(screen.getByRole('combobox', { name: t(lang, 'journalSource') }), {
      target: { value: 'group:Groupe Espoir' },
    });

    expect(screen.getByText('Santé de Marc')).toBeTruthy();
    expect(screen.queryByText('Voyage missionnaire')).toBeNull();
    expect(screen.getByText(`1 ${t(lang, 'prayer')}`)).toBeTruthy();
  });

  it('offers a simple answered-date choice: this month or earlier', () => {
    renderJournal();
    fireEvent.click(screen.getByRole('button', { name: `${t(lang, 'answered')} 2` }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'journalFilters') }));
    fireEvent.change(screen.getByRole('combobox', { name: t(lang, 'schedDateLabel') }), {
      target: { value: 'earlier' },
    });

    expect(screen.getByText('Travail')).toBeTruthy();
    expect(screen.queryByText('Paix à la maison')).toBeNull();
  });
});
