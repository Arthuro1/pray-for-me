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
    const nextBounds = next.getBoundingClientRect();
    expect(nextBounds.left - bounds.left).toBeGreaterThanOrEqual(16);
    expect(bounds.right - nextBounds.right).toBeGreaterThanOrEqual(16);
    const close = within(dialog).getByRole('button', { name: t(lang, 'cancel') });
    checkHorizontalFit(close, width);
    expect(close.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    expect(close.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
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

  it.each([['fr', 1080], ['fr', 390], ['ar', 360]])('guides backup saving and checking at %s %ipx', async (lang, width) => {
    await page.viewport(width, 800); await loadLocale(lang);
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.theme = 'dark';
    showProtection(lang);
    fireEvent.click(await screen.findByRole('button', { name: t(lang, 'protectionPreferCode') }));
    const dialog = await screen.findByRole('dialog', { name: t(lang, 'protectionBackupTitle') });
    const captureSize = lang === 'ar' ? 'rtl' : width > 500 ? 'desktop' : 'mobile';
    await document.fonts.ready;
    await page.screenshot({ path: `../../design-qa/prayer-protection-backup-start-${captureSize}.png`, element: dialog });
    expect(services.generateEmergencyRecovery).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'protectionAddEmergency') }));
    await within(dialog).findByText('01234-56789-ABCDE-FGHJK-MNPQR-S'); await document.fonts.ready;
    checkHorizontalFit(dialog, width);
    const bounds = dialog.getBoundingClientRect();
    expect(bounds.top).toBeGreaterThanOrEqual(0); expect(bounds.bottom).toBeLessThanOrEqual(800);
    expect(within(dialog).queryByLabelText(t(lang, 'protectionEmergency'))).toBeNull();
    expect(within(dialog).getByRole('button', { name: t(lang, 'protectionCodeSaved') }).disabled).toBe(false);
    if (lang === 'fr' && width === 390) await page.screenshot({ path: '../../design-qa/prayer-protection-backup.png', element: dialog });
    fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'protectionCodeSaved') }));
    expect(within(dialog).queryByText('01234-56789-ABCDE-FGHJK-MNPQR-S')).toBeNull();
    const input = within(dialog).getByLabelText(t(lang, 'protectionEmergency'));
    checkHorizontalFit(input, width);
    expect(within(dialog).getByRole('button', { name: t(lang, 'protectionVerifyCode') }).disabled).toBe(true);
    await page.screenshot({ path: `../../design-qa/prayer-protection-backup-check-${captureSize}.png`, element: dialog });
    services.verifyEmergencyRecovery.mockImplementation(async () => {
      services.getProtectionStatus.mockResolvedValue({ ok: true, methods: [
        { id: 'synthetic-backup', type: 'emergency-code', status: 'active', revision: 1, wrapper: {} },
      ], capability: { canEnroll: true, canProtectDevice: true } });
      return { ok: true };
    });
    fireEvent.change(input, { target: { value: '01234-56789-ABCDE-FGHJK-MNPQR-S' } });
    fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'protectionVerifyCode') }));
    await within(dialog).findByRole('heading', { name: t(lang, 'protectionBackupDone') });
    expect(within(dialog).queryByLabelText(t(lang, 'protectionEmergency'))).toBeNull();
    expect(within(dialog).queryByText('01234-56789-ABCDE-FGHJK-MNPQR-S')).toBeNull();
    expect(within(dialog).getByRole('button', { name: t(lang, 'doneBtn') }).disabled).toBe(false);
    checkHorizontalFit(dialog, width);
    await page.screenshot({ path: `../../design-qa/prayer-protection-backup-done-${captureSize}.png`, element: dialog });
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

  it.each([['fr', 1080], ['fr', 390], ['ar', 360]])('keeps saved access verification compact at %s %ipx', async (lang, width) => {
    await page.viewport(width, 800); await loadLocale(lang);
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.theme = 'dark';
    services.getProtectionStatus.mockResolvedValue({ ok: true, methods: [
      { id: 'saved-access', type: 'passkey', status: 'active', revision: 1, wrapper: {} },
    ], capability: { canEnroll: true, canProtectDevice: true } });
    showProtection(lang);
    const heading = await screen.findByRole('heading', { name: t(lang, 'protectionTestRecorded') });
    const opener = within(heading.closest('.protection-card')).getByRole('button', { name: t(lang, 'protectionVerifyMethod') });
    opener.focus(); fireEvent.click(opener);
    const dialog = await screen.findByRole('dialog', { name: t(lang, 'protectionVerifyMethod') });
    await document.fonts.ready;
    checkHorizontalFit(dialog, width);
    expect(within(dialog).queryByRole('textbox')).toBeNull();
    expect(within(dialog).getByRole('button', { name: t(lang, 'protectionSetupContinue') }).disabled).toBe(false);
    const captureSize = lang === 'ar' ? 'rtl' : width > 500 ? 'desktop' : 'mobile';
    await page.screenshot({ path: `../../design-qa/prayer-protection-verify-${captureSize}.png`, element: dialog });
    fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'cancel') }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(services.verifyPasskeyRecovery).not.toHaveBeenCalled();
  });
  it.each([
    ['fr', 1080, '100%'], ['fr', 390, '100%'], ['ar', 360, '100%'], ['de', 320, '150%'], ['de', 540, '150%'],
  ])('keeps saved method actions readable with long labels at %s %ipx (%s text)', async (lang, width, textSize) => {
    await page.viewport(width, 900); await loadLocale(lang);
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.theme = 'dark'; document.documentElement.style.fontSize = textSize;
    const longLabel = `${t(lang, 'protectionEmergency')} ${t(lang, 'protectionPasskey')} ${t(lang, 'protectionEmergency')}`;
    const methods = [
      { id: 'saved-access', type: 'passkey', status: 'active', revision: 1, wrapper: {}, verifiedHere: true, label: t(lang, 'protectionPasskey') },
      { id: 'saved-backup', type: 'emergency-code', status: 'active', revision: 1, wrapper: {}, label: longLabel, createdAt: '2026-10-10T10:00:00Z' },
      { id: 'unfinished-backup', type: 'emergency-code', status: 'pending', revision: 1, wrapper: {}, label: `${longLabel} 2` },
    ];
    services.getProtectionStatus.mockResolvedValue({ ok: true, deviceProtected: true, methods,
      capability: { canEnroll: true, canProtectDevice: true } });
    showProtection(lang);
    await screen.findByText(t(lang, 'protectionAccessReady')); await document.fonts.ready;
    fireEvent.click(screen.getByText(t(lang, 'protectionOptions')));
    fireEvent.click(screen.getByText((_, element) => element.textContent.includes(t(lang, 'protectionManageMethods')), { selector: 'summary' }));
    const list = document.querySelector('.protection-methods');
    expect(list.checkVisibility()).toBe(true);
    const rows = Array.from(list.querySelectorAll('li'));
    expect(rows).toHaveLength(methods.length);
    rows.forEach((row, index) => {
      checkHorizontalFit(row, width);
      const remove = within(row).getByRole('button', { name: `${t(lang, 'protectionRemove')}: ${methods[index].label}` });
      const removeBounds = remove.getBoundingClientRect();
      expect(removeBounds.width).toBeGreaterThanOrEqual(44);
      expect(removeBounds.height).toBeGreaterThanOrEqual(44);
      expect(removeBounds.width).toBeLessThanOrEqual(56);
      checkHorizontalFit(remove, width);
      const body = row.querySelector('.protection-method__body').getBoundingClientRect();
      const actions = removeBounds;
      if (body.top < actions.bottom && actions.top < body.bottom) {
        expect(body.right <= actions.left + 1 || actions.right <= body.left + 1).toBe(true);
      }
    });
    expect(within(list).getByRole('button', { name: t(lang, 'protectionAddPasskey') }).disabled).toBe(false);
    expect(within(rows[2]).getByRole('button', { name: t(lang, 'protectionVerifyMethod') }).disabled).toBe(false);
    await page.screenshot({ path: `../../design-qa/prayer-protection-methods-${lang === 'ar' ? 'rtl' : lang === 'de' ? 'large-text-' + width : width > 500 ? 'desktop' : 'mobile'}.png`, element: list });
    if (lang === 'fr') {
      cleanup();
      services.getProtectionStatus.mockResolvedValue({ ok: true, deviceProtected: true,
        methods: methods.map((method, index) => ({ ...method, label: index === 0 ? t(lang, 'protectionPasskey') : `${t(lang, 'protectionEmergency')} ${index}` })),
        capability: { canEnroll: true, canProtectDevice: true } });
      showProtection(lang);
      await screen.findByText(t(lang, 'protectionAccessReady'));
      fireEvent.click(screen.getByText(t(lang, 'protectionOptions')));
      fireEvent.click(screen.getByText((_, element) => element.textContent.includes(t(lang, 'protectionManageMethods')), { selector: 'summary' }));
      const shortList = document.querySelector('.protection-methods');
      checkHorizontalFit(shortList, width);
      expect(shortList.querySelectorAll('li')).toHaveLength(3);
      await page.screenshot({ path: `../../design-qa/prayer-protection-methods-short-${width > 500 ? 'desktop' : 'mobile'}.png`, element: shortList });
    }
  });
  it('keeps keyboard focus inside the explanation when it opens on its heading', async () => {
    await page.viewport(390, 740);
    showProtection('fr');
    fireEvent.click(await screen.findByRole('button', { name: t('fr', 'protectionEnroll') }));
    const dialog = await screen.findByRole('dialog', { name: t('fr', 'protectionSetupTitle') });
    const heading = within(dialog).getByRole('heading', { name: t('fr', 'protectionSetupTitle') });
    expect(document.activeElement).toBe(heading);
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: t('fr', 'protectionPreferCode') }));
    await userEvent.tab();
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: t('fr', 'cancel') }));
    await userEvent.tab();
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: t('fr', 'protectionSetupContinue') }));
  });
});
