// Public ciphertext/parameters only. PRF results and emergency codes never cross
// this boundary. Do not log validation inputs or authenticator responses.
export class RecoveryError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function requireUUID(value) {
  if (typeof value !== 'string' || !UUID.test(value)) throw new RecoveryError('invalid_request');
  return value;
}

export function base64url(value, minBytes, maxBytes = minBytes) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value) || value.length > Math.ceil(maxBytes * 4 / 3)) {
    throw new RecoveryError('invalid_request');
  }
  const bytes = Buffer.from(value, 'base64url');
  if (bytes.length < minBytes || bytes.length > maxBytes || bytes.toString('base64url') !== value) {
    throw new RecoveryError('invalid_request');
  }
  return value;
}

export function recoveryConfig(env) {
  // Neither request Host nor forwarded headers establish a trusted RP/origin.
  if (env.NODE_ENV !== 'production' && env.RECOVERY_ALLOW_LOCALHOST === 'true') {
    const origin = env.RECOVERY_LOCAL_ORIGIN;
    if (typeof origin !== 'string' || !/^http:\/\/localhost(?::[1-9][0-9]{0,4})?$/.test(origin)) {
      throw new RecoveryError('recovery_not_configured', 503);
    }
    const parsed = new URL(origin);
    if (parsed.origin !== origin || (parsed.port && Number(parsed.port) > 65535)) throw new RecoveryError('recovery_not_configured', 503);
    return { origin, rpID: 'localhost', enrollment: env.RECOVERY_ENROLLMENT_ENABLED === 'true' };
  }
  return { origin: 'https://qetoret.com', rpID: 'qetoret.com', enrollment: env.RECOVERY_ENROLLMENT_ENABLED === 'true' };
}

function objectOnly(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RecoveryError('invalid_request');
  return value;
}

export function validateWrapper(input, { userId, methodId, credentialId, rpID, type }) {
  const value = objectOnly(input);
  const kind = type === 'passkey' ? 'passkey-prf' : 'emergency-code';
  const common = ['version', 'kind', 'accountId', 'methodId', 'iv', 'ciphertext'];
  const specific = type === 'passkey'
    ? ['credentialId', 'rpId', 'prfSalt', 'hkdfSalt'] : ['salt', 'iterations'];
  const allowed = [...common, ...specific];
  if (Object.keys(value).length !== allowed.length || Object.keys(value).some(key => !allowed.includes(key))
    || value.version !== 1 || value.kind !== kind || value.accountId !== userId || value.methodId !== methodId) {
    throw new RecoveryError('invalid_wrapper');
  }
  base64url(value.iv, 12);
  base64url(value.ciphertext, 48);
  if (type === 'passkey') {
    if (value.credentialId !== credentialId || value.rpId !== rpID) throw new RecoveryError('invalid_wrapper');
    base64url(value.prfSalt, 32);
    base64url(value.hkdfSalt, 32);
  } else {
    if (value.iterations !== 600000) throw new RecoveryError('invalid_wrapper');
    base64url(value.salt, 32);
  }
  return Object.fromEntries(allowed.map(key => [key, value[key]]));
}

export function sanitizeWebAuthn(input, registration) {
  const value = objectOnly(input);
  const response = objectOnly(value.response);
  const id = base64url(value.id, 1, 1024);
  if (value.type !== 'public-key' || value.rawId !== id) throw new RecoveryError('invalid_request');
  const output = { id, rawId: id, type: 'public-key', response: {
    clientDataJSON: base64url(response.clientDataJSON, 1, 8192),
  }, clientExtensionResults: {} };
  if (registration) {
    output.response.attestationObject = base64url(response.attestationObject, 1, 16384);
    const transports = ['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb'];
    if (response.transports !== undefined) {
      if (!Array.isArray(response.transports) || response.transports.length > 8 || response.transports.some(item => !transports.includes(item))) {
        throw new RecoveryError('invalid_request');
      }
      output.response.transports = [...new Set(response.transports)];
    }
  } else {
    output.response.authenticatorData = base64url(response.authenticatorData, 37, 8192);
    output.response.signature = base64url(response.signature, 1, 4096);
    if (response.userHandle != null) output.response.userHandle = base64url(response.userHandle, 1, 64);
  }
  // Whitelist all verifier input. In particular, clientExtensionResults.prf
  // and any attacker-supplied nested secrets are never forwarded or persisted.
  return output;
}

export function publicMethod(row) {
  return {
    id: row.id, userId: row.user_id, type: row.method_type, status: row.status,
    credentialId: row.credential_id, wrapper: row.wrapper, revision: row.revision,
    label: row.label, createdAt: row.created_at, verifiedAt: row.verified_at,
    verificationKind: row.verified_at ? 'client-reported' : null,
    revokedAt: row.revoked_at,
  };
}

export function safeLabel(value) {
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.length > 80 || [...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) throw new RecoveryError('invalid_request');
  return value.trim();
}
