// Syncs the user's WRAPPED vault record (ciphertext only) through Supabase so
// the Prayer Vault can be unlocked on any of their devices. The record never
// contains the master key or passphrase. This is ciphertext storage, not a
// claim of protection against malicious deployed JavaScript.
//
// Both functions fail soft — a missing table (migration not run) or a dead
// network must never throw into the boot path — but they REPORT the failure
// instead of swallowing it. A recovery record the user believes is synced and
// isn't is the worst outcome the vault has: every other device is then locked
// out of content the user was told they could recover.
import { supabase } from './supabase';
import {
  exportVaultRecord,
  importVaultRecord,
  inspectVaultRecord,
  isVaultInitialized,
  hydrate,
  getLifecycleToken,
  isLifecycleCurrent,
} from './crypto/keyManager';
import { devError } from './logger';

// What the server holds for this user, as far as we were able to tell.
export const VAULT_SYNC = {
  PRESENT: 'present', // a wrapped record is on the server (pulled, pushed, or already there)
  ABSENT: 'absent',   // the server definitively holds no record
  UNKNOWN: 'unknown', // the lookup failed — the answer must not be inferred
};

async function currentAccount() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session?.access_token) return null;
    const { data: { user }, error: userError } = await supabase.auth.getUser(data.session.access_token);
    if (userError || !user?.id || user.id !== data.session.user?.id) return null;
    return { userId: user.id, authorization: `Bearer ${data.session.access_token}` };
  } catch {
    return null;
  }
}

// Upload the local wrapped record. Call after create / recovery setup / reset /
// rotate. Returns true only when the record actually reached the server:
// PostgREST reports RLS and constraint failures in `error` rather than throwing,
// so an unchecked call reports success while leaving other devices with nothing
// to recover from.
function canonical(value) {
  if (Array.isArray(value)) return JSON.stringify(value.map((item) => JSON.parse(canonical(item))));
  if (value && typeof value === 'object') return JSON.stringify(Object.fromEntries(Object.keys(value).sort().map((key) => [key, JSON.parse(canonical(value[key]))])));
  return JSON.stringify(value);
}

export async function pushVaultRecord() {
  const token = getLifecycleToken();
  await hydrate();
  if (!isLifecycleCurrent(token)) return false;
  const record = exportVaultRecord();
  if (!record) return false;
  const account = await currentAccount();
  const userId = account?.userId;
  if (!userId || !isLifecycleCurrent(token) || (token.accountId && token.accountId !== userId)) return false;
  try {
    const local = inspectVaultRecord(record);
    if (!local) return false;
    const { data: before, error: readError } = await supabase.from('vault_keys').select('record').eq('user_id', userId).setHeader('Authorization', account.authorization).maybeSingle();
    if (readError || !isLifecycleCurrent(token)) return false;
    const proposed = JSON.parse(local.json);
    const remote = inspectVaultRecord(before?.record);
    if (remote && canonical(JSON.parse(remote.json)) === canonical(proposed)) return true;
    // Equal-generation divergent edits are conflicts, never a client-clock race.
    if (remote && remote.revision >= local.revision) return false;
    const { data: committed, error } = await supabase.rpc('compare_and_swap_vault_record', {
      expected_record: before?.record ?? null, new_record: proposed,
    }).setHeader('Authorization', account.authorization);
    if (error || !committed || !isLifecycleCurrent(token)) {
      devError('vaultSync push failed', error?.code || 'conflict'); return false;
    }
    const { data: after, error: verifyError } = await supabase.from('vault_keys').select('record').eq('user_id', userId).setHeader('Authorization', account.authorization).maybeSingle();
    return !verifyError && isLifecycleCurrent(token) && exportVaultRecord() === record
      && !!after?.record && canonical(after.record) === canonical(proposed);
  } catch (e) {
    devError('vaultSync push failed', e?.status);
    return false;
  }
}

// Reconcile this device with the server copy on boot, and report what the server
// holds:
//   • server has a record, this device has none → import it (new device → the
//     unlock screen can take over).
//   • this device has one the server lacks → push it. An earlier push failed
//     (offline, expired session, RLS) and the record is stranded on this device
//     — the "recovery is set up" lie this heals, one boot later.
// A failed lookup is UNKNOWN, never ABSENT: the caller uses this to decide
// whether a device with no key may mint a fresh one, and inferring "no recovery
// exists" from a network blip would offer to discard perfectly recoverable data.
export async function pullVaultRecord() {
  const token = getLifecycleToken();
  await hydrate(); // ensure the local cache reflects IndexedDB before we decide
  const account = await currentAccount();
  const userId = account?.userId;
  if (!userId || !isLifecycleCurrent(token) || (token.accountId && token.accountId !== userId)) return VAULT_SYNC.UNKNOWN;
  try {
    const { data, error } = await supabase
      .from('vault_keys').select('record, updated_at').eq('user_id', userId).setHeader('Authorization', account.authorization).maybeSingle();
    if (!isLifecycleCurrent(token)) return VAULT_SYNC.UNKNOWN;
    if (error) { devError('vaultSync pull failed', error.code); return VAULT_SYNC.UNKNOWN; }
    if (data?.record) {
      const remote = inspectVaultRecord(data.record);
      if (!remote) {
        // A malformed row is not a usable recovery record. Treating it as
        // PRESENT would route the user to an unlock form that can never work.
        devError('vaultSync pull failed', 'invalid_record');
        if (inspectVaultRecord(exportVaultRecord()) && await pushVaultRecord()) {
          return VAULT_SYNC.PRESENT;
        }
        return VAULT_SYNC.UNKNOWN;
      }
      const local = inspectVaultRecord(exportVaultRecord());
      if (!local) {
        return await importVaultRecord(remote.json, true, token) ? VAULT_SYNC.PRESENT : VAULT_SYNC.UNKNOWN;
      }
      if (canonical(JSON.parse(local.json)) === canonical(JSON.parse(remote.json))) return VAULT_SYNC.PRESENT;

      // A client clock cannot decide which divergent recovery credential to
      // discard. Keep both copies and surface uncertainty on an equal revision.
      if (remote.revision === local.revision) return VAULT_SYNC.UNKNOWN;
      if (remote.revision > local.revision) {
        if (!await importVaultRecord(remote.json, true, token)) return VAULT_SYNC.UNKNOWN;
      } else {
        // This device has a passphrase/recovery change whose earlier upload was
        // interrupted. Re-publish it instead of silently reverting it.
        if (!await pushVaultRecord()) return VAULT_SYNC.UNKNOWN;
      }
      return VAULT_SYNC.PRESENT;
    }
    if (isVaultInitialized()) {
      return (await pushVaultRecord()) ? VAULT_SYNC.PRESENT : VAULT_SYNC.ABSENT;
    }
    return VAULT_SYNC.ABSENT;
  } catch (e) {
    devError('vaultSync pull failed', e?.status);
    return VAULT_SYNC.UNKNOWN;
  }
}
