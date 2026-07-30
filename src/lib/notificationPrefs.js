// Account-level notification preferences (notification_preferences table).
// Kept separate from device push subscriptions so per-type preferences are never
// duplicated across a user's browsers. RLS restricts every row to its owner.
//
// The unique index is an expression index (coalesce(group_id, …)), which
// supabase-js upsert can't target, so we do an explicit find-then-write instead
// of onConflict. The unique index still guarantees no duplicates.
import { supabase } from './supabase';

// The event types a user can tune (the '_account' row below holds the global
// quiet hours + master toggles).
export const NOTIF_TYPES = [
  'friend_request',
  'group_invitation',
  'community_update',
  'answered',
  'reaction_bucket',
  'group_prayer_added',
  'testimony',
];

// Type-aware default delivery mode — mirrors default_delivery_mode() in
// supabase/notifications.sql. The aggregated types default to a batched digest;
// everything else is immediate. Used so the preferences UI shows the real
// default when a user has no explicit row for a type.
export function defaultMode(type) {
  return type === 'group_prayer_added' || type === 'testimony' ? 'digest' : 'immediate';
}

// Current IANA timezone for this device (used as the account's scheduling tz).
export function currentTimezone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch { return null; }
}

// All of a user's account-scope preference rows (group overrides excluded),
// keyed by type for easy lookup.
export async function fetchNotificationPrefs(userId) {
  if (!userId) return {};
  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .is('group_id', null);
  return Object.fromEntries((data || []).map((r) => [r.type, r]));
}

// Account-level master switch for community/event push. Mirrors the DB default
// (notifications.sql: push_enabled default true, resolve_notification_pref
// coalesces a missing row to true), so "no _account row yet" reads as ENABLED.
// Used on app load to decide whether a permission-granted device should keep a
// live push subscription, so the toggle propagates across a user's devices.
export async function isEventPushEnabled(userId) {
  if (!userId) return false;
  const { data } = await supabase
    .from('notification_preferences')
    .select('push_enabled')
    .eq('user_id', userId)
    .eq('type', '_account')
    .is('group_id', null)
    .maybeSingle();
  return data ? data.push_enabled !== false : true;
}

// Upsert (find-then-write) one account-scope preference row.
export async function savePref(userId, type, patch) {
  if (!userId || !type) return { error: 'missing' };
  const { data: existing } = await supabase
    .from('notification_preferences')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .is('group_id', null)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('notification_preferences')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    return { error };
  }
  const { error } = await supabase
    .from('notification_preferences')
    .insert({ user_id: userId, type, group_id: null, ...patch });
  return { error };
}
