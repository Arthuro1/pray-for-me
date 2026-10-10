import { describe, expect, it } from 'vitest';
import { recoveryConfig, validateWrapper, sanitizeWebAuthn, safeLabel } from './recoveryValidation.js';

const userId = '11111111-1111-4111-8111-111111111111';
const methodId = '22222222-2222-4222-8222-222222222222';
const b64 = size => Buffer.alloc(size, 17).toString('base64url');
const wrapper = () => ({ version: 1, kind: 'passkey-prf', accountId: userId, methodId,
  credentialId: b64(16), rpId: 'qetoret.com', prfSalt: b64(32), hkdfSalt: b64(32), iv: b64(12), ciphertext: b64(48) });
const context = { userId, methodId, credentialId: b64(16), rpID: 'qetoret.com', type: 'passkey' };

describe('recovery public boundary', () => {
  it('defaults enrollment off and pins production RP and exact origin', () => {
    expect(recoveryConfig({})).toEqual({ enrollment: false, origin: 'https://qetoret.com', rpID: 'qetoret.com' });
    expect(recoveryConfig({ NODE_ENV: 'production', RECOVERY_ALLOW_LOCALHOST: 'true', RECOVERY_LOCAL_ORIGIN: 'http://localhost:5173' }).rpID).toBe('qetoret.com');
  });
  it('permits only explicitly configured localhost in nonproduction', () => {
    expect(recoveryConfig({ NODE_ENV: 'development', RECOVERY_ALLOW_LOCALHOST: 'true', RECOVERY_LOCAL_ORIGIN: 'http://localhost:5173' }).origin).toBe('http://localhost:5173');
    expect(() => recoveryConfig({ RECOVERY_ALLOW_LOCALHOST: 'true', RECOVERY_LOCAL_ORIGIN: 'https://evil.test' })).toThrow();
    expect(() => recoveryConfig({ RECOVERY_ALLOW_LOCALHOST: 'true', RECOVERY_LOCAL_ORIGIN: 'http://localhost:99999' })).toThrow();
  });
  it('accepts exact versioned passkey ciphertext and public parameters', () => {
    expect(validateWrapper(wrapper(), context)).toEqual(wrapper());
  });
  it.each([
    ['accountId', '33333333-3333-4333-8333-333333333333'], ['methodId', userId], ['credentialId', b64(17)],
    ['rpId', 'www.qetoret.com'], ['version', 2], ['iv', b64(16)], ['ciphertext', b64(32)],
    ['prfSalt', `${b64(32)}=`], ['hkdfSalt', b64(31)], ['prfOutput', 'NEVER_SEND_THIS'],
  ])('rejects unbound, corrupted or secret wrapper field %s', (key, value) => {
    expect(() => validateWrapper({ ...wrapper(), [key]: value }, context)).toThrow();
  });
  it('accepts explicit emergency KDF parameters and rejects weakened KDFs', () => {
    const value = { version: 1, kind: 'emergency-code', accountId: userId, methodId, salt: b64(32), iterations: 600000, iv: b64(12), ciphertext: b64(48) };
    expect(validateWrapper(value, { userId, methodId, type: 'emergency-code' })).toEqual(value);
    expect(() => validateWrapper({ ...value, iterations: 310000 }, { userId, methodId, type: 'emergency-code' })).toThrow();
  });
  it('strips PRF and arbitrary nested properties before verifier input', () => {
    const value = sanitizeWebAuthn({ id: b64(16), rawId: b64(16), type: 'public-key',
      response: { clientDataJSON: b64(10), authenticatorData: b64(37), signature: b64(64), secret: 'private' },
      clientExtensionResults: { prf: { results: { first: 'PRIVATE_PRF' } } }, secret: 'private' }, false);
    expect(JSON.stringify(value)).not.toMatch(/PRIVATE|private|prf/);
    expect(value.clientExtensionResults).toEqual({});
  });
  it('requires canonical base64url and matching raw credential ID', () => {
    expect(() => sanitizeWebAuthn({ id: b64(16), rawId: b64(17), type: 'public-key', response: { clientDataJSON: b64(10) } }, true)).toThrow();
    expect(() => safeLabel('bad\nlabel')).toThrow();
  });
});
