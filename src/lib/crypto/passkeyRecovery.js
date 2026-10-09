// Recovery wrappers are independent of the legacy vault record. Neither a
// WebAuthn assertion nor account sign-in is itself proof of encryption access.
// Every recovered candidate must be verified before the key manager installs it.
import { getRecoveryRpId } from '../prayerProtectionCapabilities';

export const RECOVERY_WRAPPER_VERSION = 1;
export const EMERGENCY_ITERATIONS = 600_000;
const DOMAIN = 'qetoret/account-recovery';
const encoder = new TextEncoder();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function toBase64Url(value) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(value, expectedLength) {
  if (typeof value !== 'string' || !value || value.length > 8192 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('invalid_wrapper');
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  if (toBase64Url(bytes) !== value || (expectedLength !== undefined && bytes.length !== expectedLength)) throw new Error('invalid_wrapper');
  return bytes;
}

function contextFields(record) {
  const fields = [DOMAIN, record.version, record.kind, record.accountId, record.methodId];
  return record.kind === 'passkey-prf'
    ? [...fields, record.credentialId, record.rpId, record.prfSalt, record.hkdfSalt]
    : [...fields, record.salt, record.iterations];
}

export function validateRecoveryWrapper(record, { accountId, methodId, credentialId } = {}) {
  if (!record || typeof record !== 'object' || Array.isArray(record)
    || record.version !== RECOVERY_WRAPPER_VERSION || !UUID.test(record.accountId || '') || !UUID.test(record.methodId || '')
    || (accountId && record.accountId !== accountId) || (methodId && record.methodId !== methodId)) throw new Error('invalid_wrapper');
  const common = ['version', 'kind', 'accountId', 'methodId', 'iv', 'ciphertext'];
  if (record.kind === 'passkey-prf') {
    common.push('credentialId', 'rpId', 'prfSalt', 'hkdfSalt');
    if (record.rpId !== getRecoveryRpId() || (credentialId && record.credentialId !== credentialId)) throw new Error('invalid_wrapper');
    const credential = fromBase64Url(record.credentialId);
    if (!credential.length || credential.length > 1024) throw new Error('invalid_wrapper');
    fromBase64Url(record.prfSalt, 32);
    fromBase64Url(record.hkdfSalt, 32);
  } else if (record.kind === 'emergency-code') {
    common.push('salt', 'iterations');
    if (record.iterations !== EMERGENCY_ITERATIONS) throw new Error('invalid_wrapper');
    fromBase64Url(record.salt, 32);
  } else throw new Error('invalid_wrapper');
  if (Object.keys(record).some((field) => !common.includes(field)) || Object.keys(record).length !== common.length) throw new Error('invalid_wrapper');
  fromBase64Url(record.iv, 12);
  fromBase64Url(record.ciphertext, 48);
  return record;
}

function additionalData(record) { return encoder.encode(JSON.stringify(contextFields(record))); }

async function passkeyWrappingKey(prfOutput, record) {
  const bytes = prfOutput instanceof Uint8Array ? prfOutput : new Uint8Array(prfOutput);
  if (bytes.length !== 32) throw new Error('prf_unavailable');
  const input = await crypto.subtle.importKey('raw', bytes, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: fromBase64Url(record.hkdfSalt, 32), info: additionalData(record) }, input, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function emergencyWrappingKey(normalizedCode, record) {
  if (typeof normalizedCode !== 'string' || !/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/.test(normalizedCode)) throw new Error('invalid_code');
  const input = await crypto.subtle.importKey('raw', encoder.encode(normalizedCode), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: fromBase64Url(record.salt, 32), iterations: record.iterations }, input, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function wrap(key, record, wrappingKey) {
  let bytes;
  try {
    bytes = new Uint8Array(await crypto.subtle.exportKey('raw', key));
    if (bytes.length !== 32) throw new Error('invalid_account_key');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: additionalData(record) }, wrappingKey, bytes);
    return validateRecoveryWrapper({ ...record, iv: toBase64Url(iv), ciphertext: toBase64Url(ciphertext) });
  } finally { bytes?.fill(0); }
}

async function unwrap(record, wrappingKey) {
  let bytes;
  try {
    bytes = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64Url(record.iv, 12), additionalData: additionalData(record) }, wrappingKey, fromBase64Url(record.ciphertext, 48)));
    if (bytes.length !== 32) throw new Error('invalid_account_key');
    return await crypto.subtle.importKey('raw', bytes, 'AES-GCM', true, ['encrypt', 'decrypt']);
  } finally { bytes?.fill(0); }
}

