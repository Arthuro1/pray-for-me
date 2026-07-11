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
import { getMasterKey, isUnlocked } from './keyManager';
import { encryptJson, decryptJson, toB64, fromB64 } from './e2ee';

const RSA_PARAMS = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256',
};
const RSA_IMPORT = { name: 'RSA-OAEP', hash: 'SHA-256' };

// In-memory only: the unwrapped private key + its public JWK for this session.
let cache = null; // { userId, publicJwk, privateKey }

// Session memo of OTHER members' imported public keys (immutable per user), so a
// repeated group-key fan-out doesn't re-fetch + re-import every recipient's key.
// userId -> CryptoKey | null (null = looked up, none published yet — re-checked).
const memberKeyCache = new Map();

// Reset the in-memory keypair (sign-out / tests). The server row is untouched.
export function clearUserKeyCache() {
  cache = null;
  memberKeyCache.clear();
}

// Ensure the signed-in user has a published identity keypair, and that this
// session holds the unwrapped private key. Returns the public JWK, or null if
// the ACK is locked / the table is missing / offline.
export async function ensureUserPublicKey(userId) {
  if (!userId || !isUnlocked()) return null;
  if (cache && cache.userId === userId && cache.privateKey) return cache.publicJwk;

  let row;
  try {
    const { data } = await supabase
      .from('user_crypto_keys')
      .select('public_key_jwk, encrypted_private_key')
      .eq('user_id', userId)
      .maybeSingle();
    row = data;
  } catch {
    return null; // table absent / offline — fail soft
  }

  if (row?.public_key_jwk && row?.encrypted_private_key) {
    try {
      const pkcs8B64 = await decryptJson(getMasterKey(), row.encrypted_private_key);
      const privateKey = await crypto.subtle.importKey('pkcs8', fromB64(pkcs8B64), RSA_PARAMS, false, ['decrypt']);
      cache = { userId, publicJwk: row.public_key_jwk, privateKey };
      return cache.publicJwk;
    } catch {
      // Can't unwrap (e.g. a different ACK on a new device before recovery).
      // Do NOT regenerate — that would orphan every group key wrapped to the
      // existing public key. Leave it for the recovery flow to resolve.
      return null;
    }
  }

  // No row yet → generate and publish a fresh keypair.
  const kp = await crypto.subtle.generateKey(RSA_PARAMS, true, ['encrypt', 'decrypt']);
  const publicJwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
  const encrypted_private_key = await encryptJson(getMasterKey(), toB64(new Uint8Array(pkcs8)));
  try {
    await supabase.from('user_crypto_keys').upsert(
      { user_id: userId, public_key_jwk: publicJwk, encrypted_private_key, key_version: 1, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  } catch {
    return null;
  }
  cache = { userId, publicJwk, privateKey: kp.privateKey };
  return publicJwk;
}

// The current session's unwrapped private key (for unwrapping group keys wrapped
// to us). Null until ensureUserPublicKey has run this session.
export function getMyPrivateKey() {
  return cache?.privateKey || null;
}

// Import another member's public key (for wrapping a group key to them). Reads
// the public_keys view (never exposes anyone's private key). Null if unknown.
// A successful import is memoized for the session (public keys are immutable);
// a miss is NOT cached, so a member who publishes their key mid-session is
// picked up on the next fan-out.
export async function getMemberPublicKey(userId) {
  if (!userId) return null;
  const memo = memberKeyCache.get(userId);
  if (memo) return memo;
  try {
    const { data } = await supabase
      .from('public_keys')
      .select('public_key_jwk')
      .eq('user_id', userId)
      .maybeSingle();
    if (!data?.public_key_jwk) return null;
    const key = await crypto.subtle.importKey('jwk', data.public_key_jwk, RSA_IMPORT, false, ['encrypt']);
    memberKeyCache.set(userId, key);
    return key;
  } catch {
    return null;
  }
}
