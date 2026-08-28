// @vitest-environment jsdom
//
// The calendar is how a reader reaches a day of a guided plan that is not
// today's — a day they missed, or the next one. Selecting the day and opening
// the prayer from that day's agenda must carry the day over; opening an
// ordinary prayer must not gain a meaningless date in its URL.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }));

import DayAgenda from '../DayAgenda';
import { addDays } from '../../lib/schedule';
import { todayKey } from '../../lib/prayedLog';

const lang = 'fr';
const tr = (value) => value;

// A three-day plan that began the day before yesterday, so today is day 3 and
// day 1 is genuinely behind the reader.
const START = addDays(todayKey(), -2);
const planPrayer = {
  id: 'p1',
  title: 'Jeûne de trois jours',
  schedule: {
    type: 'recurring', freq: 'daily', startDate: START, end: { kind: 'count', count: 3 },
    plan: { id: 'fast3', startDate: START },
  },
};
const plainPrayer = {
  id: 'p2',
  title: 'Une prière ordinaire',
  schedule: { type: 'recurring', freq: 'daily', startDate: START },
};

const renderAgenda = (dayKey, prayer) => render(
  <MemoryRouter>
    <DayAgenda
      dayKey={dayKey}
      lang={lang}
      tr={tr}
      entries={[{ prayer, source: 'days' }]}
      completions={{}}
      onTogglePrayed={() => {}}
      onSkip={() => {}}
      onMove={() => {}}
      onRestore={() => {}}
      onEndSeries={() => {}}
    />
  </MemoryRouter>,
);

afterEach(() => { cleanup(); navigate.mockClear(); });

describe('DayAgenda — opening a plan day from the calendar', () => {
  it('opens the selected day of the plan, not today’s', () => {
    renderAgenda(START, planPrayer);
    fireEvent.click(screen.getByText('Jeûne de trois jours'));
    expect(navigate).toHaveBeenCalledWith(`/prayers/p1?day=${START}`);
  });

  it('carries today over the same way, so the two paths behave alike', () => {
    renderAgenda(todayKey(), planPrayer);
    fireEvent.click(screen.getByText('Jeûne de trois jours'));
    expect(navigate).toHaveBeenCalledWith(`/prayers/p1?day=${todayKey()}`);
  });

  it('names the selected day, so the reader sees which day they are opening', () => {
    renderAgenda(START, planPrayer);
    expect(screen.getByText(/Jour 1 sur 3/)).toBeTruthy();
    cleanup();
    renderAgenda(todayKey(), planPrayer);
    expect(screen.getByText(/Jour 3 sur 3/)).toBeTruthy();
  });

  it('adds no day to a prayer that is not part of a plan', () => {
    renderAgenda(START, plainPrayer);
    fireEvent.click(screen.getByText('Une prière ordinaire'));
    expect(navigate).toHaveBeenCalledWith('/prayers/p2');
  });
});
