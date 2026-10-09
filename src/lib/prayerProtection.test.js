import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => ({ store: new Map(), methods: new Map(), requests: [], prayer: null, identity: null, legacy: null,
  currentUser: null, failCommit: false, failDelete: false, onGet: null, onSet: null, onDelete: null, prfUnavailable: false }));

vi.mock('idb-keyval', () => ({
  get: async (key) => harness.store.get(key), set: async (key, value) => { await harness.onSet?.(key); harness.store.set(key, structuredClone(value)); },
  del: async (key) => { await harness.onDelete?.(key); if (harness.failDelete && key.startsWith('pfm_ak_')) throw new Error('storage failed'); harness.store.delete(key); },
}));
vi.mock('./supabase', () => ({ supabase: {
  auth: { getSession: async () => ({ data: { session: { user: { id: harness.currentUser }, access_token: 'synthetic-token' } } }) },
  from: (table) => {
    const query = { select: () => query, eq: () => query, not: () => query, limit: () => query,
      maybeSingle: async () => ({ data: table === 'prayers' ? harness.prayer : table === 'user_crypto_keys' ? harness.identity : table === 'vault_keys' && harness.legacy ? { record: harness.legacy } : null, error: null }) };
    return query;
  },
} }));
vi.mock('./crypto/userKeys', () => ({ ensureUserPublicKey: async () => ({ kty: 'RSA' }), regenerateIdentityKey: vi.fn() }));
vi.mock('./crypto/groupKeys', () => ({ clearGroupKeyDistributionCache: vi.fn() }));

import { configureAccountContext, importRawMasterKey, getMasterKey, isUnlocked, lock,
  createVault, exportVaultRecord, rotateRecoveryCode, getDeviceProtectionPolicy } from './crypto/keyManager';
import { encryptJson, toB64 } from './crypto/e2ee';
import { forgetAccountKey, rememberAccountKey } from './crypto/accountKey';
import { fromBase64Url, toBase64Url } from './crypto/passkeyRecovery';
import { clearPrayerProtectionProofs, enrollPasskeyRecovery, generateEmergencyRecovery, verifyEmergencyRecovery,
  recoverWithEmergencyCode, recoverWithPasskey, enableDeviceUnlock, disableDeviceUnlock, unlockWithDevice, getProtectionStatus, revokeRecoveryMethod, verifyLegacyRecoveryCode, forgetProtectedDevice } from './prayerProtection';

const userId = '10000000-0000-4000-8000-000000000001';
const otherUserId = '10000000-0000-4000-8000-000000000002';
const passkeyId = '20000000-0000-4000-8000-000000000001';
const credentialBytes = new Uint8Array([1, 2, 3, 4]);
const credentialId = toBase64Url(credentialBytes);
const prfSecret = new Uint8Array(32).fill(42);
const challenge = toBase64Url(new Uint8Array(32).fill(3));

function installStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key), clear: () => values.clear() };
}

function assertion() {
  return { rawId: credentialBytes.buffer.slice(0), response: { clientDataJSON: new Uint8Array([1]), authenticatorData: new Uint8Array([2]), signature: new Uint8Array([3]), userHandle: null },
    getClientExtensionResults: () => harness.prfUnavailable ? { prf: { enabled: true } } : { prf: { results: { first: prfSecret.slice().buffer } } } };
}

function lockQueue() {
  let tail = Promise.resolve();
  return { request: vi.fn((_name, _options, action) => {
    const operation = tail.then(action);
    tail = operation.catch(() => {});
    return operation;
  }) };
}

