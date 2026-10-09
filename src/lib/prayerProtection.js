import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { supabase } from './supabase';
import { decryptJson } from './crypto/e2ee';
import { getMasterKey, isUnlocked, getLifecycleToken, isLifecycleCurrent, installCandidateMasterKey,
  getDeviceProtectionPolicy, setDeviceProtectionPolicy, generateRecoveryCode, normalizeRecoveryCode,
  verifyRecoveryCode, inspectVaultRecord, onLockChange } from './crypto/keyManager';
import { clearTransparentAccountKey, rememberAccountKey, disableProtectedAccountKey } from './crypto/accountKey';
import { ensureUserPublicKey } from './crypto/userKeys';
import { getPrayerProtectionCapabilities, prayerProtectionEnrollmentEnabled, isRecoveryOriginAllowed, getRecoveryRpId } from './prayerProtectionCapabilities';
import { decodeCreationOptions, decodeRequestOptions, extractPrfOutput, serializePublicKeyCredential,
  fromBase64Url, toBase64Url, validateRecoveryWrapper, verifySameAccountKey,
  wrapAccountKeyWithPrf, unwrapAccountKeyWithPrf, wrapAccountKeyWithEmergencyCode, unwrapAccountKeyWithEmergencyCode } from './crypto/passkeyRecovery';

const slot = (userId) => `pfm_protected_device_v1:${userId}`;
const PROOF_LIFETIME = 10 * 60 * 1000;
const emergencyProofs = new Map();
// Server activation records do not prove that THIS device has performed a
// recovery test. These session-only receipts contain no key material.
const methodProofs = new Map();
const methodProofSlot = (userId, methodId) => `${userId}:${methodId}`;
const online = () => globalThis.navigator?.onLine !== false;

function capture(userId, requireUnlocked = false) {
  const token = getLifecycleToken();
  if (!userId || token.accountId !== userId || !isLifecycleCurrent(token)) throw new Error('stale_account');
  if (requireUnlocked && !isUnlocked()) throw new Error('locked');
  return token;
}

function current(token) {
  if (!isLifecycleCurrent(token)) throw new Error('stale_account');
}

function rememberMethodProof(token, method) {
  current(token);
  if (method.userId === token.accountId && method.status === 'active') {
    methodProofs.set(methodProofSlot(token.accountId, method.id), { token, revision: method.revision });
  }
}

function withLocalVerification(method, userId) {
  const proof = methodProofs.get(methodProofSlot(userId, method.id));
  return { ...method, verifiedHere: !!proof && method.status === 'active'
    && method.userId === userId && proof.token.accountId === userId
    && proof.revision === method.revision && isLifecycleCurrent(proof.token) };
}

function failed(error) {
  const name = error?.name;
  const statuses = new Set(['stale_account', 'locked', 'disabled', 'unsupported', 'offline', 'cancelled', 'prf_unavailable',
    'invalid_wrapper', 'credential_mismatch', 'wrong_code', 'key_mismatch', 'no_history', 'no_recovery', 'verification_required',
    'cleanup_incomplete', 'storage_unavailable', 'sync_failed', 'server_error', 'revoked', 'invalid_code', 'authentication_required']);
  const status = name === 'NotAllowedError' || name === 'AbortError' ? 'cancelled'
    : name === 'NotSupportedError' ? 'unsupported'
      : statuses.has(error?.message) ? error.message : 'failed';
  return { ok: false, status, error: status };
}

async function outcome(action) {
  try { return await action(); } catch (error) { return failed(error); }
}

// Policy changes share IndexedDB/localStorage across tabs. A per-account Web
// Lock makes migration, downgrade and revocation one ordered transaction at
// the application boundary. An in-memory mutex would not protect other tabs.
function protectionTransition(userId, action) {
  return outcome(async () => {
    const token = capture(userId, true);
    if (typeof globalThis.navigator?.locks?.request !== 'function') throw new Error('unsupported');
    return navigator.locks.request(`qetoret:prayer-protection:${userId}`, { mode: 'exclusive' }, async () => {
      current(token);
      return action(token);
    });
  });
}

