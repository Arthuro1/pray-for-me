// @vitest-environment jsdom
//
// The Journal (Prayers) header carries a persistent entry point to the answered-
// prayer gallery — previously only reachable from the Home "Answered" stat tile.
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

describe('PrayersTab — answered gallery entry point', () => {
  it('shows an "Answered prayers" link in the header', () => {
    renderJournal();
    expect(screen.getByText(t(lang, 'answeredTitle'))).toBeTruthy();
  });

  it('navigates to /answered when clicked', () => {
    renderJournal();
    fireEvent.click(screen.getByText(t(lang, 'answeredTitle')));
    expect(navigate).toHaveBeenCalledWith('/answered');
  });
});