async function fakeApi(_url, request) {
  const body = JSON.parse(request.body);
  harness.requests.push(body);
  let result;
  const method = harness.methods.get(body.methodId);
  switch (body.action) {
    case 'list': result = { methods: [...harness.methods.values()].filter((item) => item.userId === harness.currentUser && item.status !== 'revoked') }; break;
    case 'read': result = { method }; break;
    case 'register-options': result = { methodId: passkeyId, challengeId: crypto.randomUUID(), options: { challenge, rp: { id: 'qetoret.com', name: 'Qetoret' }, user: { id: challenge, name: userId }, pubKeyCredParams: [{ type: 'public-key', alg: -7 }] } }; break;
    case 'register-verify': result = { credentialId }; break;
    case 'assert-options': result = { challengeId: crypto.randomUUID(), options: { challenge, rpId: 'qetoret.com', allowCredentials: [{ id: credentialId, type: 'public-key' }] }, method }; break;
    case 'assert-verify': result = { proofId: crypto.randomUUID(), method }; break;
    case 'commit': {
      if (harness.failCommit) return { ok: false, status: 503, json: async () => ({ error: 'recovery_unavailable' }) };
      const created = { id: body.methodId, userId, type: 'passkey', status: 'pending', credentialId, wrapper: body.wrapper, revision: 1, label: 'Synthetic device' };
      harness.methods.set(created.id, created); result = { method: created }; break;
    }
    case 'emergency-create': {
      const created = { id: body.methodId, userId, type: 'emergency-code', status: 'pending', wrapper: body.wrapper, revision: 1 };
      harness.methods.set(created.id, created); result = { method: created }; break;
    }
    case 'verify': case 'emergency-verify': {
      const verified = { ...method, status: 'active', revision: method.revision + 1, verifiedAt: new Date().toISOString(), verificationKind: 'client-reported' };
      harness.methods.set(verified.id, verified); result = { method: verified }; break;
    }
    case 'revoke': harness.methods.set(method.id, { ...method, status: 'revoked' }); result = { ok: true }; break;
    default: throw new Error(`Unexpected action ${body.action}`);
  }
  return { ok: true, status: 200, json: async () => structuredClone(result) };
}

beforeEach(async () => {
  configureAccountContext(null);
  harness.store.clear(); harness.methods.clear(); harness.requests = []; harness.prayer = null; harness.identity = null; harness.legacy = null;
  harness.currentUser = userId; harness.failCommit = false; harness.failDelete = false; harness.onGet = null; harness.onSet = null; harness.onDelete = null; harness.prfUnavailable = false;
  clearPrayerProtectionProofs();
  vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'true');
  vi.stubGlobal('localStorage', installStorage()); vi.stubGlobal('sessionStorage', installStorage());
  vi.stubGlobal('indexedDB', {}); vi.stubGlobal('location', { origin: 'https://qetoret.com' }); vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('PublicKeyCredential', { isUserVerifyingPlatformAuthenticatorAvailable: async () => true });
  vi.stubGlobal('navigator', { onLine: true, locks: lockQueue(), credentials: {
    create: vi.fn(async () => ({ rawId: credentialBytes.buffer.slice(0), response: { clientDataJSON: new Uint8Array([1]), attestationObject: new Uint8Array([2]), getTransports: () => ['internal'] } })),
    get: vi.fn(async () => { await harness.onGet?.(); return assertion(); }),
  } });
  vi.stubGlobal('fetch', vi.fn(fakeApi));
  configureAccountContext(userId);
  await importRawMasterKey(toB64(crypto.getRandomValues(new Uint8Array(32))));
  const payload = await encryptJson(getMasterKey(), { title: 'Synthetic original history' }, { entityType: 'personal-prayer', ownerOrGroupId: userId, recordId: 'old-prayer', keyVersion: 1, field: 'sensitive-payload' });
  harness.prayer = { id: 'old-prayer', user_id: userId, key_version: 1, encrypted_payload: payload };
});

