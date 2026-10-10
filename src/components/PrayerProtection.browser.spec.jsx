// Render the actual component and styles with synthetic recovery services.
// These checks cover the guided UI, not physical passkey/provider synchronization.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import '../index.css';

const services = vi.hoisted(() => ({ getProtectionStatus: vi.fn(), enrollPasskeyRecovery: vi.fn(), verifyPasskeyRecovery: vi.fn(),
  recoverWithPasskey: vi.fn(), generateEmergencyRecovery: vi.fn(), verifyEmergencyRecovery: vi.fn(),
  recoverWithEmergencyCode: vi.fn(), enableDeviceUnlock: vi.fn(), disableDeviceUnlock: vi.fn(), unlockWithDevice: vi.fn(), revokeRecoveryMethod: vi.fn() }));
vi.mock('../lib/prayerProtection', () => services);
vi.mock('../store/vaultStore', () => ({ default: Object.assign(() => ({ initialized: true, unlocked: true, recoverySync: 'synced', lock: vi.fn() }), { getState: () => ({ refresh: vi.fn() }) }) }));
vi.mock('./VaultMigrationStatus', () => ({ default: () => null }));
vi.mock('./VaultModal', () => ({ default: () => null }));
import PrayerProtection, { PrayerRecoveryChoices } from './PrayerProtection';
import { loadLocale, t } from '../i18n';
import AccountGate from './AccountGate';

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'true');
  services.getProtectionStatus.mockResolvedValue({ ok: true, methods: [], capability: { canEnroll: true, canProtectDevice: true } });
  services.generateEmergencyRecovery.mockResolvedValue({ ok: true, code: '01234-56789-ABCDE-FGHJK-MNPQR-S', method: { id: 'synthetic-backup' } });
});
afterEach(() => {
  cleanup(); vi.unstubAllEnvs(); vi.restoreAllMocks();
  document.documentElement.removeAttribute('dir'); document.documentElement.removeAttribute('lang');
  document.documentElement.removeAttribute('data-theme'); document.documentElement.style.removeProperty('font-size');
});

const showProtection = (lang) => render(<main style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}><PrayerProtection userId="synthetic-account" lang={lang} /></main>);
const checkHorizontalFit = (element, width) => {
  const bounds = element.getBoundingClientRect();
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(width);
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
};

