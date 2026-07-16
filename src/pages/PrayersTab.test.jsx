// @vitest-environment jsdom
//
// The Journal has two simple segments — Active and Answered — and carries the
// at-a-glance stats that used to sit on Home. The answered segment IS the
// remembrance gallery (no separate page, no duplicate shortcuts).
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }));

import PrayersTab from './PrayersTab';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import { t } from '../i18n';

const lang = 'fr';
afterEach(cleanup);
beforeEach(() => {
  navigate.mockClear();
  usePrayerStore.setState({ prayers: [], categories: [], settings: { language: lang }, loading: false });
  useAuthStore.setState({ user: null });
});

const renderJournal = () =>
  render(<MemoryRouter><PrayersTab onAdd={() => {}} /></MemoryRouter>);

describe('PrayersTab — Journal segments', () => {
  it('offers exactly two segments: Active and Answered', () => {
    renderJournal();
    // "Actives"/"Exaucées" also label the stat tiles, hence getAllByText.
    expect(screen.getAllByText(t(lang, 'active')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t(lang, 'answered')).length).toBeGreaterThan(0);
    // The old three-way filter ("All") and the separate gallery shortcut are gone.
    expect(screen.queryByText(t(lang, 'all'))).toBeNull();
    expect(screen.queryByText(t(lang, 'answeredTitle'))).toBeNull();
  });

  it('shows the at-a-glance stats (moved from Home)', () => {
    const created_at = new Date().toISOString();
    usePrayerStore.setState({
      prayers: [
        { id: 'a', title: 'A', status: 'active', prayer_categories: [], created_at },
        { id: 'b', title: 'B', status: 'answered', prayer_categories: [], created_at },
      ],
    });
    renderJournal();
    // The stat labels share their French wording with the segment buttons.
    expect(screen.getAllByText(t(lang, 'activePrayers')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t(lang, 'answeredPrayers')).length).toBeGreaterThan(0);
    expect(screen.getByText(t(lang, 'thisWeek'))).toBeTruthy();
  });

  it('switching to Answered renders the remembrance gallery', () => {
    usePrayerStore.setState({
      prayers: [{
        id: 'b', title: 'Exaucée', status: 'answered', prayer_categories: [],
        answered_at: new Date().toISOString(), created_at: new Date().toISOString(),
      }],
    });
    renderJournal();
    // Both the stat tile and the segment switch to Answered; either works.
    fireEvent.click(screen.getAllByText(t(lang, 'answered'))[0]);
    expect(screen.getByText('Exaucée')).toBeTruthy();
    // Gallery affordance: the gratitude nudge for a testimony-less answer.
    expect(screen.getByText(new RegExp(t(lang, 'thanksPrompt')))).toBeTruthy();
  });
});
