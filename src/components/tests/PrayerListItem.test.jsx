// @vitest-environment jsdom
//
// A Journal row must tell the truth about a scheduled series: a plan that
// consumed all its occurrences reads "Series ended", while an open-ended
// schedule reads as its rhythm. Active is the default state and carries no pill.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PrayerListItem from '../PrayerListItem';
import { t } from '../../i18n';
import { scheduleSummary } from '../../lib/scheduleDraft';

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

describe('PrayerListItem — Journal row status', () => {
  it('is an editorial row titled by the prayer, with no card around it', () => {
    renderItem({ type: 'recurring', freq: 'daily', startDate: '2024-01-01', end: { kind: 'never' } });
    const row = screen.getByRole('button');
    expect(row.classList.contains('prayer-row')).toBe(true);
    expect(row.classList.contains('prayer-card')).toBe(false);
    expect(row.querySelector('.journal-row__title')?.textContent).toBe('Semaine de gratitude');
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

  it('reads an open-ended schedule as its rhythm, never as ended', () => {
    const schedule = { type: 'recurring', freq: 'daily', startDate: '2024-01-01', end: { kind: 'never' } };
    renderItem(schedule);
    expect(screen.getByText(scheduleSummary(schedule, lang))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'seriesEnded'))).toBeNull();
  });
});
