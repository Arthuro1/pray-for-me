// @vitest-environment jsdom
//
// Settings is grouped into five collapsible, labelled sections (Account,
// Privacy & Security, Notifications, Appearance & language, Support & feedback).
// Privacy & Security is the ONE consolidated destination: Privacy Center, vault,
// notification previews, low data mode, AI consent, export and account deletion
// all live there. This verifies the structure, that deletion sits in the privacy
// danger zone, and that /settings#<section> deep-links (including the legacy
// #data alias) expand their section. Only French is loaded in unit tests, so
// t() resolves to French strings.
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
  it('renders all five section headers (reminders titled "Prayer reminders")', () => {
    render(<SettingsTab />);
    for (const key of ['settingsSecAccount', 'privacySecurity', 'prayerReminders', 'settingsSecAppearance', 'settingsSecSupport']) {
      expect(screen.getAllByText(t(lang, key)).length).toBeGreaterThan(0);
    }
  });

  it('consolidates privacy: vault, previews, low data, export and deletion in Privacy & Security', () => {
    render(<SettingsTab />);
    const privacy = document.getElementById('privacy');
    expect(privacy).toBeTruthy();
    for (const key of ['privacyCenterTitle', 'vaultTitle', 'notifPreviewTitle', 'lowDataTitle', 'exportData', 'dangerZone', 'deleteAccount']) {
      expect(privacy.textContent, `privacy section should contain ${key}`).toContain(t(lang, key));
    }
  });

  it('relabels the reminders card so it does not duplicate the section title', () => {
    render(<SettingsTab />);
    expect(screen.getByText(t(lang, 'remindersTitle'))).toBeTruthy();
  });

  it('starts EVERY section collapsed — Settings reads as a short list of destinations', () => {
    render(<SettingsTab />);
    // Panels are present in the DOM; collapsed ones carry the `hidden` attribute.
    for (const id of ['account-panel', 'privacy-panel', 'notifications-panel', 'appearance-panel', 'support-panel']) {
      expect(document.getElementById(id).hidden, `${id} should start collapsed`).toBe(true);
    }
  });

  it('expands the section named by a /settings#<id> deep-link', () => {
    window.location.hash = '#privacy';
    render(<SettingsTab />);
    expect(document.getElementById('privacy-panel').hidden).toBe(false);
  });

  it('keeps legacy #data deep-links working via the privacy alias', () => {
    window.location.hash = '#data';
    render(<SettingsTab />);
    expect(document.getElementById('privacy-panel').hidden).toBe(false);
  });

  it('personal prayers stay private by default: the preview choice defaults to generic', () => {
    window.location.hash = '#privacy'; // expand the section so the radios are visible
    render(<SettingsTab />);
    const generic = screen.getByRole('radio', { name: t(lang, 'notifPreviewGeneric') });
    expect(generic.checked).toBe(true);
  });
});
