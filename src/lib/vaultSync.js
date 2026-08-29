// Syncs the user's WRAPPED vault record (ciphertext only) through Supabase so
// the Prayer Vault can be unlocked on any of their devices. The record never
// contains the master key or passphrase, so this preserves zero-knowledge.
//
// Both functions fail soft — a missing table (migration not run) or a dead
// network must never throw into the boot path — but they REPORT the failure
// instead of swallowing it. A recovery record the user believes is synced and
// isn't is the worst outcome the vault has: every other device is then locked
// out of content the user was told they could recover.
import { supabase } from './supabase';
import { exportVaultRecord, importVaultRecord, isVaultInitialized, hydrate } from './crypto/keyManager';
import { devError } from './logger';

// What the server holds for this user, as far as we were able to tell.
export const VAULT_SYNC = {
  PRESENT: 'present', // a wrapped record is on the server (pulled, pushed, or already there)
  ABSENT: 'absent',   // the server definitively holds no record
  UNKNOWN: 'unknown', // the lookup failed — the answer must not be inferred
};

async function currentUserId() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// Upload the local wrapped record. Call after create / recovery setup / reset /
// rotate. Returns true only when the record actually reached the server:
// PostgREST reports RLS and constraint failures in `error` rather than throwing,
// so an unchecked call reports success while leaving other devices with nothing
// to recover from.
export async function pushVaultRecord() {
  await hydrate();
  const record = exportVaultRecord();
  if (!record) return false;
  const userId = await currentUserId();
  if (!userId) return false;
  try {
    const { error } = await supabase
      .from('vault_keys')
      .upsert({ user_id: userId, record: JSON.parse(record), updated_at: new Date().toISOString() });
    if (error) { devError('vaultSync push failed', error.code); return false; }
    return true;
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
  await hydrate(); // ensure the local cache reflects IndexedDB before we decide
  const userId = await currentUserId();
  if (!userId) return VAULT_SYNC.UNKNOWN;
  try {
    const { data, error } = await supabase
      .from('vault_keys').select('record').eq('user_id', userId).maybeSingle();
    if (error) { devError('vaultSync pull failed', error.code); return VAULT_SYNC.UNKNOWN; }
    if (data?.record) {
      importVaultRecord(JSON.stringify(data.record)); // never clobbers a local record
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
