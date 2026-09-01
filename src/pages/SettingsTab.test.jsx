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
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
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
vi.mock('../components/VaultMigrationStatus', () => ({ default: () => null }));
vi.mock('../components/shared/AiDisclaimer', () => ({ default: () => null }));
vi.mock('../components/FeedbackModal', () => ({ default: () => null }));
vi.mock('../components/DonateModal', () => ({ default: () => null }));
vi.mock('../components/PrivacyCenter', () => ({ default: () => null }));
vi.mock('../components/VaultModal', () => ({ default: () => null }));

import SettingsTab from './SettingsTab';
import ConfirmHost from '../components/shared/ConfirmHost';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useVaultStore from '../store/vaultStore';
import useConfirmStore from '../store/confirmStore';
import { t } from '../i18n';

const lang = 'fr';
const renderSettings = () => render(<MemoryRouter><SettingsTab /><ConfirmHost /></MemoryRouter>);
const originalVaultLock = useVaultStore.getState().lock;
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
  useVaultStore.setState({ initialized: false, unlocked: false, lock: originalVaultLock });
});

describe('SettingsTab — grouped sections', () => {
  it('renders all five section headers (reminders titled "Prayer reminders")', () => {
    renderSettings();
    for (const key of ['settingsSecAccount', 'privacySecurity', 'prayerReminders', 'settingsSecAppearance', 'settingsSecSupport']) {
      expect(screen.getAllByText(t(lang, key)).length).toBeGreaterThan(0);
    }
  });

  it('consolidates privacy: vault, previews, low data, export and deletion in Privacy & Security', () => {
    renderSettings();
    const privacy = document.getElementById('privacy');
    expect(privacy).toBeTruthy();
    for (const key of ['privacyCenterTitle', 'vaultTitle', 'notifPreviewTitle', 'lowDataTitle', 'exportData', 'dangerZone', 'deleteAccount']) {
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
    for (const id of ['account-panel', 'privacy-panel', 'notifications-panel', 'appearance-panel', 'support-panel']) {
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

  it('offers only Light and Dark in Appearance', () => {
    window.location.hash = '#appearance';
    renderSettings();
    expect(screen.getByRole('button', { name: t(lang, 'themeLight') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t(lang, 'themeDark') })).toBeTruthy();
    expect(screen.queryByRole('button', { name: t(lang, 'themeNight') })).toBeNull();
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
    for (const key of ['privacyRowOverview', 'privacyRowVault', 'privacyRowNotif', 'privacyRowLowData', 'privacyRowAi', 'privacyRowExport']) {
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

  it('locks the signed-in account through the vault button', async () => {
    const lockVault = vi.fn(async () => true);
    useVaultStore.setState({ initialized: true, unlocked: true, lock: lockVault });
    window.location.hash = '#privacy';
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'privacyRowVault') }));

    fireEvent.click(screen.getByRole('button', { name: t(lang, 'vaultLockNow') }));

    await waitFor(() => expect(lockVault).toHaveBeenCalledWith('user-1'));
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