async function api(token, action, args = {}) {
  current(token);
  if (!online()) throw new Error('offline');
  const { data, error } = await supabase.auth.getSession();
  current(token);
  if (error || !data?.session?.access_token || data.session.user?.id !== token.accountId) throw new Error('authentication_required');
  const response = await fetch('/api/recovery', { method: 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ action, ...args }) });
  current(token);
  let result;
  try { result = await response.json(); } catch { throw new Error('server_error'); }
  current(token);
  if (!response.ok) throw new Error(response.status === 403 ? 'disabled' : 'server_error');
  return result;
}

function validateMethod(method, token, { active = false, type } = {}) {
  validateMethodMetadata(method, token);
  if ((type && method.type !== type) || (active && method.status !== 'active') || method.revision < 1) throw new Error('no_recovery');
  validateRecoveryWrapper(method.wrapper, { accountId: token.accountId, methodId: method.id, credentialId: method.credentialId });
  if ((method.type === 'passkey') !== (method.wrapper.kind === 'passkey-prf')) throw new Error('invalid_wrapper');
  return method;
}

function validateMethodMetadata(method, token) {
  if (!method || method.userId !== token.accountId || !['passkey', 'emergency-code'].includes(method.type)
    || !['pending', 'active'].includes(method.status) || !Number.isInteger(method.revision) || method.revision < 0) throw new Error('no_recovery');
  return method;
}

function requireEnrollment() {
  if (!prayerProtectionEnrollmentEnabled()) throw new Error('disabled');
  if (!isRecoveryOriginAllowed()) throw new Error('unsupported');
}

async function requireWebAuthn() {
  const capability = await getPrayerProtectionCapabilities();
  if (!capability.webAuthn || !capability.originAllowed) throw new Error('unsupported');
}

async function makeAssertion(token, method, purpose) {
  await requireWebAuthn();
  current(token);
  const challenge = await api(token, 'assert-options', { methodId: method.id, purpose });
  current(token);
  const persisted = challenge.method ? validateMethod(challenge.method, token, { type: 'passkey' }) : method;
  const options = decodeRequestOptions(challenge.options);
  if (options.rpId !== getRecoveryRpId()) throw new Error('unsupported');
  options.extensions = { prf: { eval: { first: fromBase64Url(persisted.wrapper.prfSalt, 32) } } };
  const credential = await navigator.credentials.get({ publicKey: options });
  current(token);
  if (!credential) throw new Error('cancelled');
  const output = extractPrfOutput(credential, persisted.credentialId);
  try {
    const verified = await api(token, 'assert-verify', { methodId: method.id, challengeId: challenge.challengeId,
      response: serializePublicKeyCredential(credential) });
    current(token);
    return { output, proofId: verified.proofId, method: persisted };
  } catch (error) { output.fill(0); throw error; }
}

async function readMethod(token, methodId, options) {
  const { method } = await api(token, 'read', { methodId });
  return options?.metadataOnly ? validateMethodMetadata(method, token) : validateMethod(method, token, options);
}

async function sameRunningKey(token, original, candidate) {
  const valid = await verifySameAccountKey(original, candidate);
  current(token);
  if (!valid || !isUnlocked() || getMasterKey() !== original) throw new Error('key_mismatch');
  // A usable wrapper for a corrupted running key is not a usable backup.
  // Prove the candidate opens existing account ciphertext before activation.
  if (!await verifyHistoricalAccountKey(token.accountId, candidate, token)) throw new Error('key_mismatch');
  current(token);
  if (!isUnlocked() || getMasterKey() !== original) throw new Error('key_mismatch');
}

