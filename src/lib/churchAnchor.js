// The user's local church and small group: the names that let the Church
// circle, the Sunday card and a testimony point back to a real gathered body
// (docs/QETORET_IDENTITY.md — the app never replaces the local church).
//
// The names are personal, so they live only inside user_settings.private_payload,
// encrypted under the account key and bound to the account (see e2ee.ts). They
// are never written to localStorage, logs or analytics. Reads and writes need an
// unlocked vault; while it is locked the anchor is simply unknown.
//
// The write touches private_payload alone, never the other settings columns, so
// a client running before its migration is applied fails this one write and
// leaves every other setting intact.
import { supabase } from './supabase';
import { encryptJson, decryptJson, isEncryptedPayload } from './crypto/e2ee.ts';
import { getMasterKey, isUnlocked } from './crypto/keyManager.ts';

export const CHURCH_NAME_MAX = 80;
export const EMPTY_ANCHOR = Object.freeze({ church: '', smallGroup: '' });

function anchorContext(userId) {
  return {
    entityType: 'account-settings',
    ownerOrGroupId: userId,
    recordId: userId,
    field: 'private-payload',
  };
}

const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, CHURCH_NAME_MAX);

// The stored shape, trimmed and bounded. Unknown keys are dropped.
export function normalizeAnchor(value) {
  return { church: clean(value?.church), smallGroup: clean(value?.smallGroup) };
}

export async function encryptAnchor(userId, anchor) {
  return encryptJson(getMasterKey(), normalizeAnchor(anchor), anchorContext(userId));
}

export async function decryptAnchor(userId, payload) {
  if (!isEncryptedPayload(payload)) return { ...EMPTY_ANCHOR };
  return normalizeAnchor(await decryptJson(getMasterKey(), payload, anchorContext(userId)));
}

// The account's anchor, or null when it can't be read (vault locked, offline,
// column missing). An account that never set one reads as EMPTY_ANCHOR.
export async function fetchChurchAnchor(userId) {
  if (!userId || !isUnlocked()) return null;
  const { data, error } = await supabase
    .from('user_settings')
    .select('private_payload')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  try {
    return await decryptAnchor(userId, data?.private_payload);
  } catch {
    return null; // a payload this key cannot open is never overwritten from here
  }
}

// Encrypt and store the anchor. Returns true once the server accepted it.
export async function saveChurchAnchor(userId, anchor) {
  if (!userId || !isUnlocked()) return false;
  const privatePayload = await encryptAnchor(userId, anchor);
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, private_payload: privatePayload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  return !error;
}
