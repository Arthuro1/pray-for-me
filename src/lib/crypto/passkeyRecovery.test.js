import { afterEach, describe, expect, it, vi } from 'vitest';
import { decryptJson, encryptJson, encryptJsonLegacy } from './e2ee';
import { extractPrfOutput, fromBase64Url, serializePublicKeyCredential, toBase64Url,
  validateRecoveryWrapper, verifySameAccountKey, wrapAccountKeyWithPrf, unwrapAccountKeyWithPrf,
  wrapAccountKeyWithEmergencyCode, unwrapAccountKeyWithEmergencyCode } from './passkeyRecovery';

const accountId = '10000000-0000-4000-8000-000000000001';
const methodId = '20000000-0000-4000-8000-000000000001';
const credentialId = toBase64Url(new Uint8Array([1, 2, 3, 4]));
const prfSalt = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
const context = { entityType: 'personal-prayer', ownerOrGroupId: accountId, recordId: 'historical-prayer', field: 'sensitive-payload' };
const key = () => crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('independent account-key recovery wrappers', () => {
  it('binds local test wrappers to localhost without accepting them in production', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('MODE', 'recovery-test');
    vi.stubEnv('VITE_RECOVERY_ALLOW_LOCALHOST', 'true');
    vi.stubEnv('VITE_RECOVERY_LOCAL_ORIGIN', 'http://localhost:5173');
    vi.stubGlobal('location', { origin: 'http://localhost:5173' });
    const original = await key();
    const history = await encryptJson(original, { title: 'Original localhost test prayer' }, context);
    const prf = crypto.getRandomValues(new Uint8Array(32));
    const wrapper = await wrapAccountKeyWithPrf(original, prf, { accountId, methodId, credentialId, prfSalt });
    expect(wrapper.rpId).toBe('localhost');
    const candidate = await unwrapAccountKeyWithPrf(wrapper, prf);
    expect(await decryptJson(candidate, history, context)).toEqual({ title: 'Original localhost test prayer' });
    expect(() => validateRecoveryWrapper({ ...wrapper, rpId: 'qetoret.com' })).toThrow('invalid_wrapper');
    vi.stubEnv('DEV', false);
    expect(() => validateRecoveryWrapper(wrapper)).toThrow('invalid_wrapper');
  });

  it('restores original modern and legacy ciphertext from only the persisted wrapper and reproducible PRF', async () => {
    const original = await key();
    const oldPrayer = await encryptJson(original, { title: 'Historical synthetic prayer' }, context);
    const legacyPrayer = await encryptJsonLegacy(original, { title: 'Legacy synthetic prayer' });
    const prf = crypto.getRandomValues(new Uint8Array(32));
    const wrapper = await wrapAccountKeyWithPrf(original, prf, { accountId, methodId, credentialId, prfSalt });
    const restored = await unwrapAccountKeyWithPrf(JSON.parse(JSON.stringify(wrapper)), new Uint8Array(prf), { accountId, methodId, credentialId });
    expect(await decryptJson(restored, oldPrayer, context)).toEqual({ title: 'Historical synthetic prayer' });
    expect(await decryptJson(restored, legacyPrayer)).toEqual({ title: 'Legacy synthetic prayer' });
    expect(await verifySameAccountKey(original, restored)).toBe(true);
    expect(await verifySameAccountKey(await key(), restored)).toBe(false);
  });

  it('binds account, method, credential, PRF context and ciphertext without modifying the original key', async () => {
    const original = await key();
    const prf = crypto.getRandomValues(new Uint8Array(32));
    const wrapper = await wrapAccountKeyWithPrf(original, prf, { accountId, methodId, credentialId, prfSalt });
    const changes = {
      accountId: '10000000-0000-4000-8000-000000000002', methodId: '20000000-0000-4000-8000-000000000002',
      credentialId: toBase64Url(new Uint8Array([5, 6])), prfSalt: toBase64Url(new Uint8Array(32)),
      hkdfSalt: toBase64Url(new Uint8Array(32)), ciphertext: toBase64Url(new Uint8Array(48)),
    };
    for (const [field, value] of Object.entries(changes)) {
      await expect(unwrapAccountKeyWithPrf({ ...wrapper, [field]: value }, prf)).rejects.toThrow();
    }
    await expect(unwrapAccountKeyWithPrf(wrapper, crypto.getRandomValues(new Uint8Array(32)))).rejects.toThrow();
    await expect(unwrapAccountKeyWithPrf(wrapper, prf, { accountId: changes.accountId })).rejects.toThrow('invalid_wrapper');
    expect(await crypto.subtle.exportKey('raw', original)).toHaveProperty('byteLength', 32);
  });

  it('validates version, allowlisted metadata, binary lengths and canonical base64url', async () => {
    const wrapper = await wrapAccountKeyWithPrf(await key(), new Uint8Array(32), { accountId, methodId, credentialId, prfSalt });
    for (const invalid of [{ ...wrapper, version: 2 }, { ...wrapper, prfOutput: 'must never serialize' },
      { ...wrapper, iv: toBase64Url(new Uint8Array(11)) }, { ...wrapper, ciphertext: toBase64Url(new Uint8Array(47)) },
      { ...wrapper, rpId: 'attacker.example' }, { ...wrapper, prfSalt: `${wrapper.prfSalt}=` }]) {
      expect(() => validateRecoveryWrapper(invalid)).toThrow('invalid_wrapper');
    }
    expect(() => fromBase64Url('AB')).toThrow('invalid_wrapper');
    await expect(wrapAccountKeyWithPrf(await key(), new Uint8Array(31), { accountId, methodId, credentialId, prfSalt })).rejects.toThrow('prf_unavailable');
  });

  it('preserves the same original encrypted content through an independent emergency-code wrapper', async () => {
    const original = await key();
    const plaintext = { title: 'Synthetic historical content', attachments: [{ key: 'synthetic-media-key' }] };
    const historical = await encryptJson(original, plaintext, context);
    const code = '0'.repeat(26);
    const wrapper = await wrapAccountKeyWithEmergencyCode(original, code, { accountId, methodId });
    const candidate = await unwrapAccountKeyWithEmergencyCode(JSON.parse(JSON.stringify(wrapper)), code, { accountId, methodId });
    expect(await decryptJson(candidate, historical, context)).toEqual(plaintext);
    await expect(unwrapAccountKeyWithEmergencyCode(wrapper, `1${code.slice(1)}`)).rejects.toThrow();
    await expect(unwrapAccountKeyWithEmergencyCode({ ...wrapper, iterations: 1 }, code)).rejects.toThrow('invalid_wrapper');
  }, 30_000);
});

describe('WebAuthn credential boundary', () => {
  it('serializes only verification fields and never includes PRF output or extension dumps', () => {
    const secret = crypto.getRandomValues(new Uint8Array(32));
    const credential = { rawId: new Uint8Array([1, 2, 3, 4]), response: {
      clientDataJSON: new Uint8Array([5]), authenticatorData: new Uint8Array([6]), signature: new Uint8Array([7]), userHandle: null,
    }, getClientExtensionResults: () => ({ prf: { enabled: true, results: { first: secret.buffer } } }),
    toJSON: () => { throw new Error('unsafe serialization must never run'); } };
    expect(extractPrfOutput(credential, credentialId)).toEqual(secret);
    const serialized = serializePublicKeyCredential(credential);
    expect(serialized.clientExtensionResults).toEqual({});
    expect(JSON.stringify(serialized)).not.toContain(toBase64Url(secret));
    expect(JSON.stringify(serialized)).not.toContain('prf');
    expect(() => extractPrfOutput({ ...credential, getClientExtensionResults: () => ({ prf: { enabled: true } }) })).toThrow('prf_unavailable');
    expect(() => extractPrfOutput(credential, 'different')).toThrow('credential_mismatch');
  });
});
