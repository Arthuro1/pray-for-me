import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPrayerProtectionCapabilities, getRecoveryRpId, isRecoveryOriginAllowed } from './prayerProtectionCapabilities';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('prayer protection capability detection', () => {
  it('allows localhost only with explicit development opt-in and the exact test origin', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('MODE', 'recovery-test');
    vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'true');
    vi.stubEnv('VITE_RECOVERY_ALLOW_LOCALHOST', 'true');
    vi.stubEnv('VITE_RECOVERY_LOCAL_ORIGIN', 'http://localhost:5173');
    vi.stubGlobal('location', { origin: 'http://localhost:5173' });
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('PublicKeyCredential', {});
    vi.stubGlobal('navigator', { credentials: { create() {}, get() {} }, locks: { request() {} } });
    expect(await getPrayerProtectionCapabilities()).toMatchObject({ originAllowed: true, canEnroll: true, canProtectDevice: true });
    expect(getRecoveryRpId()).toBe('localhost');
    vi.stubEnv('MODE', 'development');
    expect(isRecoveryOriginAllowed()).toBe(false);
    vi.stubEnv('MODE', 'recovery-test');
    vi.stubEnv('DEV', false);
    expect(isRecoveryOriginAllowed()).toBe(false);
    expect(getRecoveryRpId()).toBe('qetoret.com');
    vi.stubGlobal('location', { origin: 'https://qetoret.com' });
    expect(isRecoveryOriginAllowed()).toBe(true);
  });

  it.each(['http://localhost:5174', 'http://127.0.0.1:5173', 'http://test.localhost:5173', 'https://preview.example'])(
    'rejects another test page origin %s', (origin) => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('MODE', 'recovery-test');
    vi.stubEnv('VITE_RECOVERY_ALLOW_LOCALHOST', 'true');
    vi.stubEnv('VITE_RECOVERY_LOCAL_ORIGIN', 'http://localhost:5173');
    vi.stubGlobal('location', { origin });
    expect(isRecoveryOriginAllowed()).toBe(false);
    expect(getRecoveryRpId()).toBe('qetoret.com');
  });

  it.each([undefined, '', 'false'])('rejects localhost without explicit opt-in (%s)', (enabled) => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('MODE', 'recovery-test');
    vi.stubEnv('VITE_RECOVERY_ALLOW_LOCALHOST', enabled);
    vi.stubEnv('VITE_RECOVERY_LOCAL_ORIGIN', 'http://localhost:5173');
    vi.stubGlobal('location', { origin: 'http://localhost:5173' });
    expect(isRecoveryOriginAllowed()).toBe(false);
  });

  it.each(['http://localhost:5174', 'http://localhost:5173/', 'http://localhost:5173/path'])(
    'rejects noncanonical configured test origin %s', (origin) => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('MODE', 'recovery-test');
    vi.stubEnv('VITE_RECOVERY_ALLOW_LOCALHOST', 'true');
    vi.stubEnv('VITE_RECOVERY_LOCAL_ORIGIN', origin);
    vi.stubGlobal('location', { origin: 'http://localhost:5173' });
    expect(isRecoveryOriginAllowed()).toBe(false);
  });

  it('keeps PRF unverified even when platform verification and WebAuthn are available', async () => {
    vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'true');
    vi.stubGlobal('location', { origin: 'https://qetoret.com' });
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', { credentials: { create() {}, get() {} } });
    vi.stubGlobal('PublicKeyCredential', { isUserVerifyingPlatformAuthenticatorAvailable: async () => true });
    expect(await getPrayerProtectionCapabilities()).toMatchObject({ webAuthn: true, platformAuthenticator: 'available', prf: 'unverified', canEnroll: true,
      transitionSerialization: false, canProtectDevice: false });
    navigator.locks = { request() {} };
    expect(await getPrayerProtectionCapabilities()).toMatchObject({ transitionSerialization: true, canProtectDevice: true });
  });

  it('does not infer authenticator or PRF availability from browser branding or failed platform checks', async () => {
    vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'true');
    vi.stubGlobal('location', { origin: 'https://qetoret.com' });
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', { userAgent: 'A hypothetical browser with Windows Hello', credentials: { create() {}, get() {} } });
    vi.stubGlobal('PublicKeyCredential', { isUserVerifyingPlatformAuthenticatorAvailable: async () => { throw new Error('platform check unavailable'); } });
    expect(await getPrayerProtectionCapabilities()).toMatchObject({ platformAuthenticator: 'unknown', prf: 'unverified' });
    vi.stubGlobal('location', { origin: 'https://www.qetoret.com' });
    expect(await getPrayerProtectionCapabilities()).toMatchObject({ originAllowed: false, canEnroll: false });
    vi.stubGlobal('isSecureContext', false);
    expect(await getPrayerProtectionCapabilities()).toMatchObject({ secureContext: false, webAuthn: false, canEnroll: false });
  });
});
