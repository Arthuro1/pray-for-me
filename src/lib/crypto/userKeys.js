// Per-user asymmetric identity keypair (RSA-OAEP) — the mechanism that lets a
// group content key be handed to a member without the server ever seeing it.
//
//   • public_key_jwk        — readable by any authenticated user (public_keys
//                             view). Group keys are wrapped TO it.
//   • encrypted_private_key — the private key (pkcs8) encrypted with the user's
//                             account content key (ACK). Readable only by its
//                             owner; unwrapped in memory here, never cached in
//                             cleartext at rest.
//
// Phase 1 ships this module + tests; Phase 2 wires it into the community flow.
// Everything fails soft: if the user_crypto_keys table isn't present yet or the
// network is down, callers get null rather than a throw.
import { supabase } from '../supabase';
import { getMasterKey, isUnlocked, getLifecycleToken, isLifecycleCurrent, isAccountContextConfigured, onLockChange } from './keyManager';
import { encryptJson, decryptJson, toB64, fromB64 } from './e2ee';

const RSA_PARAMS = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256',
};
const RSA_IMPORT = { name: 'RSA-OAEP', hash: 'SHA-256' };
const privateKeyContext = (userId) => ({
  entityType: 'user-identity-key',
  ownerOrGroupId: userId,
  recordId: userId,
  keyVersion: 1,
  field: 'encrypted-private-key',
});

// In-memory only: the unwrapped private key + its public JWK for this session.
let cache = null; // { userId, publicJwk, privateKey }
let cacheGeneration = 0;

// Coalesce concurrent first-use calls for the same account. Insert-only
// publication also preserves the winner when another device publishes first.
const identityInFlight = new Map(); // userId -> Promise<public JWK | null>

// Reset the in-memory keypair (sign-out / tests). The server row is untouched.
export function clearUserKeyCache() {
  cacheGeneration += 1;
  cache = null;
  identityInFlight.clear();
}

function identityContext(userId) {
  const token = getLifecycleToken();
  if (!userId || !isUnlocked() || (isAccountContextConfigured() && token.accountId !== userId)) return null;
  return { userId, token, generation: cacheGeneration, masterKey: getMasterKey() };
}

function contextCurrent(context) {
  return !!context && context.generation === cacheGeneration && isLifecycleCurrent(context.token)
    && isUnlocked() && (!isAccountContextConfigured() || context.token.accountId === context.userId)
    && getMasterKey() === context.masterKey;
}

onLockChange((unlocked) => { if (!unlocked) clearUserKeyCache(); });

// Ensure the signed-in user has a published identity keypair, and that this
// session holds the unwrapped private key. Returns the public JWK, or null if
// the ACK is locked / the table is missing / offline.
export async function ensureUserPublicKey(userId) {
  const context = identityContext(userId);
  if (!context) return null;
  if (cache && cache.userId === userId && cache.privateKey && contextCurrent(cache.context)) return cache.publicJwk;

  const existing = identityInFlight.get(userId);
  if (existing) return existing;

  const pending = ensureUserPublicKeyOnce(userId, context);
  identityInFlight.set(userId, pending);
  try {
    return await pending;
  } finally {
    if (identityInFlight.get(userId) === pending) identityInFlight.delete(userId);
  }
}

async function ensureUserPublicKeyOnce(userId, context, allowCreate = true) {

  let row;
  try {
    const { data, error } = await supabase
      .from('user_crypto_keys')
      .select('public_key_jwk, encrypted_private_key')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !contextCurrent(context)) return null;
    row = data;
  } catch {
    return null; // table absent / offline — fail soft
  }

  if (row?.public_key_jwk && row?.encrypted_private_key) {
    try {
      const pkcs8B64 = await decryptJson(context.masterKey, row.encrypted_private_key, privateKeyContext(userId));
      if (!contextCurrent(context)) return null;
      const privateKey = await crypto.subtle.importKey('pkcs8', fromB64(pkcs8B64), RSA_PARAMS, false, ['decrypt']);
      if (!contextCurrent(context)) return null;
      cache = { userId, publicJwk: row.public_key_jwk, privateKey, context };
      return cache.publicJwk;
    } catch {
      // Can't unwrap (e.g. a different ACK on a new device before recovery).
      // Do NOT regenerate — that would orphan every group key wrapped to the
      // existing public key. Leave it for the recovery flow to resolve.
      return null;
    }
  }

  // Partial metadata is recovery evidence, never permission to replace an identity.
  if (row != null || !allowCreate) return null;
  return publishNewKeypair(userId, context);
}

// Generate a fresh RSA identity keypair, wrap its private key under the CURRENT
// account key, then insert it. Only explicit identity regeneration may replace
// an existing row.
// Caches the unwrapped private key for the session. Returns the public JWK, or
// null if the account key is locked or the write fails. Requires the vault
// unlocked (getMasterKey throws otherwise).
async function publishNewKeypair(userId, context, replace = false) {
  try {
    if (!contextCurrent(context)) return null;
    const kp = await crypto.subtle.generateKey(RSA_PARAMS, true, ['encrypt', 'decrypt']);
    if (!contextCurrent(context)) return null;
    const publicJwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
    const pkcs8 = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
    if (!contextCurrent(context)) return null;
    const encrypted_private_key = await encryptJson(
      context.masterKey,
      toB64(new Uint8Array(pkcs8)),
      privateKeyContext(userId),
    );
    if (!contextCurrent(context)) return null;
    const row = { user_id: userId, public_key_jwk: publicJwk, encrypted_private_key, key_version: 1, updated_at: new Date().toISOString() };
    // A second device may publish between our read and write. Its identity wins;
    // ordinary provisioning must never overwrite keys already used by a group.
    const query = supabase.from('user_crypto_keys');
    const { error } = await (replace ? query.upsert(row, { onConflict: 'user_id' }) : query.insert(row));
    if (!contextCurrent(context)) return null;
    if (error?.code === '23505' && !replace) return ensureUserPublicKeyOnce(userId, context, false);
    if (error) return null;
    cache = { userId, publicJwk, privateKey: kp.privateKey, context };
    return publicJwk;
  } catch {
    return null;
  }
}

// Force-replace this user's identity keypair. Used by the "start fresh" recovery
// path when the previous account key (and thus the previous private key) is lost:
// the orphaned row can't be unwrapped, and ensureUserPublicKey deliberately won't
// regenerate over an existing row, so this provides the explicit override. Any
// group keys wrapped to the OLD public key become unusable (that content is
// already lost); new group keys re-provision lazily under the new identity.
export async function regenerateIdentityKey(userId) {
  if (!identityContext(userId)) return null;
  clearUserKeyCache();
  return publishNewKeypair(userId, identityContext(userId), true);
}

// The current session's unwrapped private key (for unwrapping group keys wrapped
// to us). Null until ensureUserPublicKey has run this session.
export function getMyPrivateKey() {
  return cache && contextCurrent(cache.context) ? cache.privateKey : null;
}

// Import another member's CURRENT public key (for wrapping a group key to them).
// Reads the public_keys view, which never exposes anyone's private key. Identity
// keys can change after an explicit encryption reset, so this deliberately
// re-reads the small public row on each fan-out instead of keeping a stale
// session-long memo.
export async function getMemberPublicKey(userId) {
  if (!userId) return null;
  try {
    const { data } = await supabase
      .from('public_keys')
      .select('public_key_jwk')
      .eq('user_id', userId)
      .maybeSingle();
    if (!data?.public_key_jwk) return null;
    return crypto.subtle.importKey('jwk', data.public_key_jwk, RSA_IMPORT, false, ['encrypt']);
  } catch {
    return null;
  }
}
