// Native authenticator/server verification are explicit doubles here. WebCrypto,
// IndexedDB, lifecycle isolation and recovery of ORIGINAL ciphertext are real.
// This is not evidence of physical-device PRF/provider synchronization support.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

const state = vi.hoisted(() => ({ methods: new Map(), identity: null, prayer: null, userId: null, enabled: true, offline: false, backupState: null }));
vi.mock('./supabase', () => ({ supabase: {
  auth: { getSession: async () => ({ data: { session: { user: { id: state.userId }, access_token: 'synthetic-token' } } }) },
  from: (table) => {
    const query = { select: () => query, eq: () => query, not: () => query, limit: () => query,
      maybeSingle: async () => ({ data: table === 'user_crypto_keys' ? state.identity : table === 'prayers' ? state.prayer : null, error: null }) };
    return query;
  },
} }));
vi.mock('./crypto/userKeys', () => ({ ensureUserPublicKey: async () => ({ kty: 'RSA' }), regenerateIdentityKey: vi.fn() }));
vi.mock('./crypto/groupKeys', () => ({ clearGroupKeyDistributionCache: vi.fn() }));
// Production requires the exact RP origin. Tests override this boundary because
// a local test origin cannot act as qetoret.com or create its real credentials.
vi.mock('./prayerProtectionCapabilities', () => ({
  isRecoveryOriginAllowed: () => true, prayerProtectionEnrollmentEnabled: () => state.enabled,
  getRecoveryRpId: () => 'qetoret.com',
  getPrayerProtectionCapabilities: async () => ({ secureContext: true, originAllowed: true, webAuthn: true, platformAuthenticator: 'available', prf: 'unverified', canEnroll: state.enabled }),
}));

import { configureAccountContext, importRawMasterKey, getMasterKey, isUnlocked, lock, getDeviceProtectionPolicy } from './crypto/keyManager';
import { encryptJson, decryptJson, toB64, fromB64 } from './crypto/e2ee';
import { encryptBlob, decryptToBlob } from './crypto/mediaCrypto';
import { toBase64Url } from './crypto/passkeyRecovery';
import { enrollPasskeyRecovery, generateEmergencyRecovery, verifyEmergencyRecovery, enableDeviceUnlock,
  recoverWithPasskey, recoverWithEmergencyCode, unlockWithDevice, disableDeviceUnlock } from './prayerProtection';

const userId = '30000000-0000-4000-8000-000000000001';
const methodId = '40000000-0000-4000-8000-000000000001';
const credentialBytes = new Uint8Array([10, 20, 30, 40]);
const credentialId = toBase64Url(credentialBytes);
const challenge = toBase64Url(new Uint8Array(32).fill(3));
const prf = new Uint8Array(32).fill(47);
const prayerContext = { entityType: 'personal-prayer', ownerOrGroupId: userId, recordId: 'historical-prayer', keyVersion: 1, field: 'sensitive-payload' };
const identityContext = { entityType: 'user-identity-key', ownerOrGroupId: userId, recordId: userId, keyVersion: 1, field: 'encrypted-private-key' };
let credentialDescriptor;
let onlineDescriptor;

async function apiDouble(_url, request) {
  const body = JSON.parse(request.body);
  const existing = state.methods.get(body.methodId);
  let result;
  switch (body.action) {
    case 'register-options': result = { methodId, challengeId: crypto.randomUUID(), options: { challenge, rp: { id: 'qetoret.com', name: 'Qetoret' }, user: { id: challenge, name: userId }, pubKeyCredParams: [{ type: 'public-key', alg: -7 }] } }; break;
    case 'register-verify': result = { credentialId }; break;
    case 'assert-options': result = { method: existing, challengeId: crypto.randomUUID(), options: { challenge, rpId: 'qetoret.com', allowCredentials: [{ id: credentialId, type: 'public-key' }] } }; break;
    case 'assert-verify': result = { proofId: crypto.randomUUID(), method: existing }; break;
    case 'commit': case 'emergency-create': {
      const method = { id: body.methodId, userId, type: body.action === 'commit' ? 'passkey' : 'emergency-code', status: 'pending', revision: 1, wrapper: body.wrapper,
        ...(body.action === 'commit' ? { credentialId, backupState: state.backupState } : {}) };
      state.methods.set(method.id, method); result = { method }; break;
    }
    case 'read': result = { method: existing }; break;
    case 'verify': case 'emergency-verify': {
      const method = { ...existing, revision: 2, status: 'active' };
      state.methods.set(method.id, method); result = { method }; break;
    }
    default: throw new Error('unexpected_test_request');
  }
  return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(async () => {
  configureAccountContext(null);
  state.methods.clear(); state.identity = null; state.prayer = null; state.userId = userId; state.enabled = true; state.offline = false; state.backupState = null;
  localStorage.removeItem(`pfm_device_protected_${userId}`);
  sessionStorage.clear();
  await Promise.all([idbDel(`pfm_ak_${userId}`), idbDel(`pfm_protected_device_v1:${userId}`), idbDel(`pfm_vault:${userId}`)]);
  credentialDescriptor = Object.getOwnPropertyDescriptor(navigator, 'credentials');
  onlineDescriptor = Object.getOwnPropertyDescriptor(navigator, 'onLine');
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => !state.offline });
  Object.defineProperty(navigator, 'credentials', { configurable: true, value: {
    create: async () => ({ rawId: credentialBytes.slice().buffer, response: { clientDataJSON: new Uint8Array([1]).buffer, attestationObject: new Uint8Array([2]).buffer } }),
    get: async () => ({ rawId: credentialBytes.slice().buffer, response: { clientDataJSON: new Uint8Array([1]).buffer, authenticatorData: new Uint8Array([2]).buffer, signature: new Uint8Array([3]).buffer, userHandle: null },
      getClientExtensionResults: () => ({ prf: { results: { first: prf.slice().buffer } } }) }),
  } });
  vi.stubGlobal('fetch', vi.fn(apiDouble));
  configureAccountContext(userId);
  await importRawMasterKey(toB64(crypto.getRandomValues(new Uint8Array(32))));
});

