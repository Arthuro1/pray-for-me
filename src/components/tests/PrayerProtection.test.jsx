// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const services = vi.hoisted(() => ({
  getProtectionStatus: vi.fn(), enrollPasskeyRecovery: vi.fn(), verifyPasskeyRecovery: vi.fn(), recoverWithPasskey: vi.fn(),
  generateEmergencyRecovery: vi.fn(), verifyEmergencyRecovery: vi.fn(), recoverWithEmergencyCode: vi.fn(),
  enableDeviceUnlock: vi.fn(), disableDeviceUnlock: vi.fn(), unlockWithDevice: vi.fn(), revokeRecoveryMethod: vi.fn(),
}));
vi.mock('../../lib/prayerProtection', () => services);
const vault = vi.hoisted(() => ({ initialized: false, unlocked: true, recoverySync: 'confirmed', lock: vi.fn(), refresh: vi.fn() }));
const writeClipboard = vi.hoisted(() => vi.fn());
vi.mock('../../store/vaultStore', () => ({ default: Object.assign(() => vault, { getState: () => vault }) }));
vi.mock('../VaultMigrationStatus', () => ({ default: () => null }));
vi.mock('../VaultModal', () => ({ default: ({ initialMode, onUnlocked }) => <div role="dialog">Legacy {initialMode}<button onClick={onUnlocked}>Complete legacy recovery</button></div> }));
import PrayerProtection, { PrayerRecoveryChoices } from '../PrayerProtection';
import { t } from '../../i18n';
import { Modal } from '../shared/Primitives';

const userId = 'synthetic-account';
const lang = 'fr';
const passkey = { id: 'passkey', type: 'passkey', status: 'active', label: 'Saved passkey', revision: 1, wrapper: {} };
const emergency = { id: 'emergency', type: 'emergency-code', status: 'active', label: 'Saved emergency code', revision: 1, wrapper: {} };
const savedCode = '00000-11111-22222-33333-44444-5';
let health;

function openDetails(key) {
  const summary = screen.getByText(t(lang, key), { exact: false });
  fireEvent.click(summary);
  // Reflect the native toggle explicitly for jsdom versions without its default action.
  summary.closest('details').open = true;
}

async function openBackupDialog() {
  await screen.findByText(t(lang, 'protectionNeedsSetup'));
  openDetails('protectionOptions');
  fireEvent.click(screen.getByRole('button', { name: t(lang, 'protectionAddEmergency') }));
  return screen.getByRole('dialog', { name: t(lang, 'protectionEmergency') });
}

async function saveAndContinue(dialog) {
  fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'vaultCopyCode') }));
  const next = within(dialog).getByRole('button', { name: t(lang, 'protectionCodeSaved') });
  await waitFor(() => expect(next.disabled).toBe(false));
  fireEvent.click(next);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'true');
  vault.initialized = false; vault.unlocked = true; vault.recoverySync = 'confirmed';
  health = { ok: true, methods: [], deviceProtected: false, capability: { canEnroll: true, canProtectDevice: true } };
  services.getProtectionStatus.mockImplementation(async () => health);
  writeClipboard.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: writeClipboard } });
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

