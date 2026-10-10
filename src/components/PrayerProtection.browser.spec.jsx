// Render the actual component and styles with synthetic recovery services.
// This checks presentation, not physical passkey/provider synchronization.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
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

describe('Prayer protection presentation', () => {
  it('shows a code-free recovery action for an interrupted passkey setup on a phone', async () => {
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
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
    expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(390);
    await page.screenshot({ path: '../../design-qa/prayer-protection-recovery-mobile.png', element: document.querySelector('.account-gate') || document.body });
    fireEvent.click(button);
    expect(services.recoverWithPasskey).toHaveBeenCalledWith('synthetic-account', 'saved-passkey');
  });

  it('lets a backed-up passkey enable device locking without an emergency form', async () => {
    await page.viewport(390, 900); document.documentElement.dataset.theme = 'dark';
    services.getProtectionStatus.mockResolvedValue({ ok: true, deviceProtected: false,
      capability: { canEnroll: true, canProtectDevice: true },
      methods: [{ id: 'saved-passkey', type: 'passkey', status: 'active', revision: 1, wrapper: {},
        backupState: { eligible: true, backedUp: true } }],
    });
    showProtection('fr');
    await screen.findByText(t('fr', 'protectionTestRecorded'));
    fireEvent.click(screen.getByText(t('fr', 'protectionOptions')));
    const enable = screen.getByRole('button', { name: t('fr', 'protectionDeviceEnable') });
    await document.fonts.ready;
    expect(enable.disabled).toBe(false);
    expect(screen.queryByLabelText(t('fr', 'protectionEmergency'))).toBeNull();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
    await page.screenshot({ path: '../../design-qa/prayer-protection-device-mobile.png', element: enable.closest('.protection-card') });
  });

  it.each([
    ['fr', 1080, 800, 'dark', '100%'],
    ['fr', 390, 740, 'dark', '100%'],
    ['en', 390, 740, 'light', '100%'],
    ['de', 320, 640, 'dark', '150%'],
    ['ar', 360, 740, 'dark', '100%'],
  ])('keeps passkey setup readable at %s %ix%i (%s, %s text)', async (lang, width, height, theme, textSize) => {
    await page.viewport(width, height); await loadLocale(lang);
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.theme = theme; document.documentElement.style.fontSize = textSize;
    showProtection(lang);
    const enroll = await screen.findByRole('button', { name: t(lang, 'protectionEnroll') });
    await document.fonts.ready;
    expect(enroll.disabled).toBe(false);
    expect(enroll.getBoundingClientRect().width).toBeLessThanOrEqual(width - 48);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(document.querySelector('.protection-details').open).toBe(false);
    if (lang === 'fr') await page.screenshot({ path: `../../design-qa/prayer-protection-${width > 500 ? 'desktop' : 'mobile'}.png`, element: document.querySelector('main') });
  });

  it('shows a separate save step and a compact backup dialog on a phone', async () => {
    await page.viewport(390, 740); document.documentElement.dataset.theme = 'dark';
    showProtection('fr');
    await screen.findByRole('button', { name: t('fr', 'protectionEnroll') });
    fireEvent.click(screen.getByText(t('fr', 'protectionOptions')));
    fireEvent.click(screen.getByRole('button', { name: t('fr', 'protectionAddEmergency') }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: t('fr', 'protectionAddEmergency') }));
    await within(dialog).findByText('01234-56789-ABCDE-FGHJK-MNPQR-S'); await document.fonts.ready;
    const bounds = dialog.getBoundingClientRect();
    expect(bounds.left).toBeGreaterThanOrEqual(0); expect(bounds.right).toBeLessThanOrEqual(390);
    expect(bounds.top).toBeGreaterThanOrEqual(0); expect(bounds.bottom).toBeLessThanOrEqual(740);
    expect(within(dialog).queryByLabelText(t('fr', 'protectionEmergency'))).toBeNull();
    expect(within(dialog).getByRole('button', { name: t('fr', 'protectionCodeSaved') }).disabled).toBe(true);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
    await page.screenshot({ path: '../../design-qa/prayer-protection-backup.png', element: dialog });
  });
});
