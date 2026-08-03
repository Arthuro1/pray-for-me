// Per-group content key (GCK) lifecycle: create, distribute (wrap to each
// member's RSA public key), fetch/unwrap, and forward-only rotation. A GCK is a
// random AES-256-GCM key that encrypts one group's community content
// (communityCrypto.js). The server never sees it in the clear — only copies
// wrapped to member public keys live in group_member_keys.
//
// Distribution is eventually-consistent: whoever holds the key wraps it to every
// current member (idempotently), so a newcomer becomes able to read once any
// existing member next touches the group. Fails soft everywhere — missing crypto
// tables, an unready identity key, or an unpublished member public key yield null
// (or skip that member) rather than throwing.
import { supabase } from '../supabase';
import { toB64, fromB64 } from './e2ee';
import { ensureUserPublicKey, getMyPrivateKey, getMemberPublicKey } from './userKeys';

const AES_PARAMS = { name: 'AES-GCM', length: 256 };

// In-memory, session-scoped caches, keyed by group + version so old-version
// content stays decryptable after a rotation.
const keyCache = new Map();      // `${groupId}:${version}` -> CryptoKey (unwrapped GCK)
// Fan-out bookkeeping per `${groupId}:${version}`:
//   { complete: bool, lastAt: number }
// `complete` is true only once EVERY current member has been wrapped in; while a
// member still hasn't published an identity key we keep retrying (throttled) so a
// late joiner converges without the holder having to reload the whole app.
const distributed = new Map();
// Small coalescing window: while a fan-out is still incomplete (some member
// hasn't published a key yet) we retry on the holder's next touch, but not more
// than once per this interval, so a burst of ensureGroupKey calls within one UI
// flow doesn't re-run it repeatedly. Member public keys are memoized, so a retry
// is cheap once everyone reachable has been wrapped in.
const REDISTRIBUTE_THROTTLE_MS = 5_000;

export function clearGroupKeyCache() {
  keyCache.clear();
  distributed.clear();
}

const tagOf = (groupId, version) => `${groupId}:${version}`;

async function currentUserId() {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || null;
  } catch {
    return null;
  }
}

// Wrap the raw GCK bytes to a member's RSA-OAEP public key → the jsonb stored in
// group_member_keys.encrypted_group_key.
async function wrapGck(gckRaw, publicKey, { groupId, version, userId }) {
  const bound = new TextEncoder().encode(JSON.stringify({
    v: 2,
    key: toB64(gckRaw),
    groupId,
    version,
    userId,
  }));
  const ct = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, bound);
  return { v: 2, data: toB64(new Uint8Array(ct)) };
}

// Unwrap a stored wrapped key with my private key → an AES-GCM CryptoKey.
async function unwrapGck(wrapped, privateKey, expected) {
  const decrypted = new Uint8Array(await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    fromB64(wrapped.data),
  ));
  let raw = decrypted;
  if (wrapped.v >= 2) {
    const bound = JSON.parse(new TextDecoder().decode(decrypted));
    if (bound.v !== 2
      || bound.groupId !== expected.groupId
      || bound.version !== expected.version
      || bound.userId !== expected.userId) {
      throw new Error('Wrapped group key context mismatch');
    }
    raw = fromB64(bound.key);
  }
  return crypto.subtle.importKey('raw', raw, AES_PARAMS, true, ['encrypt', 'decrypt']);
}