// Check both the existing encrypted identity (which protects group access)
// and a historical prayer directly with the candidate when present; this
// never installs a speculative key or invokes a cache-mutating store action.
export async function verifyHistoricalAccountKey(userId, candidate, token = capture(userId)) {
  current(token);
  const [identity, prayer] = await Promise.all([
    supabase.from('user_crypto_keys').select('encrypted_private_key').eq('user_id', userId).maybeSingle(),
    supabase.from('prayers').select('id,user_id,key_version,encrypted_payload')
      .eq('user_id', userId).not('encrypted_payload', 'is', null).limit(1).maybeSingle(),
  ]);
  current(token);
  if (identity.error || prayer.error) throw new Error('sync_failed');
  if (!identity.data?.encrypted_private_key && !prayer.data) throw new Error('no_history');
  if (identity.data?.encrypted_private_key) {
    try {
      const encoded = await decryptJson(candidate, identity.data.encrypted_private_key, {
        entityType: 'user-identity-key', ownerOrGroupId: userId, recordId: userId, keyVersion: 1, field: 'encrypted-private-key',
      });
      const binary = atob(encoded);
      await crypto.subtle.importKey('pkcs8', Uint8Array.from(binary, (char) => char.charCodeAt(0)), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
      current(token);
    } catch { current(token); return false; }
  }
  if (!prayer.data) return true;
  try {
    const row = prayer.data;
    await decryptJson(candidate, row.encrypted_payload, { entityType: 'personal-prayer', ownerOrGroupId: userId,
      recordId: row.id, keyVersion: row.key_version || 1, field: 'sensitive-payload' });
    current(token);
    return true;
  } catch { current(token); return false; }
}

async function installRecovered(token, candidate) {
  const installed = await installCandidateMasterKey(candidate, { token,
    verifyCandidate: (key) => verifyHistoricalAccountKey(token.accountId, key, token) });
  current(token);
  if (!installed) throw new Error('key_mismatch');
  if (getDeviceProtectionPolicy(token.accountId) === 'transparent') await rememberAccountKey(token.accountId, { clearLock: true });
  current(token);
}

export async function getProtectionStatus(userId) {
  const capability = await getPrayerProtectionCapabilities();
  const policy = getDeviceProtectionPolicy(userId);
  let local = null;
  let cleanupVerified = false;
  const result = await outcome(async () => {
    const token = capture(userId);
    const [localRecord, rawDeviceCopy] = await Promise.all([idbGet(slot(userId)), idbGet(`pfm_ak_${userId}`)]);
    local = localRecord;
    current(token);
    if (local?.version !== 1 || local.accountId !== userId) local = null;
    if (local) {
      try { validateMethod(local.method, token, { active: true, type: 'passkey' }); }
      catch { local = null; }
    }
    try {
      cleanupVerified = local?.cleanupVerified === true && rawDeviceCopy == null
        && globalThis.sessionStorage?.getItem('pfm_vault_session') == null
        && globalThis.sessionStorage?.getItem(`pfm_vault_session:${userId}`) == null;
    } catch { cleanupVerified = false; }
    const { methods = [] } = await api(token, 'list');
    const legacyRecord = await supabase.from('vault_keys').select('record').eq('user_id', userId).maybeSingle();
    current(token);
    const proof = emergencyProofs.get(userId);
    const legacy = { available: !legacyRecord.error && !!inspectVaultRecord(legacyRecord.data?.record),
      verifiedHere: proof?.methodId === 'legacy' && isLifecycleCurrent(proof.token) && Date.now() - proof.verifiedAt < PROOF_LIFETIME };
    return { ok: true, status: 'ready', methods: methods.filter((method) => method.userId === userId)
      .map((method) => withLocalVerification(method, userId)),
      protectionPolicy: policy, capability, legacy,
      localMethodId: local?.method?.id ?? null };
  });
  return { methods: [], deviceProtected: policy === 'protected' && cleanupVerified,
    deviceProtectionPending: policy === 'unknown' || (policy === 'protected' && !cleanupVerified),
    deviceUnlockAvailable: policy === 'protected' && !!local, protectionPolicy: policy, capability,
    localAvailable: !!local, localMethodId: local?.method?.id ?? null,
    deviceProtectionStatus: policy === 'transparent' ? 'transparent' : policy === 'protected' && cleanupVerified ? 'protected' : local ? 'verification_required' : 'recovery_required', ...result };
}

export async function enrollPasskeyRecovery(userId, { label } = {}) {
  return outcome(async () => {
    requireEnrollment();
    const token = capture(userId, true);
    const original = getMasterKey();
    await requireWebAuthn();
    current(token);
    if (!await ensureUserPublicKey(userId)) throw new Error('sync_failed');
    current(token);
    const registration = await api(token, 'register-options');
    const options = decodeCreationOptions(registration.options);
    if (options.rp?.id !== getRecoveryRpId()) throw new Error('unsupported');
    options.authenticatorSelection = { ...options.authenticatorSelection, userVerification: 'required' };
    options.extensions = { prf: {} };
    const credential = await navigator.credentials.create({ publicKey: options });
    current(token);
    if (!credential) throw new Error('cancelled');
    const registered = await api(token, 'register-verify', { methodId: registration.methodId, challengeId: registration.challengeId,
      response: serializePublicKeyCredential(credential) });
    const prfSalt = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
    // PRF support must be demonstrated by an assertion, not registration's
    // optional enabled flag. Enrollment uses a fresh server challenge.
    const challenge = await api(token, 'assert-options', { methodId: registration.methodId, purpose: 'enroll' });
    const request = decodeRequestOptions(challenge.options);
    if (request.rpId !== getRecoveryRpId()) throw new Error('unsupported');
    request.extensions = { prf: { eval: { first: fromBase64Url(prfSalt, 32) } } };
    const assertion = await navigator.credentials.get({ publicKey: request });
    current(token);
    if (!assertion) throw new Error('cancelled');
    const output = extractPrfOutput(assertion, registered.credentialId);
    let wrapper;
    let proof;
    try {
      proof = await api(token, 'assert-verify', { methodId: registration.methodId, challengeId: challenge.challengeId,
        response: serializePublicKeyCredential(assertion) });
      wrapper = await wrapAccountKeyWithPrf(original, output, { accountId: userId, methodId: registration.methodId,
        credentialId: registered.credentialId, prfSalt });
    } finally { output.fill(0); }
    current(token);
    if (!isUnlocked() || getMasterKey() !== original) throw new Error('key_mismatch');
    const { method } = await api(token, 'commit', { methodId: registration.methodId, expectedRevision: 0, proofId: proof.proofId, wrapper, label });
    validateMethod(method, token, { type: 'passkey' });
    return verifyPasskeyRecovery(userId, method.id, token, original);
  });
}

export async function verifyPasskeyRecovery(userId, methodId, existingToken, existingKey) {
  return outcome(async () => {
    const token = existingToken || capture(userId, true);
    current(token);
    const original = existingKey || getMasterKey();
    const method = await readMethod(token, methodId, { type: 'passkey' });
    const asserted = await makeAssertion(token, method, 'verify');
    let candidate;
    try { candidate = await unwrapAccountKeyWithPrf(asserted.method.wrapper, asserted.output, { accountId: userId, methodId, credentialId: method.credentialId }); }
    finally { asserted.output.fill(0); }
    await sameRunningKey(token, original, candidate);
    const verified = await api(token, 'verify', { methodId, expectedRevision: asserted.method.revision, proofId: asserted.proofId, clientVerified: true });
    validateMethod(verified.method, token, { active: true, type: 'passkey' });
    rememberMethodProof(token, verified.method);
    return { ok: true, status: 'verified_current_device', method: verified.method };
  });
}

export async function recoverWithPasskey(userId, methodId) {
  return outcome(async () => {
    const token = capture(userId);
    const method = await readMethod(token, methodId, { active: true, type: 'passkey' });
    const asserted = await makeAssertion(token, method, 'recover');
    let candidate;
    try { candidate = await unwrapAccountKeyWithPrf(asserted.method.wrapper, asserted.output, { accountId: userId, methodId, credentialId: method.credentialId }); }
    finally { asserted.output.fill(0); }
    await installRecovered(token, candidate);
    rememberMethodProof(token, asserted.method);
    return { ok: true, status: 'recovered', method: asserted.method };
  });
}

export async function generateEmergencyRecovery(userId, { label } = {}) {
  return outcome(async () => {
    requireEnrollment();
    const token = capture(userId, true);
    const original = getMasterKey();
    if (!await ensureUserPublicKey(userId)) throw new Error('sync_failed');
    current(token);
    const code = generateRecoveryCode();
    const methodId = crypto.randomUUID();
    const wrapper = await wrapAccountKeyWithEmergencyCode(original, normalizeRecoveryCode(code), { accountId: userId, methodId });
    current(token);
    if (!isUnlocked() || getMasterKey() !== original) throw new Error('key_mismatch');
    await api(token, 'emergency-create', { methodId, wrapper, label });
    const method = await readMethod(token, methodId, { type: 'emergency-code' });
    // Successful upload is not completion: the UI must ask the person to enter
    // the saved code in a separate step before calling verifyEmergencyRecovery.
    return { ok: true, status: 'verification_required', code, method };
  });
}

function rememberEmergencyProof(token, methodId, revision, key, legacyJson) {
  emergencyProofs.set(token.accountId, { token, methodId, revision, key, legacyJson, verifiedAt: Date.now() });
}

export async function verifyEmergencyRecovery(userId, methodId, code) {
  return outcome(async () => {
    const token = capture(userId, true);
    const original = getMasterKey();
    const method = await readMethod(token, methodId, { type: 'emergency-code' });
    let candidate;
    try { candidate = await unwrapAccountKeyWithEmergencyCode(method.wrapper, normalizeRecoveryCode(code), { accountId: userId, methodId }); }
    catch { throw new Error('wrong_code'); }
    await sameRunningKey(token, original, candidate);
    const verified = method.status === 'active' ? { method } : await api(token, 'emergency-verify', { methodId, expectedRevision: method.revision, clientVerified: true });
    validateMethod(verified.method, token, { active: true, type: 'emergency-code' });
    rememberEmergencyProof(token, methodId, verified.method.revision, original);
    rememberMethodProof(token, verified.method);
    return { ok: true, status: 'verified', method: verified.method };
  });
}

export async function recoverWithEmergencyCode(userId, methodId, code) {
  return outcome(async () => {
    const token = capture(userId);
    const method = await readMethod(token, methodId, { active: true, type: 'emergency-code' });
    let candidate;
    try { candidate = await unwrapAccountKeyWithEmergencyCode(method.wrapper, normalizeRecoveryCode(code), { accountId: userId, methodId }); }
    catch { throw new Error('wrong_code'); }
    await installRecovered(token, candidate);
    rememberEmergencyProof(token, methodId, method.revision, candidate);
    rememberMethodProof(token, method);
    return { ok: true, status: 'recovered', method };
  });
}

export async function verifyLegacyRecoveryCode(userId, code) {
  return outcome(async () => {
    const token = capture(userId, true);
    const original = getMasterKey();
    const { data, error } = await supabase.from('vault_keys').select('record').eq('user_id', userId).maybeSingle();
    current(token);
    const metadata = inspectVaultRecord(data?.record);
    if (error || !metadata) throw new Error('sync_failed');
    if (!await verifyRecoveryCode(code, data.record)) throw new Error('wrong_code');
    current(token);
    if (!isUnlocked() || getMasterKey() !== original) throw new Error('key_mismatch');
    rememberEmergencyProof(token, 'legacy', metadata.revision, original, metadata.json);
    return { ok: true, status: 'verified' };
  });
}

async function checkIndependentRecovery(token, { emergencyCode, emergencyMethodId } = {}) {
  if (emergencyCode) {
    const prior = emergencyProofs.get(token.accountId);
    const methodId = emergencyMethodId || (prior?.methodId !== 'legacy' ? prior?.methodId : null);
    const checked = methodId ? await verifyEmergencyRecovery(token.accountId, methodId, emergencyCode)
      : await verifyLegacyRecoveryCode(token.accountId, emergencyCode);
    if (!checked.ok) throw new Error(checked.status);
  }
  const proof = emergencyProofs.get(token.accountId);
  if (!proof || !isLifecycleCurrent(proof.token) || proof.key !== getMasterKey() || Date.now() - proof.verifiedAt > PROOF_LIFETIME) throw new Error('verification_required');
  if (proof.methodId !== 'legacy') {
    const method = await readMethod(token, proof.methodId, { active: true, type: 'emergency-code' });
    if (method.revision !== proof.revision) throw new Error('verification_required');
  } else {
    const legacy = await supabase.from('vault_keys').select('record').eq('user_id', token.accountId).maybeSingle();
    current(token);
    const metadata = inspectVaultRecord(legacy.data?.record);
    if (legacy.error || !metadata || metadata.revision !== proof.revision || metadata.json !== proof.legacyJson) throw new Error('verification_required');
  }
  current(token);
  if (proof.key !== getMasterKey()) throw new Error('verification_required');
}

export async function enableDeviceUnlock(userId, methodId, recovery = {}) {
  return protectionTransition(userId, async (token) => {
    requireEnrollment();
    await checkIndependentRecovery(token, recovery);
    const original = getMasterKey();
    const method = await readMethod(token, methodId, { active: true, type: 'passkey' });
    const asserted = await makeAssertion(token, method, 'verify');
    let candidate;
    try { candidate = await unwrapAccountKeyWithPrf(asserted.method.wrapper, asserted.output, { accountId: userId, methodId, credentialId: method.credentialId }); }
    finally { asserted.output.fill(0); }
    await sameRunningKey(token, original, candidate);
    // Store ciphertext only. The local witness makes offline unlock prove the
    // candidate against this device's original key before installation.
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const witness = await crypto.subtle.encrypt({ name: 'AES-GCM', iv,
      additionalData: new TextEncoder().encode(JSON.stringify(['qetoret/device-unlock', 1, userId, methodId])) }, original, challenge);
    const local = { version: 1, accountId: userId, cleanupVerified: false, method: asserted.method, witness: { iv: toBase64Url(iv), ciphertext: toBase64Url(witness),
      // Hashing a random challenge allows checking plaintext without storing it.
      digest: toBase64Url(await crypto.subtle.digest('SHA-256', challenge)) } };
    current(token);
    await idbSet(slot(userId), local);
    current(token);
    const readback = await idbGet(slot(userId));
    current(token);
    if (JSON.stringify(readback) !== JSON.stringify(local)) throw new Error('storage_unavailable');
    // The OS prompt may have stayed open while another device changed the
    // backup. Re-read the independent route before removing raw device copies.
    await checkIndependentRecovery(token, recovery);
    await sameRunningKey(token, original, candidate);
    if (!setDeviceProtectionPolicy(userId, true)) throw new Error('storage_unavailable');
    const cleaned = await clearTransparentAccountKey(userId);
    current(token);
    if (!cleaned) throw new Error('cleanup_incomplete');
    const completed = { ...local, cleanupVerified: true };
    await idbSet(slot(userId), completed);
    current(token);
    if (JSON.stringify(await idbGet(slot(userId))) !== JSON.stringify(completed)) throw new Error('cleanup_incomplete');
    current(token);
    if (getDeviceProtectionPolicy(userId) !== 'protected' || await idbGet(`pfm_ak_${userId}`) != null) throw new Error('cleanup_incomplete');
    current(token);
    rememberMethodProof(token, asserted.method);
    return { ok: true, status: 'protected', method };
  });
}

async function verifyLocalWitness(candidate, local) {
  try {
    fromBase64Url(local.witness.digest, 32);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64Url(local.witness.iv, 12),
      additionalData: new TextEncoder().encode(JSON.stringify(['qetoret/device-unlock', 1, local.accountId, local.method.id])) }, candidate,
    fromBase64Url(local.witness.ciphertext, 48));
    return toBase64Url(await crypto.subtle.digest('SHA-256', plaintext)) === local.witness.digest;
  } catch { return false; }
}

