// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const services = vi.hoisted(() => ({
  getProtectionStatus: vi.fn(), enrollPasskeyRecovery: vi.fn(), recoverWithPasskey: vi.fn(),
  generateEmergencyRecovery: vi.fn(), verifyEmergencyRecovery: vi.fn(), recoverWithEmergencyCode: vi.fn(),
  enableDeviceUnlock: vi.fn(), disableDeviceUnlock: vi.fn(), unlockWithDevice: vi.fn(), revokeRecoveryMethod: vi.fn(),
}));
vi.mock('../../lib/prayerProtection', () => services);
vi.mock('../../store/vaultStore', () => ({ default: { getState: () => ({ refresh: vi.fn() }) } }));
import PrayerProtection, { PrayerRecoveryChoices } from '../PrayerProtection';
import { t } from '../../i18n';
import { Modal } from '../shared/Primitives';

const userId = 'synthetic-account';
const lang = 'fr';
const passkey = { id: 'passkey', type: 'passkey', status: 'active', label: 'Saved passkey' };
const emergency = { id: 'emergency', type: 'emergency-code', status: 'active', label: 'Saved emergency code' };
let health;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'true');
  health = { ok: true, methods: [], deviceProtected: false, capability: { canEnroll: true, canProtectDevice: true } };
  services.getProtectionStatus.mockImplementation(async () => health);
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

describe('prayer protection readiness', () => {
  it('never labels pending or unsupported registration as tested recovery', async () => {
    health.methods = [{ ...passkey, status: 'pending' }];
    health.capability.canEnroll = false;
    render(<PrayerProtection userId={userId} lang={lang} />);
    expect(await screen.findByText(t(lang, 'protectionNeedsVerification'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'protectionTestedHere'))).toBeNull();
    expect(screen.getByRole('button', { name: t(lang, 'protectionEnroll') }).disabled).toBe(true);
    expect(screen.getByText(t(lang, 'protectionUnsupported'))).toBeTruthy();
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
    await screen.findByRole('button', { name: `${t(lang, 'protectionRemove')}: Saved passkey` });
    expect(screen.queryByText(t(lang, 'protectionTestedHere'))).toBeNull();
    expect(screen.getAllByText(t(lang, 'protectionTestRecorded')).length).toBeGreaterThan(0);
    view.unmount();
    health.methods = [{ ...passkey, verifiedHere: true }];
    render(<PrayerProtection userId={userId} lang={lang} />);
    expect((await screen.findAllByText(t(lang, 'protectionTestedHere'))).length).toBeGreaterThan(0);
  });

  it('shows the one-time code and requires an independent check before finishing', async () => {
    const code = 'SYNTHETIC-CODE';
    services.generateEmergencyRecovery.mockResolvedValue({ ok: true, code, method: { id: 'new-method' } });
    services.verifyEmergencyRecovery.mockResolvedValue({ ok: false, status: 'wrong_code' });
    render(<PrayerProtection userId={userId} lang={lang} />);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'protectionAddEmergency') }));
    const dialog = await screen.findByRole('dialog');
    expect(services.generateEmergencyRecovery).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'protectionAddEmergency') }));
    expect(await within(dialog).findByText(code)).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: t(lang, 'protectionVerifyCode') }).disabled).toBe(true);
    fireEvent.change(within(dialog).getByLabelText(t(lang, 'protectionEmergency')), { target: { value: 'wrong-code' } });
    fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'protectionVerifyCode') }));
    expect(await within(dialog).findByText(t(lang, 'protectionWrongRecovery'))).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(services.verifyEmergencyRecovery).toHaveBeenCalledWith(userId, 'new-method', 'wrong-code');
  });

  it('passes the chosen independent emergency method when enabling device protection', async () => {
    health.methods = [passkey, emergency];
    services.enableDeviceUnlock.mockResolvedValue({ ok: false, status: 'verification_required' });
    render(<PrayerProtection userId={userId} lang={lang} />);
    await screen.findByRole('combobox', { name: t(lang, 'protectionPasskey') });
    fireEvent.change(screen.getByPlaceholderText(t(lang, 'protectionEmergency')), { target: { value: 'stored-code' } });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'protectionSetDevice') }));
    await waitFor(() => expect(services.enableDeviceUnlock).toHaveBeenCalledWith(userId, 'passkey', { emergencyCode: 'stored-code', emergencyMethodId: 'emergency' }));
    expect(screen.queryByText(t(lang, 'protectionDeviceOn'))).toBeNull();
  });

  it('keeps the one-time code dialog open during generation and confines Escape to the nested dialog', async () => {
    let finishGeneration;
    services.generateEmergencyRecovery.mockImplementation(() => new Promise((resolve) => { finishGeneration = resolve; }));
    const closeParent = vi.fn();
    render(<Modal label="Recovery setup" onClose={closeParent}><PrayerProtection userId={userId} lang={lang} /></Modal>);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'protectionAddEmergency') }));
    const dialog = screen.getByRole('dialog', { name: t(lang, 'protectionEmergency') });
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
    expect(await screen.findByText(t(lang, 'protectionDeviceUnsupported'))).toBeTruthy();
    expect(screen.getByRole('button', { name: t(lang, 'protectionEnroll') }).disabled).toBe(false);
    expect(screen.getByRole('button', { name: t(lang, 'protectionSetDevice') }).disabled).toBe(true);
  });

  it('lets the person select an older emergency method without overwriting another', async () => {
    health.methods = [emergency, { ...emergency, id: 'older', label: 'Older emergency code' }];
    services.recoverWithEmergencyCode.mockResolvedValue({ ok: false, status: 'wrong_code' });
    render(<PrayerRecoveryChoices userId={userId} lang={lang} />);
    fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'older' } });
    fireEvent.change(screen.getByPlaceholderText(t(lang, 'protectionEmergency')), { target: { value: 'older-code' } });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'protectionEmergency') }));
    await waitFor(() => expect(services.recoverWithEmergencyCode).toHaveBeenCalledWith(userId, 'older', 'older-code'));
  });
});
