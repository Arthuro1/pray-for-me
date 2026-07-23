// @vitest-environment jsdom
//
// The journal card's status pill must tell the truth about a scheduled series:
// a plan that consumed all its occurrences reads "Series ended", not "Active",
// while an open-ended schedule keeps the Active pill.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PrayerListItem from '../PrayerListItem';
import { t } from '../../i18n';

const lang = 'fr';
afterEach(cleanup);

const prayer = (schedule) => ({
  id: 'p1',
  title: 'Semaine de gratitude',
  status: 'active',
  created_at: '2026-01-01T00:00:00Z',
  prayer_categories: [],
  schedule,
});

const renderItem = (schedule) => render(
  <PrayerListItem prayer={prayer(schedule)} categories={[]} lang={lang} tr={(s) => s} onClick={() => {}} />
);

describe('PrayerListItem status pill', () => {
  it('exposes the stable card hooks used by the Night-only constellation marker', () => {
    renderItem({ type: 'recurring', freq: 'daily', startDate: '2024-01-01', end: { kind: 'never' } });
    const card = screen.getByRole('button');
    expect(card.classList.contains('prayer-card')).toBe(true);
    expect(card.querySelector('.prayer-card__title')?.textContent).toBe('Semaine de gratitude');
  });

  it('shows "Series ended" once a count-capped plan is finished', () => {
    renderItem({
      type: 'recurring', freq: 'daily', startDate: '2024-01-01',
      end: { kind: 'count', count: 7 },
      plan: { id: 'gratitude-7', startDate: '2024-01-01' },
    });
    expect(screen.getByText(t(lang, 'seriesEnded'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'active2'))).toBeNull();
  });

  it('keeps the Active pill for an open-ended schedule', () => {
    renderItem({ type: 'recurring', freq: 'daily', startDate: '2024-01-01', end: { kind: 'never' } });
    expect(screen.getByText(t(lang, 'active2'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'seriesEnded'))).toBeNull();
  });
});
