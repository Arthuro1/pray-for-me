import { randomUUID } from 'node:crypto';
import {
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { RecoveryError, requireUUID, validateWrapper, sanitizeWebAuthn, publicMethod, safeLabel } from './recoveryValidation.js';

const webauthnDefaults = { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse };
const ROW_RPCS = new Set(['create_recovery_method', 'create_recovery_challenge', 'consume_recovery_challenge',
  'commit_recovery_method', 'read_recovery_method', 'verify_recovery_method', 'revoke_recovery_method']);

function checkDb(result) {
  if (result.error) {
    // Never expose Postgres details: they can echo ciphertext/request input.
    if (result.error.code === '40001' || result.error.code === '23505') throw new RecoveryError('recovery_conflict', 409);
    if (result.error.code === 'P0002') throw new RecoveryError('recovery_not_found', 404);
    throw new RecoveryError('recovery_unavailable', 503);
  }
  return result.data;
}

export function createRecoveryService({ db, user, config, webauthn = webauthnDefaults }) {
  const userId = requireUUID(user.id);
  const rpc = async (name, values) => {
    const data = checkDb(await db.rpc(name, { p_user_id: userId, ...values }));
    // PostgREST table-valued/composite RPCs return arrays unless an object
    // representation was requested. Every recovery mutation returns at most
    // one owner-bound row; never silently choose one from an ambiguous result.
    if (ROW_RPCS.has(name) && Array.isArray(data)) {
      if (data.length > 1) throw new RecoveryError('recovery_unavailable', 503);
      return data[0] ?? null;
    }
    return data;
  };
  const readMethod = async methodId => {
    const method = checkDb(await db.from('account_key_recovery_methods').select('*').eq('id', requireUUID(methodId)).eq('user_id', userId).maybeSingle());
    if (!method || method.status === 'revoked') throw new RecoveryError('recovery_not_found', 404);
    return method;
  };
  const credentialFor = async method => {
    if (method.method_type !== 'passkey' || !method.credential_id) throw new RecoveryError('recovery_not_found', 404);
    const credential = checkDb(await db.from('account_recovery_credentials').select('*').eq('id', method.credential_id).eq('user_id', userId).eq('method_id', method.id).is('revoked_at', null).maybeSingle());
    if (!credential || credential.rp_id !== config.rpID) throw new RecoveryError('recovery_not_found', 404);
    return credential;
  };
  const describeMethod = async (method, credential) => {
    const value = publicMethod(method);
    if (method.method_type !== 'passkey' || !method.credential_id) return value;
    // Backup flags originate in verified authenticator data, not browser
    // extension results or client labels. Never return public-key material.
    const saved = credential || checkDb(await db.from('account_recovery_credentials')
      .select('id,method_id,rp_id,device_type,backed_up').eq('id', method.credential_id)
      .eq('user_id', userId).eq('method_id', method.id).is('revoked_at', null).maybeSingle());
    if (saved?.id === method.credential_id && saved.method_id === method.id && saved.rp_id === config.rpID) value.backupState = {
      eligible: saved.device_type === 'multiDevice', backedUp: saved.backed_up === true,
    };
    return value;
  };
  const challenge = async (method, operation, options) => {
    const row = await rpc('create_recovery_challenge', {
      p_method_id: method.id, p_operation: operation, p_challenge: options.challenge,
      p_origin: config.origin, p_rp_id: config.rpID, p_revision: method.revision,
    });
    return { challengeId: row.id, options };
  };
  const consume = async (body, operation) => {
    const row = await rpc('consume_recovery_challenge', {
      p_challenge_id: requireUUID(body.challengeId), p_method_id: requireUUID(body.methodId), p_operation: operation,
    });
    if (!row || row.origin !== config.origin || row.rp_id !== config.rpID) throw new RecoveryError('invalid_challenge', 409);
    return row;
  };
  const enroll = () => { if (!config.enrollment) throw new RecoveryError('enrollment_disabled', 403); };
  const expectedRevision = value => {
    if (!Number.isSafeInteger(value) || value < 0) throw new RecoveryError('invalid_request');
    return value;
  };

  return async function execute(body) {
    // Shared durable limits apply to all operations, including failed verifies.
    const allowed = await rpc('check_recovery_rate_limit', {});
    if (typeof allowed !== 'boolean') throw new RecoveryError('recovery_unavailable', 503);
    if (!allowed) throw new RecoveryError('rate_limit', 429);
    switch (body.action) {
      case 'list': {
        const methods = checkDb(await db.from('account_key_recovery_methods').select('*').eq('user_id', userId).neq('status', 'revoked').order('created_at', { ascending: false }));
        return { methods: await Promise.all(methods.map(method => describeMethod(method))) };
      }
      case 'register-options': {
        enroll();
        const method = await rpc('create_recovery_method', {
          p_method_id: randomUUID(), p_method_type: 'passkey', p_wrapper: null, p_label: safeLabel(body.label),
        });
        const existing = checkDb(await db.from('account_recovery_credentials').select('id,transports').eq('user_id', userId).is('revoked_at', null));
        const options = await webauthn.generateRegistrationOptions({
          rpName: 'Qetoret', rpID: config.rpID, userID: new TextEncoder().encode(userId),
          userName: userId, userDisplayName: 'Qetoret', attestationType: 'none',
          authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
          excludeCredentials: existing.map(item => ({ id: item.id, transports: item.transports })),
          extensions: { prf: {} }, timeout: 60000,
        });
        return { methodId: method.id, ...await challenge(method, 'register', options) };
      }
      case 'register-verify': {
        enroll();
        const method = await readMethod(body.methodId);
        if (method.revision !== 0 || method.status !== 'pending' || method.credential_id) throw new RecoveryError('recovery_conflict', 409);
        const pending = await consume(body, 'register');
        const response = sanitizeWebAuthn(body.response, true);
        let verification;
        try {
          verification = await webauthn.verifyRegistrationResponse({ response, expectedChallenge: pending.challenge,
            expectedOrigin: config.origin, expectedRPID: config.rpID, requireUserVerification: true });
        } catch { throw new RecoveryError('verification_failed'); }
        if (!verification.verified || !verification.registrationInfo?.userVerified) throw new RecoveryError('verification_failed');
        const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
        await rpc('register_recovery_credential', {
          p_method_id: method.id, p_challenge_id: pending.id, p_credential_id: credential.id,
          p_public_key: Buffer.from(credential.publicKey).toString('base64url'), p_counter: credential.counter,
          p_transports: credential.transports || [], p_device_type: credentialDeviceType,
          p_backed_up: credentialBackedUp, p_rp_id: config.rpID,
        });
        return { credentialId: credential.id, deviceType: credentialDeviceType, backedUp: credentialBackedUp };
      }
      case 'assert-options': {
        const method = await readMethod(body.methodId);
        const purpose = body.purpose;
        if (!['enroll', 'recover', 'verify'].includes(purpose)) throw new RecoveryError('invalid_request');
        if (purpose === 'enroll') { enroll(); if (method.revision !== 0) throw new RecoveryError('recovery_conflict', 409); }
        if (purpose === 'recover' && method.status !== 'active') throw new RecoveryError('recovery_not_verified', 409);
        if (purpose === 'verify' && !method.wrapper) throw new RecoveryError('recovery_not_verified', 409);
        const credential = await credentialFor(method);
        const options = await webauthn.generateAuthenticationOptions({
          rpID: config.rpID, userVerification: 'required', timeout: 60000,
          allowCredentials: [{ id: credential.id, transports: credential.transports }],
        });
        return { ...await challenge(method, purpose, options), method: await describeMethod(method, credential) };
      }
      case 'assert-verify': {
        const method = await readMethod(body.methodId);
        const credential = await credentialFor(method);
        const pending = await consume(body, 'assert');
        if (pending.operation === 'enroll') enroll();
        if (pending.operation === 'recover' && method.status !== 'active') throw new RecoveryError('recovery_not_verified', 409);
        if (pending.expected_revision !== method.revision || pending.credential_id !== credential.id) throw new RecoveryError('recovery_conflict', 409);
        const response = sanitizeWebAuthn(body.response, false);
        if (response.id !== credential.id || (response.response.userHandle && response.response.userHandle !== Buffer.from(userId).toString('base64url'))) {
          throw new RecoveryError('verification_failed');
        }
        let verification;
        try {
          verification = await webauthn.verifyAuthenticationResponse({ response, expectedChallenge: pending.challenge,
            expectedOrigin: config.origin, expectedRPID: config.rpID, requireUserVerification: true,
            credential: { id: credential.id, publicKey: new Uint8Array(Buffer.from(credential.public_key, 'base64url')),
              counter: credential.counter, transports: credential.transports } });
        } catch { throw new RecoveryError('verification_failed'); }
        const info = verification.authenticationInfo;
        if (!verification.verified || !info?.userVerified
          || !['singleDevice', 'multiDevice'].includes(info.credentialDeviceType)
          || typeof info.credentialBackedUp !== 'boolean'
          || info.credentialDeviceType !== credential.device_type
          || (info.credentialDeviceType === 'singleDevice' && info.credentialBackedUp)) {
          throw new RecoveryError('verification_failed');
        }
        await rpc('complete_recovery_assertion', { p_method_id: method.id, p_challenge_id: pending.id,
          p_old_counter: credential.counter, p_new_counter: info.newCounter,
          p_credential_revision: credential.revision });
        // Refresh mutable BS after the signed assertion. The counter RPC has
        // incremented this revision; a concurrent assertion or revocation makes
        // this guarded update fail instead of overwriting newer backup state.
        const refreshed = checkDb(await db.from('account_recovery_credentials')
          .update({ backed_up: info.credentialBackedUp }).eq('id', credential.id).eq('user_id', userId)
          .eq('method_id', method.id).eq('revision', credential.revision + 1)
          .eq('counter', info.newCounter).is('revoked_at', null)
          .select('id,method_id,rp_id,device_type,backed_up').maybeSingle());
        if (!refreshed) throw new RecoveryError('recovery_conflict', 409);
        const persisted = await readMethod(method.id);
        if (persisted.revision !== method.revision || persisted.credential_id !== credential.id || persisted.status !== method.status) {
          throw new RecoveryError('recovery_conflict', 409);
        }
        return { proofId: pending.id, method: await describeMethod(persisted, refreshed) };
      }
      case 'commit': {
        enroll();
        const method = await readMethod(body.methodId);
        const credential = await credentialFor(method);
        const wrapper = validateWrapper(body.wrapper, { userId, methodId: method.id, credentialId: credential.id, rpID: config.rpID, type: 'passkey' });
        const updated = await rpc('commit_recovery_method', { p_method_id: method.id,
          p_revision: expectedRevision(body.expectedRevision), p_proof_id: requireUUID(body.proofId), p_wrapper: wrapper });
        return { method: await describeMethod(updated) };
      }
      case 'emergency-create': {
        enroll();
        const methodId = requireUUID(body.methodId);
        const wrapper = validateWrapper(body.wrapper, { userId, methodId, type: 'emergency-code' });
        const method = await rpc('create_recovery_method', { p_method_id: methodId,
          p_method_type: 'emergency-code', p_wrapper: wrapper, p_label: safeLabel(body.label) });
        return { method: await describeMethod(method) };
      }
      case 'read': {
        const method = await rpc('read_recovery_method', { p_method_id: requireUUID(body.methodId) });
        return { method: await describeMethod(method) };
      }
      case 'verify':
      case 'emergency-verify': {
        const method = await readMethod(body.methodId);
        if (body.clientVerified !== true) throw new RecoveryError('client_verification_required');
        if ((body.action === 'verify') !== (method.method_type === 'passkey')) throw new RecoveryError('invalid_request');
        // This records client-reported key restoration; it is not server proof of
        // decrypting a key or of independent-device/provider recoverability.
        const updated = await rpc('verify_recovery_method', { p_method_id: method.id,
          p_revision: expectedRevision(body.expectedRevision),
          p_proof_id: method.method_type === 'passkey' ? requireUUID(body.proofId) : null });
        return { method: await describeMethod(updated) };
      }
      case 'revoke': {
        const method = await rpc('revoke_recovery_method', { p_method_id: requireUUID(body.methodId), p_revision: expectedRevision(body.expectedRevision) });
        return { method: await describeMethod(method) };
      }
      default: throw new RecoveryError('invalid_request');
    }
  };
}