// The highest existing key version for a group (0 = none provisioned yet).
async function currentVersion(groupId) {
  try {
    const { data } = await supabase
      .from('group_key_versions')
      .select('version')
      .eq('group_id', groupId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.version ?? 0;
  } catch {
    return 0;
  }
}

// Confirm my identity keypair is ready and return my unwrapped private key, or
// null if it can't be readied (account key locked / offline / table missing).
async function myIdentity(myUserId) {
  if (!myUserId) return null;
  if (!(await ensureUserPublicKey(myUserId))) return null;
  return getMyPrivateKey();
}

// Wrap `gckRaw` for every current member with a published public key and upsert
// the rows. Idempotent — onConflict ignores existing rows, and since the key
// material is identical any prior wrap stays valid.
//
// Convergence: a member who published their identity key AFTER a previous fan-out
// would otherwise never receive a wrapped copy (the old guard stopped after the
// first run). We instead keep retrying — throttled — until every current member
// has been wrapped in, then mark the (group, version) `complete` so steady-state
// calls skip the work. This is what lets a late joiner become able to read
// existing content as soon as any key-holder next touches the group.
async function distribute(groupId, version, gckRaw, { force = false } = {}) {
  const tag = tagOf(groupId, version);
  const state = distributed.get(tag);
  if (!force && state?.complete) return;
  if (!force && state && Date.now() - state.lastAt < REDISTRIBUTE_THROTTLE_MS) return;

  const { data: members } = await supabase.from('group_members').select('user_id').eq('group_id', groupId);
  const list = members || [];
  const rows = [];
  let allPublished = list.length > 0;
  for (const m of list) {
    const pub = await getMemberPublicKey(m.user_id);
    if (!pub) { allPublished = false; continue; } // member hasn't published an identity key yet — retry later
    rows.push({
      group_id: groupId,
      key_version: version,
      user_id: m.user_id,
      encrypted_group_key: await wrapGck(gckRaw, pub, { groupId, version, userId: m.user_id }),
    });
  }
  if (rows.length) {
    const results = await Promise.all(rows.map(async (row) => {
      try {
        return await supabase.rpc('distribute_group_key', {
          p_group_id: row.group_id,
          p_key_version: row.key_version,
          p_target_user_id: row.user_id,
          p_encrypted_group_key: row.encrypted_group_key,
        });
      } catch {
        return { error: { message: 'group_key_distribution_failed' } };
      }
    }));
    // Publishing a member key is not enough: every RPC must also have reached
    // the database. Keep the fan-out incomplete after a network/RPC failure so
    // the next group touch retries instead of stranding a member for the session.
    allPublished = allPublished && results.every((result) => !result?.error);
  }
  distributed.set(tag, { complete: allPublished, lastAt: Date.now() });
}

// Claim `version` for the group and become its key holder: generate a GCK, record
// the version, persist my own wrapped copy first (so the key survives to the next
// session even if fanning out to co-members fails), then best-effort distribute
// to everyone else. If the version row already exists (another member won the
// race) or the write is refused, abandon and return null — we'll obtain our
// wrapped copy from the winner later via getGroupKey.
async function createKeyVersion(groupId, version, myUserId) {
  const myPub = await getMemberPublicKey(myUserId);
  if (!myPub) return null; // my own identity key isn't published yet
  const gck = await crypto.subtle.generateKey(AES_PARAMS, true, ['encrypt', 'decrypt']);

  const gckRaw = new Uint8Array(await crypto.subtle.exportKey('raw', gck));
  const encryptedCreatorKey = await wrapGck(gckRaw, myPub, { groupId, version, userId: myUserId });
  const idempotencyKey = crypto.randomUUID();
  const args = {
    p_group_id: groupId,
    p_requested_version: version,
    p_encrypted_creator_key: encryptedCreatorKey,
    p_idempotency_key: idempotencyKey,
  };
  let committed = null;
  // A lost response after commit is safe to retry with the same idempotency key.
  for (let attempt = 0; attempt < 2 && committed == null; attempt++) {
    const { data, error } = await supabase.rpc('create_group_key_version', args);
    if (!error && Number(data) === version) committed = version;
  }
  if (committed == null) return null;

  keyCache.set(tagOf(groupId, version), gck);
  await distribute(groupId, version, gckRaw, { force: true });
  return { key: gck, version };
}

// Fetch + unwrap my wrapped GCK for a specific version. Cached per session. Null
// if I hold no wrapped row for it (a newcomer before a member wraps the key to
// me) or my identity key isn't ready.
export async function getGroupKey(groupId, version) {
  if (!groupId || !version) return null;
  const cached = keyCache.get(tagOf(groupId, version));
  if (cached) return { key: cached, version };

  const myUserId = await currentUserId();
  const privateKey = await myIdentity(myUserId);
  if (!privateKey) return null;

  try {
    const { data } = await supabase
      .from('group_member_keys')
      .select('encrypted_group_key')
      .eq('group_id', groupId)
      .eq('key_version', version)
      .eq('user_id', myUserId)
      .maybeSingle();
    if (!data?.encrypted_group_key) return null;
    const key = await unwrapGck(data.encrypted_group_key, privateKey, {
      groupId,
      version,
      userId: myUserId,
    });
    keyCache.set(tagOf(groupId, version), key);
    return { key, version };
  } catch {
    return null;
  }
}

// The group's CURRENT content key for encrypting new content. Provisions version
// 1 on first use if the group has none yet, and opportunistically (re)distributes
// the key to members missing it. Null if we can't obtain/create it (identity key
// not ready, or a newcomer awaiting a wrapped key from a co-member).
export async function ensureGroupKey(groupId) {
  if (!groupId) return null;
  const myUserId = await currentUserId();
  if (!(await myIdentity(myUserId))) return null;

  const version = await currentVersion(groupId);
  if (version === 0) return createKeyVersion(groupId, 1, myUserId);

  const gk = await getGroupKey(groupId, version);
  if (gk) {
    // I hold the current key → make sure co-members (incl. newcomers) have it too.
    try {
      const gckRaw = new Uint8Array(await crypto.subtle.exportKey('raw', gk.key));
      await distribute(groupId, version, gckRaw);
    } catch { /* best-effort distribution */ }
  }
  return gk;
}

// Build a resolver bound to one group: (version) => Promise<{ key, version } | null>.
// Fetch paths pass this to communityCrypto so each row is decrypted with the GCK
// matching its own key_version, even across a rotation.
export function groupKeyResolver(groupId) {
  const resolver = (version) => getGroupKey(groupId, version);
  resolver.groupId = groupId;
  return resolver;
}

// Forward-only rotation: mint the next version and wrap it only to the CURRENT
// members (so a just-removed member is excluded from future content). Old content
// stays readable via the prior versions' wrapped keys. Returns the new
// { key, version } or null if we couldn't rotate (identity not ready / race).
export async function rotateGroupKey(groupId) {
  const myUserId = await currentUserId();
  if (!(await myIdentity(myUserId))) return null;
  const next = (await currentVersion(groupId)) + 1;
  return createKeyVersion(groupId, next, myUserId);
}

// Atomically remove a member, revoke their wrapped keys (all versions), and
// rotate so new content uses a key they never held. The protected RPC performs
// membership removal + creator-envelope creation in one transaction.
export async function revokeMemberAndRotate(groupId, userId) {
  const myUserId = await currentUserId();
  if (!(await myIdentity(myUserId))) return null;
  const version = (await currentVersion(groupId)) + 1;
  const myPub = await getMemberPublicKey(myUserId);
  if (!myPub) return null;
  const gck = await crypto.subtle.generateKey(AES_PARAMS, true, ['encrypt', 'decrypt']);
  const gckRaw = new Uint8Array(await crypto.subtle.exportKey('raw', gck));
  const encryptedCreatorKey = await wrapGck(gckRaw, myPub, { groupId, version, userId: myUserId });
  const idempotencyKey = crypto.randomUUID();
  const args = {
    p_group_id: groupId,
    p_target_user_id: userId,
    p_requested_version: version,
    p_encrypted_creator_key: encryptedCreatorKey,
    p_idempotency_key: idempotencyKey,
  };
  let committed = null;
  for (let attempt = 0; attempt < 2 && committed == null; attempt++) {
    const { data, error } = await supabase.rpc('remove_group_member_and_rotate', args);
    if (!error && Number(data) === version) committed = version;
  }
  if (committed == null) return null;
  keyCache.set(tagOf(groupId, version), gck);
  await distribute(groupId, version, gckRaw, { force: true });
  return { key: gck, version };
}
