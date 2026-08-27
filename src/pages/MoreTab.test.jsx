// @vitest-environment jsdom
//
// "Grow", "Plan", "Privacy & Security", "Settings" and "Support" mean little
// from outside, and two of them sound alike. Every row now says what is behind
// it in one localized line — and still goes exactly where it went before.
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
  ['grow', 'moreGrowDesc', '/grow'],
  ['plan', 'morePlanDesc', '/plan'],
  ['privacySecurity', 'morePrivacyDesc', '/settings#privacy'],
  ['settings', 'moreSettingsDesc', '/settings'],
  ['settingsSecSupport', 'moreSupportDesc', '/settings#support'],
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

  it('still navigates where it always did, hashes included', () => {
    renderMore();
    for (const [label, description, to] of ROWS) {
      fireEvent.click(screen.getByRole('button', {
        name: `${t(lang, label)} — ${t(lang, description)}`,
      }));
      expect(navigate).toHaveBeenCalledWith(to);
    }
    expect(navigate).toHaveBeenCalledTimes(ROWS.length);
  });

  it('tells Privacy & Security and Settings apart, which the labels alone do not', () => {
    renderMore();
    expect(t(lang, 'morePrivacyDesc')).not.toBe(t(lang, 'moreSettingsDesc'));
    expect(screen.getByText(t(lang, 'morePrivacyDesc'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'moreSettingsDesc'))).toBeTruthy();
  });
});
