// @vitest-environment jsdom
//
// Settings opens on the profile card — who you are, how you signed in and the
// way out — then four collapsible, labelled sections (Privacy & Security,
// Notifications, Appearance & language, Support & feedback).
// Privacy & Security is the ONE consolidated destination: Privacy Center, protection,
// notification previews, low data mode, AI consent, export and account deletion
// all live there. This verifies the structure, that deletion sits in the privacy
// danger zone, and that /settings#<section> deep-links (including the legacy
// #data alias) expand their section. Only French is loaded in unit tests, so
// t() resolves to French strings.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Heavy children / side-effecting modules are stubbed — this test is about the
// section scaffolding, not each card's internals.
vi.mock('../push', () => ({
  dailyReminderStartDay: vi.fn(() => undefined),
  enablePush: vi.fn(async () => ({})),
  updatePushPrefs: vi.fn(async () => ({})),
  getFollowUpLastSent: vi.fn(async () => null),
}));
vi.mock('../lib/analytics', () => ({ track: vi.fn(), EVENTS: new Proxy({}, { get: (_, k) => String(k) }) }));
vi.mock('../components/NotificationPreferences', () => ({ default: () => null }));
vi.mock('../components/shared/AiDisclaimer', () => ({ default: () => null }));
vi.mock('../components/FeedbackModal', () => ({ default: () => null }));
vi.mock('../components/DonateModal', () => ({ default: () => null }));
vi.mock('../components/PrivacyCenter', () => ({ default: () => null }));
vi.mock('../components/PrayerProtection', () => ({
  default: ({ userId, showTitle }) => <div data-testid="prayer-protection" data-account={userId} data-show-title={String(showTitle)}>Protection controls</div>,
}));

import SettingsTab from './SettingsTab';
import ConfirmHost from '../components/shared/ConfirmHost';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useConfirmStore from '../store/confirmStore';
import { t } from '../i18n';

const lang = 'fr';
const renderSettings = () => render(<MemoryRouter><SettingsTab /><ConfirmHost /></MemoryRouter>);
afterEach(cleanup);

beforeEach(() => {
  window.location.hash = '';
  HTMLElement.prototype.scrollIntoView = vi.fn();
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
    user: { id: 'user-1', email: 'test@example.com', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: new Date().toISOString() },
    deleteAccount: vi.fn(async () => ({ error: null })),
  });
  useConfirmStore.setState({ dialog: null });
});