export async function unlockWithDevice(userId) {
  return outcome(async () => {
    const token = capture(userId);
    if (getDeviceProtectionPolicy(userId) !== 'protected') throw new Error('no_recovery');
    await requireWebAuthn();
    current(token);
    const local = await idbGet(slot(userId));
    current(token);
    if (local?.version !== 1 || local.accountId !== userId) throw new Error('no_recovery');
    const method = validateMethod(local.method, token, { active: true, type: 'passkey' });
    // Online unlock checks current revocation state. Offline access uses this
    // device's previously verified encrypted wrapper; revocation cannot erase
    // secrets or permissions from a device that remains disconnected.
    let output;
    if (online()) {
      const remote = await readMethod(token, method.id, { active: true, type: 'passkey' });
      const asserted = await makeAssertion(token, remote, 'verify');
      output = asserted.output;
    } else {
      const credential = await navigator.credentials.get({ publicKey: { rpId: method.wrapper.rpId,
        challenge: crypto.getRandomValues(new Uint8Array(32)), userVerification: 'required',
        allowCredentials: [{ type: 'public-key', id: fromBase64Url(method.credentialId) }],
        extensions: { prf: { eval: { first: fromBase64Url(method.wrapper.prfSalt, 32) } } } } });
      current(token);
      if (!credential) throw new Error('cancelled');
      output = extractPrfOutput(credential, method.credentialId);
    }
    let candidate;
    try { candidate = await unwrapAccountKeyWithPrf(method.wrapper, output, { accountId: userId, methodId: method.id, credentialId: method.credentialId }); }
    finally { output.fill(0); }
    const installed = await installCandidateMasterKey(candidate, { token, verifyCandidate: (key) => verifyLocalWitness(key, local) });
    current(token);
    if (!installed) throw new Error('key_mismatch');
    return { ok: true, status: 'unlocked', method };
  });
}

