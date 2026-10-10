import { get as idbGet, keys as idbKeys } from 'idb-keyval';
import { supabase } from './supabase';
import { exportVaultRecord, getMasterKey, inspectVaultRecord, isUnlocked, verifyRecoveryPassphrase } from './crypto/keyManager';
import { pendingCount } from './mutationQueue';
import { listNoteDraftIds, loadNoteDraft } from './prayerNoteDrafts';
import { listFormDraftSlots, loadFormDraft } from './prayerFormDrafts';
import { loadGuestDraft } from './guestPrayerDraft';

export const ORIGINAL_APP_URL = 'https://praystead.com/';
export const ORIGINAL_WWW_APP_URL = 'https://www.praystead.com/';
export const NEW_APP_URL = 'https://qetoret.com/';
const ORIGINAL_ORIGINS = new Set(['https://praystead.com', 'https://www.praystead.com']);
const NEW_ORIGINS = new Set(['https://qetoret.com', 'https://www.qetoret.com']);
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const snoozeKey = (userId) => `pfm_origin_migration_snooze:${userId}`;

export function isOriginalAppOrigin(origin = globalThis.location?.origin) {
  return ORIGINAL_ORIGINS.has(origin);
}

export function isNewAppOrigin(origin = globalThis.location?.origin) {
  return NEW_ORIGINS.has(origin);
}

export function migrationPromptSnoozed(userId, now = Date.now()) {
  if (!userId) return true;
  try {
    const until = Number(localStorage.getItem(snoozeKey(userId)));
    return Number.isFinite(until) && until > now;
  } catch { return false; }
}

export function snoozeMigrationPrompt(userId, now = Date.now()) {
  if (!userId) return;
  try { localStorage.setItem(snoozeKey(userId), String(now + SNOOZE_MS)); } catch { /* session dismissal still works */ }
}

const online = () => typeof navigator === 'undefined' || navigator.onLine !== false;

async function localChangesStatus() {
  if (!online()) return 'offline';
  if (pendingCount() > 0) return 'pending';
  // Apply the normal readers' retention/validity rules in read-only mode.
  // Never promote, publish or discard a draft while preparing a domain move.
  // Strict IDB reads prevent the draft readers' fail-soft behavior from turning
  // a storage outage into a false "no local drafts" success.
  const keys = typeof indexedDB === 'undefined' ? [] : await idbKeys();
  if (typeof indexedDB !== 'undefined') {
    const queue = await idbGet('pfm_mutation_queue');
    if (queue != null && !Array.isArray(queue)) return 'failed';
    if (queue?.length > 0) return 'pending';
    await Promise.all(keys.filter((key) => typeof key === 'string' && (
      key === 'pfm_guest_draft' || key.startsWith('pfm_note_draft:') || key.startsWith('pfm_form_draft:')
    )).map((key) => idbGet(key)));
  }
  if (await loadGuestDraft({ clearInvalid: false })) return 'drafts';
  for (const id of await listNoteDraftIds()) {
    const draft = await loadNoteDraft(id, { clearInvalid: false });
    if (draft && (draft.text?.trim() || draft.voice?.blob)) return 'drafts';
  }
  for (const slot of await listFormDraftSlots()) {
    if (await loadFormDraft(slot, { clearInvalid: false })) return 'drafts';
  }
  return null;
}

// Read-only server check. Never push a cached wrapper over remote recovery
// settings, import a replacement key, or transfer raw keys across origins.
export async function checkOriginMigrationReady(userId, passphrase) {
  try {
    const localStatus = await localChangesStatus();
    if (localStatus) return { status: localStatus };
    const localRecord = exportVaultRecord();
    if (!userId || !localRecord || !isUnlocked()) return { status: 'recovery' };
    const key = getMasterKey();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || authData?.user?.id !== userId) return { status: 'failed' };
    const { data, error } = await supabase.from('vault_keys').select('record').eq('user_id', userId).maybeSingle();
    if (error || !inspectVaultRecord(data?.record)) return { status: 'failed' };
    if (!await verifyRecoveryPassphrase(passphrase, data.record)) return { status: 'wrongPassphrase' };
    const status = await localChangesStatus();
    if (status) return { status };
    const result = { status: 'ready', userId, localRecord, key, checkedAt: Date.now() };
    return isMigrationVerificationCurrent(result, userId) ? result : { status: 'changed' };
  } catch { return { status: 'failed' }; }
}

export function isMigrationVerificationCurrent(result, userId, now = Date.now()) {
  return result?.status === 'ready' && result.userId === userId
    && online() && pendingCount() === 0 && isUnlocked()
    && result.key === getMasterKey() && result.localRecord === exportVaultRecord()
    && now - result.checkedAt < 60_000;
}

// Another tab can persist drafts/queued writes without triggering a storage
// event (IndexedDB has none). Re-inventory at the final click, not only when the
// initial recovery check ran. Preserve the same verified key and wrapper.
export async function recheckOriginMigrationReady(result, userId) {
  try {
    if (!isMigrationVerificationCurrent(result, userId)) return { status: 'changed' };
    const status = await localChangesStatus();
    if (status) return { status };
    return isMigrationVerificationCurrent(result, userId) ? result : { status: 'changed' };
  } catch { return { status: 'failed' }; }
}
