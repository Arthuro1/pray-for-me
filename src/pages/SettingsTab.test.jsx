// @vitest-environment jsdom
//
// Settings is grouped into five collapsible, labelled sections (Account & privacy,
// Notifications, Appearance & language, Data & advanced, Support & feedback).
// This verifies the restructure: every section header renders, the account
// "danger zone" deletion still lives at the bottom of Account & privacy, and a
// /settings#<section> deep-link expands that section. Only French is loaded in
// unit tests, so t() resolves to French strings.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

// Heavy children / side-effecting modules are stubbed — this test is about the
// section scaffolding, not each card's internals.
vi.mock('../push', () => ({
  enablePush: vi.fn(async () => ({})),
  updatePushPrefs: vi.fn(async () => ({})),
  getFollowUpLastSent: vi.fn(async () => null),
}));
vi.mock('../lib/analytics', () => ({ track: vi.fn(), EVENTS: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock('../components/NotificationPreferences', () => ({ default: () => null }));
vi.mock('../components/VaultMigrationStatus', () => ({ default: () => null }));
vi.mock('../components/shared/AiDisclaimer', () => ({ default: () => null }));
vi.mock('../components/FeedbackModal', () => ({ default: () => null }));
vi.mock('../components/DonateModal', () => ({ default: () => null }));
vi.mock('../components/PrivacyCenter', () => ({ default: () => null }));
vi.mock('../components/VaultModal', () => ({ default: () => null }));

import SettingsTab from './SettingsTab';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useVaultStore from '../store/vaultStore';
import { t } from '../i18n';

const lang = 'fr';
afterEach(cleanup);

beforeEach(() => {
  window.location.hash = '';
  usePrayerStore.setState({
    settings: {
      language: lang, theme: 'light',
      dailyReminderEnabled: false, followUpEnabled: false,
      dailyReminderTime: '08:00', followUpDays: 7, followUpTime: '07:00',
      notificationsGranted: false, aiConsentPrayer: false, aiConsentHome: false,
    },
    prayers: [], categories: [],
  });
  useAuthStore.setState({
    user: { email: 'test@example.com', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: new Date().toISOString() },
  });
  useVaultStore.setState({ initialized: false, unlocked: false });
});

describe('SettingsTab — grouped sections', () => {
  it('renders all five section headers', () => {
    render(<SettingsTab />);
    for (const key of ['settingsSecAccount', 'notifications', 'settingsSecAppearance', 'settingsSecData', 'settingsSecSupport']) {
      expect(screen.getAllByText(t(lang, key)).length).toBeGreaterThan(0);
    }
  });

  it('keeps account deletion in a danger zone at the bottom of Account & privacy', () => {
    render(<SettingsTab />);
    const account = document.getElementById('account');
    expect(account).toBeTruthy();
    expect(account.textContent).toContain(t(lang, 'dangerZone'));
    expect(account.textContent).toContain(t(lang, 'deleteAccount'));
  });

  it('relabels the reminders card so it does not duplicate the section title', () => {
    render(<SettingsTab />);
    expect(screen.getByText(t(lang, 'remindersTitle'))).toBeTruthy();
  });

  it('starts EVERY section collapsed — Settings reads as a short list of destinations', () => {
    render(<SettingsTab />);
    // Panels are present in the DOM; collapsed ones carry the `hidden` attribute.
    for (const id of ['account-panel', 'notifications-panel', 'appearance-panel', 'data-panel', 'support-panel']) {
      expect(document.getElementById(id).hidden, `${id} should start collapsed`).toBe(true);
    }
  });

  it('expands the section named by a /settings#<id> deep-link', () => {
    window.location.hash = '#data';
    render(<SettingsTab />);
    expect(document.getElementById('data-panel').hidden).toBe(false);
  });
});