afterEach(() => { configureAccountContext(null); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('verified recovery orchestration', () => {
  it('only activates passkey recovery after persisted-wrapper readback and an independent assertion', async () => {
    const original = getMasterKey();
    const result = await enrollPasskeyRecovery(userId);
    expect(result).toMatchObject({ ok: true, status: 'verified_current_device', method: { status: 'active' } });
    expect(getMasterKey()).toBe(original);
    expect(navigator.credentials.get).toHaveBeenCalledTimes(2);
    const actions = harness.requests.map((item) => item.action);
    expect(actions).toEqual(['register-options', 'register-verify', 'assert-options', 'assert-verify', 'commit', 'read', 'assert-options', 'assert-verify', 'verify']);
    expect(JSON.stringify(harness.requests)).not.toContain(toBase64Url(prfSecret));
    expect(JSON.stringify(harness.requests)).not.toContain('"prf":');
  });

  it('reports a passkey tested here only for a current local proof, never from server active status alone', async () => {
    const result = await enrollPasskeyRecovery(userId);
    expect((await getProtectionStatus(userId)).methods[0]).toMatchObject({ status: 'active', verifiedHere: true });
    const active = harness.methods.get(result.method.id);
    // Simulate a fresh runtime and even an untrusted server-provided label.
    clearPrayerProtectionProofs();
    harness.methods.set(active.id, { ...active, verifiedHere: true });
    expect((await getProtectionStatus(userId)).methods[0]).toMatchObject({ status: 'active', verifiedHere: false });
    lock();
    expect((await recoverWithPasskey(userId, active.id)).ok).toBe(true);
    expect((await getProtectionStatus(userId)).methods[0].verifiedHere).toBe(true);
    harness.methods.set(active.id, { ...active, revision: active.revision + 1 });
    expect((await getProtectionStatus(userId)).methods[0].verifiedHere).toBe(false);
    configureAccountContext(otherUserId);
    configureAccountContext(userId);
    harness.methods.set(active.id, active);
    expect((await getProtectionStatus(userId)).methods[0].verifiedHere).toBe(false);
  });

  it('clears emergency-code local test receipts on lock and records a successful historical recovery again', async () => {
    const generated = await generateEmergencyRecovery(userId);
    expect((await getProtectionStatus(userId)).methods[0]).toMatchObject({ status: 'pending', verifiedHere: false });
    expect((await verifyEmergencyRecovery(userId, generated.method.id, generated.code)).ok).toBe(true);
    expect((await getProtectionStatus(userId)).methods[0]).toMatchObject({ status: 'active', verifiedHere: true });
    lock();
    expect((await getProtectionStatus(userId)).methods[0]).toMatchObject({ status: 'active', verifiedHere: false });
    expect((await recoverWithEmergencyCode(userId, generated.method.id, generated.code)).ok).toBe(true);
    expect((await getProtectionStatus(userId)).methods[0].verifiedHere).toBe(true);
  }, 30_000);

  it('does not activate a method when PRF is unavailable or upload fails, retaining the original key', async () => {
    const original = getMasterKey();
    harness.prfUnavailable = true;
    expect(await enrollPasskeyRecovery(userId)).toMatchObject({ ok: false, status: 'prf_unavailable' });
    expect(harness.requests.some((item) => item.action === 'commit')).toBe(false);
    harness.prfUnavailable = false; harness.failCommit = true;
    expect(await enrollPasskeyRecovery(userId)).toMatchObject({ ok: false });
    expect(harness.requests.some((item) => item.action === 'verify')).toBe(false);
    expect(getMasterKey()).toBe(original);
  });

  it('allows removing an abandoned registration that has no wrapper or revision yet', async () => {
    harness.methods.set(passkeyId, { id: passkeyId, userId, type: 'passkey', status: 'pending', revision: 0, wrapper: null });
    expect(await revokeRecoveryMethod(userId, passkeyId)).toMatchObject({ ok: true, status: 'revoked' });
    expect(harness.methods.get(passkeyId).status).toBe('revoked');
  });

  it('cannot install a key after the account changes during the operating-system prompt', async () => {
    const enrolled = await enrollPasskeyRecovery(userId);
    lock();
    harness.onGet = () => { harness.currentUser = otherUserId; configureAccountContext(otherUserId); };
    expect(await recoverWithPasskey(userId, enrolled.method.id)).toMatchObject({ ok: false, status: 'stale_account' });
    expect(isUnlocked()).toBe(false);
    expect(harness.store.has(`pfm_ak_${otherUserId}`)).toBe(false);
  });

  it('requires saved emergency-code re-entry and restores original historical ciphertext after lock', async () => {
    const generated = await generateEmergencyRecovery(userId);
    expect(generated).toMatchObject({ ok: true, status: 'verification_required', method: { status: 'pending' } });
    expect(await verifyEmergencyRecovery(userId, generated.method.id, '0'.repeat(26))).toMatchObject({ ok: false, status: 'wrong_code' });
    expect(harness.methods.get(generated.method.id).status).toBe('pending');
    const verified = await verifyEmergencyRecovery(userId, generated.method.id, generated.code);
    expect(verified).toMatchObject({ ok: true, method: { status: 'active' } });
    lock();
    expect(await recoverWithEmergencyCode(userId, generated.method.id, generated.code)).toMatchObject({ ok: true, status: 'recovered' });
    expect(isUnlocked()).toBe(true);
  }, 30_000);

  it('rejects a recovered wrapper when historical ciphertext belongs to another key before installing', async () => {
    const enrolled = await enrollPasskeyRecovery(userId);
    const different = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    harness.prayer.encrypted_payload = await encryptJson(different, {}, { entityType: 'personal-prayer', ownerOrGroupId: userId, recordId: 'old-prayer', field: 'sensitive-payload' });
    lock();
    expect(await recoverWithPasskey(userId, enrolled.method.id)).toMatchObject({ ok: false, status: 'key_mismatch' });
    expect(isUnlocked()).toBe(false);
  });

  it.each(['passkey', 'emergency-code'])('never activates %s recovery for a wrong running key that cannot decrypt existing history', async (type) => {
    const historical = structuredClone(harness.prayer);
    await importRawMasterKey(toB64(crypto.getRandomValues(new Uint8Array(32))));
    let result;
    if (type === 'passkey') result = await enrollPasskeyRecovery(userId);
    else {
      const generated = await generateEmergencyRecovery(userId);
      result = await verifyEmergencyRecovery(userId, generated.method.id, generated.code);
    }
    expect(result).toMatchObject({ ok: false, status: 'key_mismatch' });
    expect([...harness.methods.values()].every((method) => method.status !== 'active')).toBe(true);
    expect(harness.prayer).toEqual(historical);
    expect(harness.requests.some((request) => ['verify', 'emergency-verify'].includes(request.action))).toBe(false);
  }, 30_000);
});

describe('protected-device migration and offline unlock', () => {
  it('accepts a synced legacy wrapper encoded as a JSON string with its actual revision', async () => {
    const passkey = await enrollPasskeyRecovery(userId);
    const code = await createVault('legacy synthetic passphrase');
    const record = JSON.parse(exportVaultRecord());
    record.revision = 17;
    harness.legacy = JSON.stringify(record);
    expect(await verifyLegacyRecoveryCode(userId, code)).toMatchObject({ ok: true });
    expect(await enableDeviceUnlock(userId, passkey.method.id)).toMatchObject({ ok: true, status: 'protected' });
  }, 30_000);

  it('binds a legacy proof to its full synced wrapper when old records have no revision metadata', async () => {
    const passkey = await enrollPasskeyRecovery(userId);
    const code = await createVault('legacy synthetic passphrase');
    const legacy = () => {
      const record = JSON.parse(exportVaultRecord());
      delete record.revision; delete record.updatedAt;
      return record;
    };
    harness.legacy = legacy();
    expect(await verifyLegacyRecoveryCode(userId, code)).toMatchObject({ ok: true });
    await rotateRecoveryCode();
    harness.legacy = legacy();
    expect(await enableDeviceUnlock(userId, passkey.method.id)).toMatchObject({ ok: false, status: 'verification_required' });
    expect(getDeviceProtectionPolicy(userId)).toBe('transparent');
  }, 30_000);

  it('requires independent recovery, removes raw copies and unlocks offline after flags are disabled', async () => {
    const passkey = await enrollPasskeyRecovery(userId);
    expect(await enableDeviceUnlock(userId, passkey.method.id)).toMatchObject({ ok: false, status: 'verification_required' });
    const emergency = await generateEmergencyRecovery(userId);
    await verifyEmergencyRecovery(userId, emergency.method.id, emergency.code);
    harness.store.set(`pfm_ak_${userId}`, 'synthetic-raw-copy');
    clearPrayerProtectionProofs();
    expect(await enableDeviceUnlock(userId, passkey.method.id, { emergencyCode: emergency.code, emergencyMethodId: emergency.method.id })).toMatchObject({ ok: true, status: 'protected' });
    expect((await getProtectionStatus(userId)).methods.find((method) => method.id === passkey.method.id).verifiedHere).toBe(true);
    expect(getDeviceProtectionPolicy(userId)).toBe('protected');
    expect(harness.store.has(`pfm_ak_${userId}`)).toBe(false);
    expect(sessionStorage.getItem(`pfm_vault_session:${userId}`)).toBeNull();
    expect(await revokeRecoveryMethod(userId, passkey.method.id)).toMatchObject({ ok: false, status: 'verification_required' });
    expect(await revokeRecoveryMethod(userId, emergency.method.id)).toMatchObject({ ok: false, status: 'verification_required' });
    lock(); vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'false'); navigator.onLine = false;
    expect(await unlockWithDevice(userId)).toMatchObject({ ok: true, status: 'unlocked' });
    expect(harness.store.has(`pfm_ak_${userId}`)).toBe(false);
    expect(sessionStorage.getItem(`pfm_vault_session:${userId}`)).toBeNull();
    expect(harness.store.get(`pfm_protected_device_v1:${userId}`).method.wrapper.kind).toBe('passkey-prf');
  }, 30_000);

  it('retains a fail-closed policy if raw-key cleanup fails and never reports migration complete', async () => {
    const passkey = await enrollPasskeyRecovery(userId);
    const emergency = await generateEmergencyRecovery(userId);
    await verifyEmergencyRecovery(userId, emergency.method.id, emergency.code);
    harness.failDelete = true;
    expect(await enableDeviceUnlock(userId, passkey.method.id)).toMatchObject({ ok: false, status: 'cleanup_incomplete' });
    expect(getDeviceProtectionPolicy(userId)).toBe('protected');
    expect(harness.store.has(`pfm_protected_device_v1:${userId}`)).toBe(true);
    expect(await getProtectionStatus(userId)).toMatchObject({ deviceProtected: false, deviceProtectionPending: true,
      deviceUnlockAvailable: true, deviceProtectionStatus: 'verification_required' });
  }, 30_000);

  it('continues listing existing recovery with enrollment flags disabled', async () => {
    await enrollPasskeyRecovery(userId);
    vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'false');
    const status = await getProtectionStatus(userId);
    expect(status.ok).toBe(true);
    expect(status.methods).toHaveLength(1);
    expect(status.capability).toMatchObject({ canEnroll: false, prf: 'unverified' });
    expect(await generateEmergencyRecovery(userId)).toMatchObject({ ok: false, status: 'disabled' });
    expect(fromBase64Url(status.methods[0].wrapper.iv)).toHaveLength(12);
  });
});