export async function disableDeviceUnlock(userId) {
  return protectionTransition(userId, async (token) => {
    const protectedBefore = getDeviceProtectionPolicy(userId) !== 'transparent';
    const previous = await idbGet(slot(userId));
    current(token);
    try {
      if (getDeviceProtectionPolicy(userId) === 'unknown') throw new Error('storage_unavailable');
      const remembered = protectedBefore ? await disableProtectedAccountKey(userId, { token })
        : await rememberAccountKey(userId, { clearLock: true });
      current(token);
      if (!remembered) throw new Error('storage_unavailable');
      await idbDel(slot(userId));
      current(token);
      const [raw, local] = await Promise.all([idbGet(`pfm_ak_${userId}`), idbGet(slot(userId))]);
      current(token);
      if (getDeviceProtectionPolicy(userId) !== 'transparent' || !raw || local != null) throw new Error('storage_unavailable');
      return { ok: true, status: 'transparent' };
    } catch (error) {
      if (protectedBefore && isLifecycleCurrent(token)) {
        // A late write/readback failure must not turn a failed downgrade into
        // transparent access or discard the encrypted offline recovery copy.
        setDeviceProtectionPolicy(userId, true);
        try {
          if (previous) await idbSet(slot(userId), previous);
          await clearTransparentAccountKey(userId);
        } catch { /* The protected marker continues to block raw restore. */ }
      }
      throw error;
    }
  });
}

