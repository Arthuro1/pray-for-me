// Syncs the user's WRAPPED vault record (ciphertext only) through Supabase so
// the Prayer Vault can be unlocked on any of their devices. The record never
// contains the master key or passphrase, so this preserves zero-knowledge.
//
// All functions fail soft: if the vault_keys table doesn't exist yet (migration
// not run) or the network is down, they no-op rather than throwing.
import { supabase } from './supabase';
import { exportVaultRecord, importVaultRecord, isVaultInitialized, hydrate } from './crypto/keyManager';
import { devError } from './logger';

// Upload the local wrapped record. Call after create / change / reset.
export async function pushVaultRecord() {
  await hydrate();
  const record = exportVaultRecord();
  if (!record) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('vault_keys')
      .upsert({ user_id: user.id, record: JSON.parse(record), updated_at: new Date().toISOString() });
  } catch (e) {
    devError('vaultSync push failed', e?.status);
  }
}

// Pull the wrapped record onto this device if it has none yet. Returns true if a
// vault record is now present locally (synced or already there).
export async function pullVaultRecord() {
  await hydrate(); // ensure the local cache reflects IndexedDB before we decide
  if (isVaultInitialized()) return true; // already have a (possibly newer) local record
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from('vault_keys').select('record').eq('user_id', user.id).maybeSingle();
    if (data?.record) {
      importVaultRecord(JSON.stringify(data.record));
      return true;
    }
  } catch (e) {
    devError('vaultSync pull failed', e?.status);
  }
  return false;
}