afterEach(async () => {
  configureAccountContext(null);
  vi.unstubAllGlobals();
  if (credentialDescriptor) Object.defineProperty(navigator, 'credentials', credentialDescriptor); else delete navigator.credentials;
  if (onlineDescriptor) Object.defineProperty(navigator, 'onLine', onlineDescriptor); else delete navigator.onLine;
  localStorage.removeItem(`pfm_device_protected_${userId}`);
  sessionStorage.clear();
  await Promise.all([idbDel(`pfm_ak_${userId}`), idbDel(`pfm_protected_device_v1:${userId}`), idbDel(`pfm_vault:${userId}`)]);
});

it('recovers original prayer, identity, group key and encrypted attachment after eliminating the original local key', async () => {
  const rsa = await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']);
  state.identity = { encrypted_private_key: await encryptJson(getMasterKey(), toB64(new Uint8Array(await crypto.subtle.exportKey('pkcs8', rsa.privateKey))), identityContext) };
  const mediaId = 'historical-media';
  const media = await encryptBlob(new Blob(['Synthetic historical recording'], { type: 'text/plain' }), { ownerOrGroupId: userId, recordId: mediaId });
  state.prayer = { id: 'historical-prayer', user_id: userId, key_version: 1,
    encrypted_payload: await encryptJson(getMasterKey(), { title: 'Synthetic original prayer', attachment: { key: media.key, iv: media.iv } }, prayerContext) };
  const groupKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const groupEnvelope = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, rsa.publicKey, await crypto.subtle.exportKey('raw', groupKey));
  const groupContext = { entityType: 'group-prayer', ownerOrGroupId: 'synthetic-group', recordId: 'group-history', field: 'sensitive-payload' };
  const groupCiphertext = await encryptJson(groupKey, { title: 'Synthetic group history' }, groupContext);
  const enrolled = await enrollPasskeyRecovery(userId);
  expect(enrolled.ok).toBe(true);
  const emergency = await generateEmergencyRecovery(userId);
  expect((await verifyEmergencyRecovery(userId, emergency.method.id, emergency.code)).ok).toBe(true);
  await idbSet(`pfm_ak_${userId}`, 'synthetic-raw-slot');
  expect((await enableDeviceUnlock(userId, enrolled.method.id)).ok).toBe(true);
  expect(await idbGet(`pfm_ak_${userId}`)).toBeUndefined();
  expect(sessionStorage.getItem(`pfm_vault_session:${userId}`)).toBeNull();

  // Simulate a new profile by removing every old local recovery/session slot
  // and reconfiguring the key manager. Only server ciphertext and the credential
  // double's reproducible PRF remain available to the service.
  configureAccountContext(null);
  await idbDel(`pfm_protected_device_v1:${userId}`);
  localStorage.removeItem(`pfm_device_protected_${userId}`);
  sessionStorage.clear();
  configureAccountContext(userId);
  expect(isUnlocked()).toBe(false);
  expect((await recoverWithPasskey(userId, enrolled.method.id)).ok).toBe(true);
  const recoveredPrayer = await decryptJson(getMasterKey(), state.prayer.encrypted_payload, prayerContext);
  expect(recoveredPrayer.title).toBe('Synthetic original prayer');
  const identity = await decryptJson(getMasterKey(), state.identity.encrypted_private_key, identityContext);
  const recoveredIdentity = await crypto.subtle.importKey('pkcs8', fromB64(identity), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
  const recoveredGroupKey = await crypto.subtle.importKey('raw', await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, recoveredIdentity, groupEnvelope), 'AES-GCM', false, ['decrypt']);
  expect(await decryptJson(recoveredGroupKey, groupCiphertext, groupContext)).toEqual({ title: 'Synthetic group history' });
  const restoredMedia = await decryptToBlob(media.bytes, { ...recoveredPrayer.attachment, id: mediaId, path: `${userId}/${mediaId}`, mime: 'text/plain', encryptionVersion: 2 });
  expect(await restoredMedia.text()).toBe('Synthetic historical recording');
  lock();
  expect((await recoverWithEmergencyCode(userId, emergency.method.id, emergency.code)).ok).toBe(true);
  expect((await decryptJson(getMasterKey(), state.prayer.encrypted_payload, prayerContext)).title).toBe('Synthetic original prayer');

  await verifyEmergencyRecovery(userId, emergency.method.id, emergency.code);
  expect((await enableDeviceUnlock(userId, enrolled.method.id)).ok).toBe(true);
  lock(); state.enabled = false; state.offline = true;
  expect(getDeviceProtectionPolicy(userId)).toBe('protected');
  expect((await unlockWithDevice(userId)).ok).toBe(true);
  expect(sessionStorage.getItem(`pfm_vault_session:${userId}`)).toBeNull();
  expect(await idbGet(`pfm_ak_${userId}`)).toBeUndefined();
  // The explicit downgrade stages and reads back the same original key before
  // removing protection, including after enrollment has been rolled back.
  expect((await disableDeviceUnlock(userId)).ok).toBe(true);
  expect(getDeviceProtectionPolicy(userId)).toBe('transparent');
  expect(await idbGet(`pfm_protected_device_v1:${userId}`)).toBeUndefined();
  expect(await idbGet(`pfm_ak_${userId}`)).toBe(toB64(new Uint8Array(await crypto.subtle.exportKey('raw', getMasterKey()))));
  expect((await decryptJson(getMasterKey(), state.prayer.encrypted_payload, prayerContext)).title).toBe('Synthetic original prayer');
}, 60_000);


