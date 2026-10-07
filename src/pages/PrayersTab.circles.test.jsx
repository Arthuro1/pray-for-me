// @vitest-environment jsdom
//
// Journal "By circle": the Journal's one circle-oriented view — the same
// prayers (Active or Answered) grouped inner to outer by the circle each was
// placed in, unplaced prayers last — a way to find prayers, never a tally.
// Offered only once a circle is in use.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { act, render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => vi.fn() }));

import PrayersTab from './PrayersTab';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useLayoutStore from '../store/layoutStore';
import useCommunityStore from '../store/communityStore';
import { t, tp } from '../i18n';

const lang = 'fr';
const prayer = (id, extra = {}) => ({
  id, title: `Prière ${id}`, status: 'active', created_at: '2026-01-01T00:00:00Z',
  prayer_categories: [], prayer_points: [], prayer_testimonies: [], ...extra,
});

afterEach(cleanup);
beforeEach(() => {
  useLayoutStore.setState({ fabSuppressed: false });
  useCommunityStore.setState({ prayerShares: {} });
  useAuthStore.setState({ user: null });
  usePrayerStore.setState({
    prayers: [
      prayer('nation', { circle: 'nations' }),
      prayer('loose'),
      prayer('home', { circle: 'household' }),
      prayer('heart', { circle: 'self' }),
      prayer('home2', { circle: 'household' }),
      prayer('done', { circle: 'church', status: 'answered', answered_at: new Date().toISOString() }),
    ],
    categories: [],
    settings: { language: lang },
    loading: false,
  });
});

const renderJournal = (props = {}) => render(
  <MemoryRouter><PrayersTab onAdd={() => {}} onAddInCircle={vi.fn()} {...props} /></MemoryRouter>,
);
const byCircle = () => screen.getByRole('button', { name: t(lang, 'journalViewCircles') });
function LandedOnCircle() {
  const location = useLocation();
  return <p data-testid="circle-page">{`${location.pathname} ${JSON.stringify(location.state)}`}</p>;
}
const groupTitles = () => [...document.querySelectorAll('.journal-circle__title')].map((h) => h.textContent);