describe('SettingsTab — grouped sections', () => {
  it('renders the four section headers (reminders titled "Prayer reminders")', () => {
    renderSettings();
    for (const key of ['privacySecurity', 'prayerReminders', 'settingsSecAppearance', 'settingsSecSupport']) {
      expect(screen.getAllByText(t(lang, key)).length).toBeGreaterThan(0);
    }
  });

  it('signs out from the profile card — no Account section for one button', () => {
    const signOut = vi.fn();
    useAuthStore.setState({ signOut });
    renderSettings();
    const card = document.getElementById('account');
    expect(card.textContent).toContain(t(lang, 'signedInByEmail'));
    expect(document.getElementById('account-panel')).toBeNull();
    fireEvent.click(within(card).getByRole('button', { name: t(lang, 'signOut') }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('consolidates privacy: protection, previews, low data, export and deletion in Privacy & Security', () => {
    renderSettings();
    const privacy = document.getElementById('privacy');
    expect(privacy).toBeTruthy();
    for (const key of ['privacyCenterTitle', 'protectionTitle', 'notifPreviewTitle', 'lowDataTitle', 'exportData', 'dangerZone', 'deleteAccount']) {
      expect(privacy.textContent, `privacy section should contain ${key}`).toContain(t(lang, key));
    }
  });

  it('relabels the reminders card so it does not duplicate the section title', () => {
    renderSettings();
    expect(screen.getByText(t(lang, 'remindersTitle'))).toBeTruthy();
  });

  it('starts EVERY section collapsed — Settings reads as a short list of destinations', () => {
    renderSettings();
    // Panels are present in the DOM; collapsed ones carry the `hidden` attribute.
    for (const id of ['privacy-panel', 'notifications-panel', 'appearance-panel', 'support-panel']) {
      expect(document.getElementById(id).hidden, `${id} should start collapsed`).toBe(true);
    }
  });

  it('expands the section named by a /settings#<id> deep-link', () => {
    window.location.hash = '#privacy';
    renderSettings();
    expect(document.getElementById('privacy-panel').hidden).toBe(false);
  });

  it('keeps legacy #data deep-links working via the privacy alias', () => {
    window.location.hash = '#data';
    renderSettings();
    expect(document.getElementById('privacy-panel').hidden).toBe(false);
  });

  it('offers Light, Dark and Automatic in Appearance — never the old Night', () => {
    window.location.hash = '#appearance';
    renderSettings();
    expect(screen.getByRole('button', { name: t(lang, 'themeLight') }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: t(lang, 'themeDark') })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Nuit' })).toBeNull();
    // Automatic is a stored preference of its own; the drawn theme follows the device.
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'themeSystem') }));
    expect(usePrayerStore.getState().settings.theme).toBe('system');
    expect(localStorage.getItem('pfm_theme')).toBe('system');
    expect(['light', 'dark']).toContain(document.documentElement.getAttribute('data-theme'));
  });

  it('personal prayers stay private by default: the preview choice defaults to generic', () => {
    window.location.hash = '#privacy'; // expand the section
    renderSettings();
    // The notification-privacy content sits behind its compact row.
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'privacyRowNotif') }));
    const generic = screen.getByRole('radio', { name: t(lang, 'notifPreviewGeneric') });
    expect(generic.checked).toBe(true);
  });

  it('Privacy & Security starts COMPACT: every internal row collapsed, deletion apart at the bottom', () => {
    window.location.hash = '#privacy';
    renderSettings();
    for (const key of ['privacyRowOverview', 'protectionTitle', 'privacyRowNotif', 'privacyRowLowData', 'privacyRowAi', 'privacyRowExport']) {
      const row = screen.getByRole('button', { name: t(lang, key) });
      expect(row.getAttribute('aria-expanded'), `${key} should start collapsed`).toBe('false');
      expect(row.getAttribute('aria-controls')).toBeTruthy();
    }
    // Delete account stays its own separated block, not a disclosure row.
    expect(screen.getByText(t(lang, 'dangerZone'))).toBeTruthy();
    // A row expands on demand.
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'privacyRowExport') }));
    expect(screen.getByRole('button', { name: t(lang, 'privacyRowExport') }).getAttribute('aria-expanded')).toBe('true');
  });

  it('the low-data switch exposes real switch semantics with a label and checked state', () => {
    window.location.hash = '#privacy';
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'privacyRowLowData') }));
    const sw = screen.getByRole('switch', { name: t(lang, 'lowDataTitle') });
    expect(sw.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(sw);
    expect(screen.getByRole('switch', { name: t(lang, 'lowDataTitle') }).getAttribute('aria-checked')).toBe('true');
    expect(usePrayerStore.getState().settings.lowDataMode).toBe(true);
  });

  it('offers one protection destination without a second vault panel or repeated title', () => {
    window.location.hash = '#privacy';
    renderSettings();
    const disclosure = screen.getByRole('button', { name: t(lang, 'protectionTitle') });
    expect(disclosure.getAttribute('aria-controls')).toBe('privacy-protection-body');
    expect(document.getElementById('privacy-vault-body')).toBeNull();
    expect(screen.queryByText(t(lang, 'privacyRowVault'))).toBeNull();
    fireEvent.click(disclosure);
    const protection = screen.getByTestId('prayer-protection');
    expect(document.getElementById('privacy-protection-body').hidden).toBe(false);
    expect(protection.getAttribute('data-account')).toBe('user-1');
    expect(protection.getAttribute('data-show-title')).toBe('false');
    expect(screen.getAllByText(t(lang, 'protectionTitle'))).toHaveLength(1);
  });

  it('warns before deleting and runs account erasure only after confirmation', async () => {
    const deleteAccount = vi.fn(async () => ({ error: null }));
    useAuthStore.setState({ deleteAccount });
    window.location.hash = '#privacy';
    renderSettings();

    fireEvent.click(screen.getByRole('button', { name: t(lang, 'deleteAccount') }));

    expect(deleteAccount).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog').textContent).toContain(t(lang, 'deleteAccountWarning'));

    fireEvent.click(screen.getByRole('button', { name: t(lang, 'deleteAccountConfirm') }));
    await waitFor(() => expect(deleteAccount).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