export async function revokeRecoveryMethod(userId, methodId) {
  return protectionTransition(userId, async (token) => {
    const local = await idbGet(slot(userId));
    current(token);
    if (getDeviceProtectionPolicy(userId) !== 'transparent' && local?.method?.id === methodId) throw new Error('verification_required');
    const method = await readMethod(token, methodId, { metadataOnly: true });
    if (getDeviceProtectionPolicy(userId) !== 'transparent' && method.type === 'emergency-code') {
      const { methods = [] } = await api(token, 'list');
      if (!methods.some((item) => item.id !== methodId && item.type === 'emergency-code' && item.status === 'active')) throw new Error('verification_required');
    }
    await api(token, 'revoke', { methodId, expectedRevision: method.revision });
    current(token);
    const proof = emergencyProofs.get(userId);
    if (proof?.methodId === methodId) emergencyProofs.delete(userId);
    methodProofs.delete(methodProofSlot(userId, methodId));
    // This reports revocation for online recovery, not retroactive destruction
    // of keys already recovered or local copies on disconnected devices.
    return { ok: true, status: 'revoked' };
  });
}

// Kept separate so sign-out/account deletion may clear ephemeral verification
// without deleting a protected device's only offline encrypted wrapper.
export function clearPrayerProtectionProofs() {
  emergencyProofs.clear();
  methodProofs.clear();
}

// Lifecycle tokens stop stale operations; clear retained CryptoKey references
// as well so a lock/sign-out actually releases the emergency-test key.
onLockChange((unlocked) => { if (!unlocked) clearPrayerProtectionProofs(); });

export async function forgetProtectedDevice(userId) {
  if (!userId) return;
  emergencyProofs.delete(userId);
  for (const [key, proof] of methodProofs) {
    if (proof.token.accountId === userId) methodProofs.delete(key);
  }
  await idbDel(slot(userId));
}
