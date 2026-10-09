// Detect APIs, not browser brands. Only an actual credential assertion can
// demonstrate that this authenticator supplies usable PRF output.
export const prayerProtectionEnrollmentEnabled = () => import.meta.env.VITE_PRAYER_PROTECTION_ENABLED === 'true';
const LOCAL_TEST_ORIGIN = 'http://localhost:5173';
// This opt-in exists only in a Vite development build. It cannot authorize a
// preview or production build, a LAN address, or an origin chosen by the page.
const localTestOriginAllowed = () => import.meta.env.DEV === true
  && import.meta.env.MODE === 'recovery-test'
  && import.meta.env.VITE_RECOVERY_ALLOW_LOCALHOST === 'true'
  && import.meta.env.VITE_RECOVERY_LOCAL_ORIGIN === LOCAL_TEST_ORIGIN
  && globalThis.location?.origin === LOCAL_TEST_ORIGIN;
export const isRecoveryOriginAllowed = () => globalThis.location?.origin === 'https://qetoret.com' || localTestOriginAllowed();
export const getRecoveryRpId = () => localTestOriginAllowed() ? 'localhost' : 'qetoret.com';

export async function getPrayerProtectionCapabilities() {
  const secureContext = globalThis.isSecureContext === true;
  const originAllowed = isRecoveryOriginAllowed();
  const webAuthn = secureContext && !!globalThis.PublicKeyCredential
    && typeof globalThis.navigator?.credentials?.create === 'function'
    && typeof globalThis.navigator?.credentials?.get === 'function';
  const transitionSerialization = typeof globalThis.navigator?.locks?.request === 'function';
  let platformAuthenticator = 'unknown';
  if (webAuthn && typeof globalThis.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
    try { platformAuthenticator = await globalThis.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable() ? 'available' : 'unavailable'; }
    catch { /* An API failure is not evidence that all passkeys are unsupported. */ }
  }
  const canEnroll = prayerProtectionEnrollmentEnabled() && originAllowed && webAuthn;
  return { secureContext, originAllowed, webAuthn, platformAuthenticator, prf: 'unverified', transitionSerialization,
    enrollmentEnabled: prayerProtectionEnrollmentEnabled(), canEnroll, canProtectDevice: canEnroll && transitionSerialization };
}
