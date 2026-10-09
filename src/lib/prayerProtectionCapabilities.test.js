import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPrayerProtectionCapabilities } from './prayerProtectionCapabilities';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('prayer protection capability detection', () => {
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