describe('serialized protection transitions', () => {
  async function ready() {
    const passkey = await enrollPasskeyRecovery(userId);
    const emergency = await generateEmergencyRecovery(userId);
    await verifyEmergencyRecovery(userId, emergency.method.id, emergency.code);
    return passkey.method;
  }

  it('queues disable behind an in-flight activation rather than deleting its new wrapper', async () => {
    const passkey = await ready();
    let release, entered;
    const gate = new Promise((resolve) => { release = resolve; });
    const started = new Promise((resolve) => { entered = resolve; });
    harness.onGet = () => { entered(); return gate; };
    const enabling = enableDeviceUnlock(userId, passkey.id);
    await started;
    let disabled = false;
    const disabling = disableDeviceUnlock(userId).then((result) => { disabled = true; return result; });
    await Promise.resolve(); await Promise.resolve();
    expect(disabled).toBe(false);
    release();
    expect(await enabling).toMatchObject({ ok: true, status: 'protected' });
    expect(await disabling).toMatchObject({ ok: true, status: 'transparent' });
    expect(getDeviceProtectionPolicy(userId)).toBe('transparent');
    expect(harness.store.has(`pfm_ak_${userId}`)).toBe(true);
    expect(harness.store.has(`pfm_protected_device_v1:${userId}`)).toBe(false);
  }, 30_000);

  it('queues activation behind a downgrade that is still persisting the transparent key', async () => {
    const passkey = await ready();
    expect((await enableDeviceUnlock(userId, passkey.id)).ok).toBe(true);
    expect(await rememberAccountKey(userId)).toBe(false);
    let release, entered;
    const gate = new Promise((resolve) => { release = resolve; });
    const started = new Promise((resolve) => { entered = resolve; });
    harness.onSet = (key) => { if (key === `pfm_ak_${userId}`) { entered(); return gate; } };
    const disabling = disableDeviceUnlock(userId);
    await started;
    expect(getDeviceProtectionPolicy(userId)).toBe('protected');
    let enabled = false;
    const enabling = enableDeviceUnlock(userId, passkey.id).then((result) => { enabled = true; return result; });
    await Promise.resolve(); await Promise.resolve();
    expect(enabled).toBe(false);
    release();
    expect(await disabling).toMatchObject({ ok: true, status: 'transparent' });
    expect(await enabling).toMatchObject({ ok: true, status: 'protected' });
    expect(getDeviceProtectionPolicy(userId)).toBe('protected');
    expect(harness.store.has(`pfm_ak_${userId}`)).toBe(false);
    expect(harness.store.get(`pfm_protected_device_v1:${userId}`).cleanupVerified).toBe(true);
  }, 30_000);

  it('cannot revoke the chosen local credential while its activation is waiting for device verification', async () => {
    const passkey = await ready();
    let release, entered;
    const gate = new Promise((resolve) => { release = resolve; });
    const started = new Promise((resolve) => { entered = resolve; });
    harness.onGet = () => { entered(); return gate; };
    const enabling = enableDeviceUnlock(userId, passkey.id);
    await started;
    const revoking = revokeRecoveryMethod(userId, passkey.id);
    release();
    expect((await enabling).ok).toBe(true);
    expect(await revoking).toMatchObject({ ok: false, status: 'verification_required' });
    expect(harness.methods.get(passkey.id).status).toBe('active');
  }, 30_000);

  it('fails closed without cross-tab locks and keeps already protected offline unlock available', async () => {
    const passkey = await ready();
    expect((await enableDeviceUnlock(userId, passkey.id)).ok).toBe(true);
    navigator.locks = undefined;
    expect(await disableDeviceUnlock(userId)).toMatchObject({ ok: false, status: 'unsupported' });
    expect(await enableDeviceUnlock(userId, passkey.id)).toMatchObject({ ok: false, status: 'unsupported' });
    expect(getDeviceProtectionPolicy(userId)).toBe('protected');
    lock(); navigator.onLine = false;
    expect((await unlockWithDevice(userId)).ok).toBe(true);
    expect(harness.store.has(`pfm_ak_${userId}`)).toBe(false);
  }, 30_000);

  it('rechecks independent backup state after a long device prompt before removing raw storage', async () => {
    const passkey = await ready();
    harness.store.set(`pfm_ak_${userId}`, 'original-raw-copy');
    harness.onGet = () => {
      const emergency = [...harness.methods.values()].find((method) => method.type === 'emergency-code');
      harness.methods.set(emergency.id, { ...emergency, revision: emergency.revision + 1 });
    };
    expect(await enableDeviceUnlock(userId, passkey.id)).toMatchObject({ ok: false, status: 'verification_required' });
    expect(getDeviceProtectionPolicy(userId)).toBe('transparent');
    expect(harness.store.get(`pfm_ak_${userId}`)).toBe('original-raw-copy');
  }, 30_000);

  it('restores the protected wrapper if raw storage disappears during downgrade readback', async () => {
    const passkey = await ready();
    expect((await enableDeviceUnlock(userId, passkey.id)).ok).toBe(true);
    const previous = structuredClone(harness.store.get(`pfm_protected_device_v1:${userId}`));
    harness.onDelete = (key) => {
      if (key === `pfm_protected_device_v1:${userId}`) harness.store.delete(`pfm_ak_${userId}`);
    };
    expect(await disableDeviceUnlock(userId)).toMatchObject({ ok: false, status: 'storage_unavailable' });
    expect(getDeviceProtectionPolicy(userId)).toBe('protected');
    expect(harness.store.get(`pfm_protected_device_v1:${userId}`)).toEqual(previous);
    expect(harness.store.has(`pfm_ak_${userId}`)).toBe(false);
    lock(); navigator.onLine = false;
    expect((await unlockWithDevice(userId)).ok).toBe(true);
  }, 30_000);

  it.each(['account switch', 'account deletion'])('does not remove protected policy or resurrect staged secrets on %s during downgrade', async (action) => {
    const passkey = await ready();
    expect((await enableDeviceUnlock(userId, passkey.id)).ok).toBe(true);
    let release, entered;
    const gate = new Promise((resolve) => { release = resolve; });
    const started = new Promise((resolve) => { entered = resolve; });
    harness.onSet = (key) => { if (key === `pfm_ak_${userId}`) { entered(); return gate; } };
    const disabling = disableDeviceUnlock(userId);
    await started;
    expect(getDeviceProtectionPolicy(userId)).toBe('protected');
    configureAccountContext(otherUserId);
    harness.currentUser = otherUserId;
    let deletion;
    if (action === 'account deletion') deletion = Promise.all([forgetAccountKey(userId), forgetProtectedDevice(userId)]);
    release();
    expect(await disabling).toMatchObject({ ok: false, status: 'stale_account' });
    if (deletion) await deletion;
    expect(harness.store.has(`pfm_ak_${userId}`)).toBe(false);
    expect(harness.store.has(`pfm_ak_${otherUserId}`)).toBe(false);
    expect(harness.store.has(`pfm_protected_device_v1:${userId}`)).toBe(action !== 'account deletion');
    expect(getDeviceProtectionPolicy(userId)).toBe(action === 'account deletion' ? 'transparent' : 'protected');
  }, 30_000);
});