describe('Prayer protection presentation', () => {
  it('shows a code-free recovery action for an interrupted setup on a phone', async () => {
    await page.viewport(390, 740); document.documentElement.dataset.theme = 'dark';
    services.getProtectionStatus.mockResolvedValue({ ok: true, methods: [
      { id: 'saved-passkey', type: 'passkey', status: 'pending', revision: 1, wrapper: {} },
    ] });
    services.recoverWithPasskey.mockResolvedValue({ ok: true });
    render(<AccountGate lang="fr" title={t('fr', 'keyMissingHeading')} body={t('fr', 'keyMissingBody')} reassure={t('fr', 'keyMissingReassure')} exitLabel={t('fr', 'signOut')} onExit={() => {}}>
      <PrayerRecoveryChoices userId="synthetic-account" lang="fr" />
    </AccountGate>);
    const button = await screen.findByRole('button', { name: t('fr', 'protectionPendingPasskey') });
    await document.fonts.ready;
    expect(screen.queryByRole('textbox')).toBeNull();
    checkHorizontalFit(button, 390);
    await page.screenshot({ path: '../../design-qa/prayer-protection-recovery-mobile.png', element: document.querySelector('.account-gate') || document.body });
    fireEvent.click(button);
    expect(services.recoverWithPasskey).toHaveBeenCalledWith('synthetic-account', 'saved-passkey');
  });

  it('lets a backed-up saved access enable device locking in additional settings', async () => {
    await page.viewport(390, 900); document.documentElement.dataset.theme = 'dark';
    services.getProtectionStatus.mockResolvedValue({ ok: true, deviceProtected: false,
      capability: { canEnroll: true, canProtectDevice: true },
      methods: [{ id: 'saved-passkey', type: 'passkey', status: 'active', revision: 1, wrapper: {},
        backupState: { eligible: true, backedUp: true } }],
    });
    showProtection('fr');
    await screen.findByRole('heading', { name: t('fr', 'protectionTestRecorded'), level: 3 });
    fireEvent.click(screen.getByText(t('fr', 'protectionOptions')));
    const enable = screen.getByRole('button', { name: t('fr', 'protectionDeviceEnable') });
    await document.fonts.ready;
    expect(enable.disabled).toBe(false);
    expect(screen.queryByLabelText(t('fr', 'protectionEmergency'))).toBeNull();
    checkHorizontalFit(enable, 390);
    await page.screenshot({ path: '../../design-qa/prayer-protection-device-mobile.png', element: enable.closest('.protection-card') });
  });

  it.each([
    ['fr', 1080, 800, 'dark', '100%'],
    ['fr', 390, 740, 'dark', '100%'],
    ['en', 390, 740, 'light', '100%'],
    ['de', 320, 640, 'dark', '150%'],
    ['ar', 360, 740, 'dark', '100%'],
  ])('keeps the next action and its explanation readable at %s %ix%i (%s, %s text)', async (lang, width, height, theme, textSize) => {
    await page.viewport(width, height); await loadLocale(lang);
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.theme = theme; document.documentElement.style.fontSize = textSize;
    showProtection(lang);
    const enroll = await screen.findByRole('button', { name: t(lang, 'protectionEnroll') });
    await document.fonts.ready;
    expect(enroll.disabled).toBe(false);
    checkHorizontalFit(enroll, width);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(document.querySelector('.protection-details').open).toBe(false);
    if (lang === 'fr') await page.screenshot({ path: `../../design-qa/prayer-protection-${width > 500 ? 'desktop' : 'mobile'}.png`, element: document.querySelector('main') });
    fireEvent.click(enroll);
    const dialog = await screen.findByRole('dialog', { name: t(lang, 'protectionSetupTitle') });
    const next = within(dialog).getByRole('button', { name: t(lang, 'protectionSetupContinue') });
    expect(services.enrollPasskeyRecovery).not.toHaveBeenCalled();
    checkHorizontalFit(dialog, width);
    const bounds = dialog.getBoundingClientRect();
    expect(bounds.top).toBeGreaterThanOrEqual(0); expect(bounds.bottom).toBeLessThanOrEqual(height);
    expect(next.disabled).toBe(false);
    expect(next.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    if (lang === 'fr') await page.screenshot({ path: `../../design-qa/prayer-protection-guide-${width > 500 ? 'desktop' : 'mobile'}.png`, element: dialog });
  });

  it('offers an available backup when this browser cannot create saved access', async () => {
    await page.viewport(390, 740); document.documentElement.dataset.theme = 'light';
    services.getProtectionStatus.mockResolvedValue({ ok: true, methods: [], capability: { canEnroll: false, canProtectDevice: false } });
    showProtection('fr');
    const backup = await screen.findByRole('button', { name: t('fr', 'protectionAddEmergency') });
    expect(backup.disabled).toBe(false);
    expect(screen.queryByRole('button', { name: t('fr', 'protectionEnroll') })).toBeNull();
    checkHorizontalFit(backup, 390);
    fireEvent.click(backup);
    expect(await screen.findByRole('dialog', { name: t('fr', 'protectionBackupTitle') })).toBeTruthy();
  });

  it('shows a separate save step and a compact backup dialog on a phone', async () => {
    await page.viewport(390, 740); document.documentElement.dataset.theme = 'dark';
    showProtection('fr');
    fireEvent.click(await screen.findByRole('button', { name: t('fr', 'protectionPreferCode') }));
    const dialog = await screen.findByRole('dialog', { name: t('fr', 'protectionBackupTitle') });
    expect(services.generateEmergencyRecovery).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: t('fr', 'protectionAddEmergency') }));
    await within(dialog).findByText('01234-56789-ABCDE-FGHJK-MNPQR-S'); await document.fonts.ready;
    checkHorizontalFit(dialog, 390);
    const bounds = dialog.getBoundingClientRect();
    expect(bounds.top).toBeGreaterThanOrEqual(0); expect(bounds.bottom).toBeLessThanOrEqual(740);
    expect(within(dialog).queryByLabelText(t('fr', 'protectionEmergency'))).toBeNull();
    expect(within(dialog).getByRole('button', { name: t('fr', 'protectionCodeSaved') }).disabled).toBe(false);
    await page.screenshot({ path: '../../design-qa/prayer-protection-backup.png', element: dialog });
  });

  it('opens the first saved access directly and keeps other choices collapsed', async () => {
    await page.viewport(390, 740);
    services.getProtectionStatus.mockResolvedValue({ ok: true, methods: [
      { id: 'first-phone', type: 'passkey', status: 'active', revision: 1, wrapper: {}, label: 'First phone' },
      { id: 'other-phone', type: 'passkey', status: 'active', revision: 1, wrapper: {}, label: 'Other phone' },
    ] });
    services.recoverWithPasskey.mockResolvedValue({ ok: true });
    render(<PrayerRecoveryChoices userId="synthetic-account" lang="fr" />);
    const unlock = await screen.findByRole('button', { name: t('fr', 'protectionRecoverPasskey') });
    const choices = screen.getByRole('combobox', { name: t('fr', 'protectionPasskey') });
    expect(choices.closest('details').open).toBe(false);
    expect(choices.checkVisibility()).toBe(false);
    expect(document.querySelector('.protection-details').open).toBe(false);
    fireEvent.click(unlock);
    expect(services.recoverWithPasskey).toHaveBeenCalledWith('synthetic-account', 'first-phone');
  });

  it.each([1080, 390])('keeps a configured account compact with earlier unfinished methods at %ipx', async (width) => {
    await page.viewport(width, 800); document.documentElement.dataset.theme = 'dark';
    services.getProtectionStatus.mockResolvedValue({ ok: true, deviceProtected: true,
      capability: { canEnroll: true, canProtectDevice: true },
      methods: [
        { id: 'saved-access', type: 'passkey', status: 'active', revision: 1, wrapper: {}, verifiedHere: true, createdAt: '2026-10-10T10:00:00Z' },
        { id: 'saved-backup', type: 'emergency-code', status: 'active', revision: 1, wrapper: {}, createdAt: '2026-10-10T10:00:00Z' },
        { id: 'unfinished-backup-1', type: 'emergency-code', status: 'pending', revision: 1, wrapper: {} },
        { id: 'unfinished-backup-2', type: 'emergency-code', status: 'pending', revision: 1, wrapper: {} },
        { id: 'unfinished-access', type: 'passkey', status: 'pending', revision: 1, wrapper: {} },
      ],
    });
    showProtection('fr');
    await screen.findByText(t('fr', 'protectionAccessReady'));
    await document.fonts.ready;
    const mainCard = document.querySelector('.protection-card--main');
    const options = document.querySelector('.prayer-protection > .protection-details');
    expect(options.open).toBe(false);
    expect(within(mainCard).queryByRole('button', { name: t('fr', 'protectionVerifyMethod') })).toBeNull();
    expect(within(mainCard).queryByRole('textbox')).toBeNull();
    expect(document.querySelector('.protection-methods').checkVisibility()).toBe(false);
    expect(document.querySelector('.protection-card--next')).toBeNull();
    checkHorizontalFit(mainCard, width);
    await page.screenshot({ path: `../../design-qa/prayer-protection-ready-${width > 500 ? 'desktop' : 'mobile'}.png`, element: document.querySelector('main') });
  });

  it('keeps keyboard focus inside the explanation when it opens on its heading', async () => {
    await page.viewport(390, 740);
    showProtection('fr');
    fireEvent.click(await screen.findByRole('button', { name: t('fr', 'protectionEnroll') }));
    const dialog = await screen.findByRole('dialog', { name: t('fr', 'protectionSetupTitle') });
    const heading = within(dialog).getByRole('heading', { name: t('fr', 'protectionSetupTitle') });
    expect(document.activeElement).toBe(heading);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: t('fr', 'cancel') }));
    await userEvent.tab();
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: t('fr', 'protectionSetupContinue') }));
  });
});