it('uses a backed-up passkey alone for protected offline access and new-profile recovery of the same prayer', async () => {
  state.prayer = { id: 'historical-prayer', user_id: userId, key_version: 1,
    encrypted_payload: await encryptJson(getMasterKey(), { title: 'Original code-free prayer' }, prayerContext) };
  state.backupState = { eligible: true, backedUp: true };
  const enrolled = await enrollPasskeyRecovery(userId);
  expect(enrolled.ok).toBe(true);
  await idbSet(`pfm_ak_${userId}`, 'original-raw-slot');
  expect((await enableDeviceUnlock(userId, enrolled.method.id)).ok).toBe(true);
  expect((await idbGet(`pfm_protected_device_v1:${userId}`)).recoveryRoute.type).toBe('passkey-backup');
  expect(await idbGet(`pfm_ak_${userId}`)).toBeUndefined();
  expect([...state.methods.values()].every((method) => method.type === 'passkey')).toBe(true);
  lock(); state.enabled = false; state.offline = true;
  expect((await unlockWithDevice(userId)).ok).toBe(true);
  expect(await decryptJson(getMasterKey(), state.prayer.encrypted_payload, prayerContext)).toEqual({ title: 'Original code-free prayer' });
  configureAccountContext(null);
  await idbDel(`pfm_protected_device_v1:${userId}`);
  localStorage.removeItem(`pfm_device_protected_${userId}`);
  sessionStorage.clear(); state.offline = false;
  configureAccountContext(userId);
  expect(isUnlocked()).toBe(false);
  expect((await recoverWithPasskey(userId, enrolled.method.id)).ok).toBe(true);
  expect(await decryptJson(getMasterKey(), state.prayer.encrypted_payload, prayerContext)).toEqual({ title: 'Original code-free prayer' });
}, 30_000);

it('finishes pending passkey recovery after losing the running key with enrollment disabled', async () => {
  state.prayer = { id: 'historical-prayer', user_id: userId, key_version: 1,
    encrypted_payload: await encryptJson(getMasterKey(), { title: 'Original pending prayer' }, prayerContext) };
  const enrolled = await enrollPasskeyRecovery(userId);
  expect(enrolled.ok).toBe(true);
  state.methods.set(enrolled.method.id, { ...enrolled.method, status: 'pending', revision: 1 });
  lock(); state.enabled = false;
  expect(isUnlocked()).toBe(false);
  const recovered = await recoverWithPasskey(userId, enrolled.method.id);
  expect(recovered).toMatchObject({ ok: true, status: 'recovered', method: { status: 'active' } });
  expect(await decryptJson(getMasterKey(), state.prayer.encrypted_payload, prayerContext)).toEqual({ title: 'Original pending prayer' });
}, 30_000);