describe('PrayersTab — By circle', () => {
  it('is not offered before any prayer has a circle', () => {
    usePrayerStore.setState({ prayers: [prayer('a'), prayer('b')] });
    renderJournal();
    expect(screen.queryByRole('button', { name: t(lang, 'journalViewCircles') })).toBeNull();
  });

  it('groups active prayers inner to outer, with unplaced prayers last', () => {
    renderJournal();
    fireEvent.click(byCircle());
    expect(byCircle().getAttribute('aria-pressed')).toBe('true');
    expect(groupTitles()).toEqual([
      t(lang, 'circle_self'), t(lang, 'circle_household'), t(lang, 'circle_nations'), t(lang, 'circleUnplaced'),
    ]);
    const house = screen.getByRole('region', { name: t(lang, 'circle_household') });
    expect(within(house).getByText('Prière home')).toBeTruthy();
    expect(within(house).getByText('Prière home2')).toBeTruthy();
    expect(within(house).getByText(tp(lang, 'circlePrayerCount', 2))).toBeTruthy();
    // The circle is the heading; its rows never say it again.
    expect(within(house).getAllByText(t(lang, 'circle_household'))).toHaveLength(1);
    expect(within(screen.getByRole('region', { name: t(lang, 'circleUnplaced') })).getByText('Prière loose')).toBeTruthy();
    // Answered prayers are not part of the active altar, and empty circles never appear.
    expect(screen.queryByText('Prière done')).toBeNull();
    expect(groupTitles()).not.toContain(t(lang, 'circle_church'));
  });

  it('brings a new prayer straight into a circle', () => {
    const onAddInCircle = vi.fn();
    renderJournal({ onAddInCircle });
    fireEvent.click(byCircle());
    const name = t(lang, 'circle_household');
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'addToCircle', { circle: name }) }));
    expect(onAddInCircle).toHaveBeenCalledWith('household');
    // "Your prayers" has no circle to bring a prayer into.
    expect(within(screen.getByRole('region', { name: t(lang, 'circleUnplaced') })).queryByRole('button', { name: /\+/ })).toBeNull();
  });

  it('moves a prayer when its circle changes', () => {
    renderJournal();
    fireEvent.click(byCircle());
    act(() => {
      usePrayerStore.setState((s) => ({ prayers: s.prayers.map((p) => (p.id === 'loose' ? { ...p, circle: 'kingdom' } : p)) }));
    });
    expect(within(screen.getByRole('region', { name: t(lang, 'circle_kingdom') })).getByText('Prière loose')).toBeTruthy();
    expect(screen.queryByRole('region', { name: t(lang, 'circleUnplaced') })).toBeNull();
  });

  it('groups answered prayers too, without offering to add to an answered circle', () => {
    renderJournal();
    fireEvent.click(screen.getByRole('button', { name: `${t(lang, 'answered')} 1` }));
    fireEvent.click(byCircle());
    expect(groupTitles()).toEqual([t(lang, 'circle_church')]);
    const church = screen.getByRole('region', { name: t(lang, 'circle_church') });
    expect(within(church).getByText('Prière done')).toBeTruthy();
    expect(screen.queryByRole('button', { name: t(lang, 'addToCircle', { circle: t(lang, 'circle_church') }) })).toBeNull();
  });

  it('coming back from a circle page opened on Answered reopens Answered by circle', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/prayers', state: { journalView: 'circles', filter: 'answered' } }]}>
        <PrayersTab onAdd={() => {}} onAddInCircle={vi.fn()} />
      </MemoryRouter>,
    );
    expect(byCircle().getAttribute('aria-pressed')).toBe('true');
    expect(groupTitles()).toEqual([t(lang, 'circle_church')]);
  });

  it('is offered on Answered only once an answered prayer has a circle', () => {
    usePrayerStore.setState((s) => ({ prayers: s.prayers.map((p) => (p.id === 'done' ? { ...p, circle: undefined } : p)) }));
    renderJournal();
    fireEvent.click(screen.getByRole('button', { name: `${t(lang, 'answered')} 1` }));
    expect(screen.queryByRole('button', { name: t(lang, 'journalViewCircles') })).toBeNull();
    expect(screen.getByText('Prière done')).toBeTruthy();
  });

  it('remembers where an answered prayer and its testimony belonged', () => {
    usePrayerStore.setState((s) => ({
      prayers: [
        ...s.prayers,
        prayer('carried', {
          circle: 'people', status: 'answered', answered_at: new Date().toISOString(),
          community_origin_id: 'c-1', origin_group_name: 'Église',
          prayer_testimonies: [{ id: 't1', content: 'Merci', created_at: new Date().toISOString() }],
        }),
      ],
    }));
    renderJournal();
    fireEvent.click(screen.getByRole('button', { name: `${t(lang, 'answered')} 2` }));
    const row = (title) => screen.getByText(title).closest('button');
    expect(within(row('Prière done')).getByText(t(lang, 'circle_church'))).toBeTruthy();
    // A carried request keeps the carrier's own circle beside its testimony.
    expect(within(row('Prière carried')).getByText(t(lang, 'circle_people'))).toBeTruthy();
    expect(within(row('Prière carried')).getByText(t(lang, 'testimony'))).toBeTruthy();
  });

  it('names each circle as a way into its teaching, and is reopened when that page sends the reader back', () => {
    render(
      <MemoryRouter initialEntries={['/prayers']}>
        <Routes>
          <Route path="/prayers" element={<PrayersTab onAdd={() => {}} onAddInCircle={vi.fn()} />} />
          <Route path="/circles/:circleId" element={<LandedOnCircle />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(byCircle());
    fireEvent.click(within(screen.getByRole('region', { name: t(lang, 'circle_household') })).getByRole('link', { name: t(lang, 'circle_household') }));
    expect(screen.getByTestId('circle-page').textContent).toBe('/circles/household {"from":"/prayers","fromState":{"journalView":"circles","filter":"active"}}');
    cleanup();

    render(
      <MemoryRouter initialEntries={[{ pathname: '/prayers', state: { journalView: 'circles' } }]}>
        <PrayersTab onAdd={() => {}} onAddInCircle={vi.fn()} />
      </MemoryRouter>,
    );
    expect(byCircle().getAttribute('aria-pressed')).toBe('true');
    expect(groupTitles()[0]).toBe(t(lang, 'circle_self'));
    // The unplaced group has no circle page to open.
    expect(within(screen.getByRole('region', { name: t(lang, 'circleUnplaced') })).queryByRole('link', { name: t(lang, 'circleUnplaced') })).toBeNull();
  });

  // One circle-oriented way to find prayers: the filter sheet holds no
  // second, competing circle selector.
  it('is the only circle tool — the filters have no circle selector', () => {
    usePrayerStore.setState({ categories: [{ id: 'cat1', name: 'Famille', emoji: '' }] });
    renderJournal();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'filterLabel') }));
    const sheet = screen.getByRole('dialog', { name: t(lang, 'journalFilters') });
    expect(within(sheet).queryByText(t(lang, 'circleFieldLabel'))).toBeNull();
    for (const select of within(sheet).queryAllByRole('combobox')) {
      expect(select.textContent).not.toContain(t(lang, 'circle_household'));
    }
  });
});
