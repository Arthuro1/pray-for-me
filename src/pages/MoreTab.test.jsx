// @vitest-environment jsdom
//
// More is a short overflow menu, not a second navigation system. Guidance owns
// guides + journeys, Calendar owns schedule browsing, and Settings & help owns
// account, reminders, privacy, export and support.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }));

import MoreTab from './MoreTab';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';

const lang = 'fr';

afterEach(cleanup);
beforeEach(() => {
  navigate.mockClear();
  usePrayerStore.setState({ settings: { language: lang } });
});

const renderMore = () => render(<MemoryRouter><MoreTab /></MemoryRouter>);

const ROWS = [
  ['guidance', 'moreGuidanceDesc', '/guidance'],
  ['calendar', 'moreCalendarDesc', '/calendar'],
  ['settingsAndHelp', 'moreSettingsHelpDesc', '/settings'],
];

describe('MoreTab', () => {
  it('describes every destination in the reader’s language', () => {
    renderMore();
    for (const [label, description] of ROWS) {
      expect(screen.getByText(t(lang, label))).toBeTruthy();
      const text = t(lang, description);
      expect(text).toBeTruthy();
      // Localized, never an English fallback left behind.
      expect(screen.getByText(text)).toBeTruthy();
    }
  });

  it('reads each row as one control: label first, then what is behind it', () => {
    renderMore();
    for (const [label, description] of ROWS) {
      expect(screen.getByRole('button', {
        name: `${t(lang, label)} — ${t(lang, description)}`,
      })).toBeTruthy();
    }
  });

  it('navigates to the three consolidated destinations', () => {
    renderMore();
    for (const [label, description, to] of ROWS) {
      fireEvent.click(screen.getByRole('button', {
        name: `${t(lang, label)} — ${t(lang, description)}`,
      }));
      expect(navigate).toHaveBeenCalledWith(to);
    }
    expect(navigate).toHaveBeenCalledTimes(ROWS.length);
  });

  it('keeps the overflow intentionally limited to three destinations', () => {
    renderMore();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.queryByText(t(lang, 'privacySecurity'))).toBeNull();
    expect(screen.queryByText(t(lang, 'settingsSecSupport'))).toBeNull();
  });
});