export async function wrapAccountKeyWithPrf(key, prfOutput, { accountId, methodId, credentialId, prfSalt }) {
  const record = { version: 1, kind: 'passkey-prf', accountId, methodId, credentialId, rpId: getRecoveryRpId(),
    prfSalt, hkdfSalt: toBase64Url(crypto.getRandomValues(new Uint8Array(32))) };
  // Validate metadata before exporting any account key.
  validateRecoveryWrapper({ ...record, iv: toBase64Url(new Uint8Array(12)), ciphertext: toBase64Url(new Uint8Array(48)) });
  return wrap(key, record, await passkeyWrappingKey(prfOutput, record));
}

export async function unwrapAccountKeyWithPrf(record, prfOutput, expected) {
  validateRecoveryWrapper(record, expected);
  if (record.kind !== 'passkey-prf') throw new Error('invalid_wrapper');
  return unwrap(record, await passkeyWrappingKey(prfOutput, record));
}

export async function wrapAccountKeyWithEmergencyCode(key, normalizedCode, { accountId, methodId }) {
  const record = { version: 1, kind: 'emergency-code', accountId, methodId,
    salt: toBase64Url(crypto.getRandomValues(new Uint8Array(32))), iterations: EMERGENCY_ITERATIONS };
  validateRecoveryWrapper({ ...record, iv: toBase64Url(new Uint8Array(12)), ciphertext: toBase64Url(new Uint8Array(48)) });
  return wrap(key, record, await emergencyWrappingKey(normalizedCode, record));
}

export async function unwrapAccountKeyWithEmergencyCode(record, normalizedCode, expected) {
  validateRecoveryWrapper(record, expected);
  if (record.kind !== 'emergency-code') throw new Error('invalid_wrapper');
  return unwrap(record, await emergencyWrappingKey(normalizedCode, record));
}

export async function verifySameAccountKey(current, candidate) {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, current, challenge);
    const recovered = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, candidate, encrypted));
    return recovered.length === challenge.length && recovered.every((byte, index) => byte === challenge[index]);
  } catch { return false; }
}

// Explicit serialization prevents extension results (including PRF output)
// leaking into the server request through credential.toJSON().
export function serializePublicKeyCredential(credential) {
  const response = credential?.response;
  if (!credential?.rawId || !response?.clientDataJSON) throw new Error('invalid_credential');
  const serialized = { id: toBase64Url(credential.rawId), rawId: toBase64Url(credential.rawId), type: 'public-key',
    response: { clientDataJSON: toBase64Url(response.clientDataJSON) }, clientExtensionResults: {} };
  if (response.attestationObject) {
    serialized.response.attestationObject = toBase64Url(response.attestationObject);
    serialized.response.transports = response.getTransports?.() || [];
    if (credential.authenticatorAttachment) serialized.authenticatorAttachment = credential.authenticatorAttachment;
  } else {
    if (!response.authenticatorData || !response.signature) throw new Error('invalid_credential');
    serialized.response.authenticatorData = toBase64Url(response.authenticatorData);
    serialized.response.signature = toBase64Url(response.signature);
    serialized.response.userHandle = response.userHandle ? toBase64Url(response.userHandle) : null;
  }
  return serialized;
}

export function extractPrfOutput(credential, expectedCredentialId) {
  if (expectedCredentialId && toBase64Url(credential?.rawId) !== expectedCredentialId) throw new Error('credential_mismatch');
  const value = credential?.getClientExtensionResults?.()?.prf?.results?.first;
  const bytes = value ? new Uint8Array(value) : null;
  if (!bytes || bytes.length !== 32) throw new Error('prf_unavailable');
  return bytes;
}

export function decodeCreationOptions(options) {
  return { ...options, challenge: fromBase64Url(options.challenge), user: { ...options.user, id: fromBase64Url(options.user.id) },
    excludeCredentials: options.excludeCredentials?.map((item) => ({ ...item, id: fromBase64Url(item.id) })) };
}

export function decodeRequestOptions(options) {
  return { ...options, challenge: fromBase64Url(options.challenge),
    allowCredentials: options.allowCredentials?.map((item) => ({ ...item, id: fromBase64Url(item.id) })), userVerification: 'required' };
}