describe('prayer protection readiness', () => {
  it('keeps pending and unsupported registration untested', async () => {
    health.methods = [{ ...passkey, status: 'pending' }];
    health.capability.canEnroll = false;
    render(<PrayerProtection userId={userId} lang={lang} />);
    await screen.findByText(t(lang, 'protectionNeedsSetup'));
    const main = screen.getByText(t(lang, 'protectionRecovery')).closest('.protection-card');
    expect(within(main).getByRole('button', { name: t(lang, 'protectionVerifyMethod') }).disabled).toBe(true);
    expect(screen.queryByText(t(lang, 'protectionTestedHere'))).toBeNull();
    expect(screen.queryByRole('button', { name: t(lang, 'protectionEnroll') })).toBeNull();
    expect(screen.getByText(t(lang, 'protectionUnsupported'))).toBeTruthy();
    openDetails('protectionOptions'); openDetails('protectionManageMethods');
    expect(screen.getByText(t(lang, 'protectionNeedsVerification'))).toBeTruthy();
  });

  it('keeps enrolled recovery available after enrollment flags are disabled', async () => {
    vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'false');
    health.methods = [passkey];
    services.recoverWithPasskey.mockResolvedValue({ ok: false, status: 'cancelled' });
    render(<PrayerRecoveryChoices userId={userId} lang={lang} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Saved passkey' }));
    expect(await screen.findByText(t(lang, 'protectionCancelled'))).toBeTruthy();
    expect(services.recoverWithPasskey).toHaveBeenCalledWith(userId, 'passkey');
  });

  it('distinguishes a server-recorded recovery check from a test completed in this session', async () => {
    health.methods = [passkey];
    const view = render(<PrayerProtection userId={userId} lang={lang} />);
    await screen.findByText(t(lang, 'protectionTestRecorded'));
    openDetails('protectionOptions'); openDetails('protectionManageMethods');
    expect(screen.getByRole('button', { name: `${t(lang, 'protectionRemove')}: Saved passkey` })).toBeTruthy();
    expect(screen.queryByText(t(lang, 'protectionTestedHere'))).toBeNull();
    expect(screen.getAllByText(t(lang, 'protectionTestRecorded'))).toHaveLength(1);
    view.unmount();
    health.methods = [{ ...passkey, verifiedHere: true }];
    render(<PrayerProtection userId={userId} lang={lang} />);
    expect(await screen.findAllByText(t(lang, 'protectionTestedHere'))).toHaveLength(1);
  });

  it('shows the one-time code and requires an independent check before finishing', async () => {
    const code = 'SYNTHETIC-CODE';
    services.generateEmergencyRecovery.mockResolvedValue({ ok: true, code, method: { id: 'new-method' } });
    services.verifyEmergencyRecovery.mockResolvedValue({ ok: false, status: 'wrong_code' });
    render(<PrayerProtection userId={userId} lang={lang} />);
    const dialog = await openBackupDialog();
    expect(services.generateEmergencyRecovery).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'protectionAddEmergency') }));
    expect(await within(dialog).findByText(code)).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: t(lang, 'protectionCodeSaved') }).disabled).toBe(true);
    expect(within(dialog).queryByLabelText(t(lang, 'protectionEmergency'))).toBeNull();
    await saveAndContinue(dialog);
    expect(writeClipboard).toHaveBeenCalledWith(code);
    expect(within(dialog).queryByText(code)).toBeNull();
    expect(within(dialog).getByRole('button', { name: t(lang, 'protectionVerifyCode') }).disabled).toBe(true);
    expect(within(dialog).getByLabelText(t(lang, 'protectionEmergency')).value).toBe('');
    fireEvent.change(within(dialog).getByLabelText(t(lang, 'protectionEmergency')), { target: { value: 'wrong-code' } });
    fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'protectionVerifyCode') }));
    expect(await within(dialog).findByText(t(lang, 'protectionWrongRecovery'))).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(services.verifyEmergencyRecovery).toHaveBeenCalledWith(userId, 'new-method', 'wrong-code');
  });

  it('passes the chosen independent emergency method when enabling device protection', async () => {
    health.methods = [passkey, { ...passkey, id: 'second-passkey', label: 'Second passkey' }, emergency];
    services.enableDeviceUnlock.mockResolvedValue({ ok: false, status: 'verification_required' });
    render(<PrayerProtection userId={userId} lang={lang} />);
    await screen.findByText(t(lang, 'protectionTestRecorded'));
    openDetails('protectionOptions');
    fireEvent.change(screen.getByRole('combobox', { name: t(lang, 'protectionPasskey') }), { target: { value: 'second-passkey' } });
    fireEvent.change(screen.getByPlaceholderText(t(lang, 'protectionEmergency')), { target: { value: 'stored-code' } });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'protectionDeviceEnable') }));
    await waitFor(() => expect(services.enableDeviceUnlock).toHaveBeenCalledWith(userId, 'second-passkey', { emergencyCode: 'stored-code', emergencyMethodId: 'emergency' }));
    expect(screen.queryByText(t(lang, 'protectionDeviceOn'))).toBeNull();
  });

  it('keeps the one-time code dialog open during generation and confines Escape to the nested dialog', async () => {
    let finishGeneration;
    services.generateEmergencyRecovery.mockImplementation(() => new Promise((resolve) => { finishGeneration = resolve; }));
    const closeParent = vi.fn();
    render(<Modal label="Recovery setup" onClose={closeParent}><PrayerProtection userId={userId} lang={lang} /></Modal>);
    const dialog = await openBackupDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'protectionAddEmergency') }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(closeParent).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: t(lang, 'protectionEmergency') })).toBeTruthy();
    finishGeneration({ ok: true, code: 'SYNTHETIC-CODE', method: { id: 'new-method' } });
    await within(dialog).findByText('SYNTHETIC-CODE');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: t(lang, 'protectionEmergency') })).toBeNull();
    expect(closeParent).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(closeParent).toHaveBeenCalledOnce();
  });

  it('keeps passkey recovery available while explaining unsupported device protection', async () => {
    health.methods = [passkey];
    health.capability.canProtectDevice = false;
    render(<PrayerProtection userId={userId} lang={lang} />);
    await screen.findByText(t(lang, 'protectionTestRecorded'));
    openDetails('protectionOptions');
    expect(screen.getByText(t(lang, 'protectionDeviceUnsupported'))).toBeTruthy();
    openDetails('protectionManageMethods');
    expect(screen.getByRole('button', { name: t(lang, 'protectionEnroll') }).disabled).toBe(false);
    expect(screen.getByRole('button', { name: t(lang, 'protectionDeviceEnable') }).disabled).toBe(true);
  });

  it('lets the person select an older emergency method without overwriting another', async () => {
    health.methods = [passkey, emergency, { ...emergency, id: 'older', label: 'Older emergency code' }];
    services.recoverWithEmergencyCode.mockResolvedValue({ ok: false, status: 'wrong_code' });
    render(<PrayerRecoveryChoices userId={userId} lang={lang} />);
    await screen.findByRole('button', { name: 'Saved passkey' });
    expect(screen.getByRole('button', { name: t(lang, 'protectionRecoverCode') }).closest('details').open).toBe(false);
    openDetails('protectionMoreRecovery');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'older' } });
    fireEvent.change(screen.getByPlaceholderText(t(lang, 'protectionEmergency')), { target: { value: 'older-code' } });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'protectionRecoverCode') }));
    await waitFor(() => expect(services.recoverWithEmergencyCode).toHaveBeenCalledWith(userId, 'older', 'older-code'));
  });

  it('makes passkey enrollment the main action without asking for an emergency code', async () => {
    const onReady = vi.fn();
    services.enrollPasskeyRecovery.mockImplementation(async () => {
      health = { ...health, methods: [{ ...passkey, verifiedHere: true }] };
      return { ok: true };
    });
    render(<PrayerProtection userId={userId} lang={lang} onReady={onReady} />);
    const enroll = await screen.findByRole('button', { name: t(lang, 'protectionEnroll') });
    await waitFor(() => expect(enroll.disabled).toBe(false));
    expect(screen.getByRole('button', { name: t(lang, 'protectionAddEmergency') }).closest('details').open).toBe(false);
    expect(screen.queryByLabelText(t(lang, 'protectionEmergency'))).toBeNull();
    fireEvent.click(enroll);
    await waitFor(() => expect(onReady).toHaveBeenCalledOnce());
    expect(services.enrollPasskeyRecovery).toHaveBeenCalledWith(userId);
    expect(services.generateEmergencyRecovery).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await screen.findByText(t(lang, 'protectionTestedHere'))).toBeTruthy();
  });

  it('resumes a pending backup check without replacing the saved recovery method', async () => {
    health.methods = [{ ...emergency, status: 'pending' }];
    const onReady = vi.fn();
    services.verifyEmergencyRecovery.mockImplementation(async () => {
      health = { ...health, methods: [{ ...emergency, verifiedHere: true }] };
      return { ok: true };
    });
    render(<PrayerProtection userId={userId} lang={lang} onReady={onReady} />);
    await screen.findByText(t(lang, 'protectionNeedsSetup'));
    openDetails('protectionOptions'); openDetails('protectionManageMethods');
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'protectionVerifyMethod') }));
    const dialog = screen.getByRole('dialog', { name: t(lang, 'protectionEmergency') });
    expect(within(dialog).getByText(t(lang, 'protectionCheckStep'))).toBeTruthy();
    expect(services.generateEmergencyRecovery).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText(t(lang, 'protectionUploadCode')), {
      target: { files: [new File([`QETORET-RECOVERY-V1\n${savedCode}\n\nSaved locally.`], 'backup.txt', { type: 'text/plain' })] },
    });
    await waitFor(() => expect(within(dialog).getByLabelText(t(lang, 'protectionEmergency')).value).toBe(savedCode));
    fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'protectionVerifyCode') }));
    await waitFor(() => expect(onReady).toHaveBeenCalledOnce());
    expect(services.verifyEmergencyRecovery).toHaveBeenCalledWith(userId, 'emergency', savedCode);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('resumes a pending passkey instead of enrolling a duplicate', async () => {
    health.methods = [{ ...passkey, status: 'pending' }];
    services.verifyPasskeyRecovery.mockImplementation(async () => {
      health = { ...health, methods: [passkey] };
      return { ok: true };
    });
    const onReady = vi.fn();
    render(<PrayerProtection userId={userId} lang={lang} onReady={onReady} />);
    await screen.findByText(t(lang, 'protectionNeedsSetup'));
    const main = screen.getByText(t(lang, 'protectionRecovery')).closest('.protection-card');
    fireEvent.click(within(main).getByRole('button', { name: t(lang, 'protectionVerifyMethod') }));
    await waitFor(() => expect(onReady).toHaveBeenCalledOnce());
    expect(services.verifyPasskeyRecovery).toHaveBeenCalledWith(userId, 'passkey');
    expect(services.enrollPasskeyRecovery).not.toHaveBeenCalled();
  });

  it('opens a saved backup file for recovery without asking the person to type its code', async () => {
    health.methods = [emergency];
    services.recoverWithEmergencyCode.mockResolvedValue({ ok: true });
    const onRecovered = vi.fn();
    render(<PrayerRecoveryChoices userId={userId} lang={lang} onRecovered={onRecovered} />);
    fireEvent.change(await screen.findByLabelText(t(lang, 'protectionUploadCode')), {
      target: { files: [new File([`QETORET-RECOVERY-V1\n${savedCode}\n\nSaved locally.`], 'backup.txt', { type: 'text/plain' })] },
    });
    await waitFor(() => expect(screen.getByLabelText(t(lang, 'protectionEmergency')).value).toBe(savedCode));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'protectionRecoverCode') }));
    await waitFor(() => expect(onRecovered).toHaveBeenCalledOnce());
    expect(services.recoverWithEmergencyCode).toHaveBeenCalledWith(userId, 'emergency', savedCode);
    expect(screen.getByLabelText(t(lang, 'protectionEmergency')).value).toBe('');
    expect(vault.refresh).toHaveBeenCalled();
  });

  it('offers fresh enrollment for an abandoned registration without a saved encrypted wrapper', async () => {
    health.methods = [{ ...passkey, status: 'pending', revision: 0, wrapper: null }];
    render(<PrayerProtection userId={userId} lang={lang} />);
    await screen.findByText(t(lang, 'protectionNeedsSetup'));
    const main = screen.getByText(t(lang, 'protectionRecovery')).closest('.protection-card');
    expect(within(main).getByRole('button', { name: t(lang, 'protectionEnroll') }).disabled).toBe(false);
    expect(screen.queryByRole('button', { name: t(lang, 'protectionVerifyMethod') })).toBeNull();
  });

  it('keeps unavailable health distinct from unconfigured recovery', async () => {
    health = { ok: false, status: 'unavailable', methods: [], capability: { canEnroll: true } };
    render(<PrayerProtection userId={userId} lang={lang} />);
    expect(await screen.findByText(t(lang, 'protectionUnavailable'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'protectionNeedsSetup'))).toBeNull();
    expect(screen.getByRole('button', { name: t(lang, 'protectionEnroll') }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: t(lang, 'protectionRetry') })).toBeTruthy();
  });

  it('rejects a stale recovery-health response after switching accounts', async () => {
    let finishOldHealth;
    services.getProtectionStatus.mockImplementation((account) => account === userId
      ? new Promise((resolve) => { finishOldHealth = resolve; })
      : Promise.resolve({ ...health, methods: [] }));
    const view = render(<PrayerProtection userId={userId} lang={lang} />);
    view.rerender(<PrayerProtection userId="other-account" lang={lang} />);
    await screen.findByText(t(lang, 'protectionNeedsSetup'));
    finishOldHealth({ ...health, methods: [{ ...passkey, verifiedHere: true }] });
    await waitFor(() => expect(screen.getByText(t(lang, 'protectionNeedsSetup'))).toBeTruthy());
    expect(screen.queryByText(t(lang, 'protectionTestedHere'))).toBeNull();
    expect(screen.queryByText('Saved passkey')).toBeNull();
  });

  it('does not report successful recovery when retrying an unavailable status', async () => {
    health = { ok: false, status: 'offline', methods: [], capability: { canEnroll: true } };
    const onReady = vi.fn();
    render(<PrayerProtection userId={userId} lang={lang} onReady={onReady} />);
    await screen.findByText(t(lang, 'protectionUnavailable'));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'protectionRetry') }));
    await waitFor(() => expect(services.getProtectionStatus).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(t(lang, 'protectionRecoveryReady'))).toBeNull();
    expect(screen.queryByText(t(lang, 'protectionReady'))).toBeNull();
    expect(onReady).not.toHaveBeenCalled();
  });

  it('keeps fallback setup available when enrollment is disabled and only abandoned methods exist', async () => {
    vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'false');
    health.methods = [{ ...passkey, status: 'pending', revision: 0, wrapper: null }];
    render(<PrayerProtection userId={userId} lang={lang} />);
    expect(await screen.findByRole('button', { name: t(lang, 'backupKeyCta') })).toBeTruthy();
    expect(screen.queryByRole('button', { name: t(lang, 'protectionEnroll') })).toBeNull();
  });

  it.each(['pending', 'synced'])('finishes legacy setup only with confirmed server recovery (%s)', async (sync) => {
    vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'false');
    const onReady = vi.fn();
    render(<PrayerProtection userId={userId} lang={lang} onReady={onReady} />);
    fireEvent.click(await screen.findByRole('button', { name: t(lang, 'backupKeyCta') }));
    vault.initialized = true; vault.recoverySync = sync;
    fireEvent.click(screen.getByRole('button', { name: 'Complete legacy recovery' }));
    expect(onReady).toHaveBeenCalledTimes(sync === 'synced' ? 1 : 0);
  });

  it('resets busy state and ignores the old enrollment result after an account switch', async () => {
    let finishEnrollment;
    services.enrollPasskeyRecovery.mockImplementation(() => new Promise((resolve) => { finishEnrollment = resolve; }));
    const onReady = vi.fn();
    const view = render(<PrayerProtection userId={userId} lang={lang} onReady={onReady} />);
    const enroll = await screen.findByRole('button', { name: t(lang, 'protectionEnroll') });
    await waitFor(() => expect(enroll.disabled).toBe(false));
    fireEvent.click(enroll);
    expect(enroll.disabled).toBe(true);
    view.rerender(<PrayerProtection userId="new-account" lang={lang} onReady={onReady} />);
    await waitFor(() => expect(screen.getByRole('button', { name: t(lang, 'protectionEnroll') }).disabled).toBe(false));
    finishEnrollment({ ok: true });
    await waitFor(() => expect(screen.getByText(t(lang, 'protectionNeedsSetup'))).toBeTruthy());
    expect(onReady).not.toHaveBeenCalled();
  });

  it('acknowledges existing confirmed recovery instead of claiming it is unconfigured', async () => {
    vault.initialized = true; vault.recoverySync = 'synced';
    render(<PrayerProtection userId={userId} lang={lang} />);
    expect(await screen.findByText(t(lang, 'protectionLegacyReady'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'protectionNeedsSetup'))).toBeNull();
    expect(screen.getByRole('button', { name: t(lang, 'protectionEnroll') })).toBeTruthy();
  });
});
