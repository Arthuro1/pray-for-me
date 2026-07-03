// Account-level settings sync (user_settings table). Language and reminder
// preferences are the same for a user everywhere they sign in; this module
// moves them between the store's camelCase settings object and the one-row-
// per-user server table. Theme and notificationsGranted are deliberately NOT
// here — they are per-device (see supabase/user_settings.sql).
import { supabase } from './supabase';

// store key → user_settings column
const COLUMNS = {
  language: 'language',
  dailyReminderEnabled: 'daily_reminder_enabled',
  dailyReminderTime: 'daily_reminder_time',
  followUpEnabled: 'follow_up_enabled',
  followUpDays: 'follow_up_days',
};

// True when a settings patch touches anything that lives server-side.
export function touchesSyncedSettings(updates) {
  return Object.keys(updates).some((k) => k in COLUMNS);
}

// The user's account settings in store shape, or null when no row exists yet
// (new account, or the migration SQL hasn't been run — callers treat both as
// "local settings stand").
export async function fetchUserSettings(userId) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  const out = {};
  for (const [key, col] of Object.entries(COLUMNS)) {
    if (data[col] !== null && data[col] !== undefined) out[key] = data[col];
  }
  return out;
}

// Persist the syncable subset of `settings` as the account's settings.
export async function saveUserSettings(userId, settings) {
  const row = { user_id: userId, updated_at: new Date().toISOString() };
  for (const [key, col] of Object.entries(COLUMNS)) {
    if (settings[key] !== undefined) row[col] = settings[key];
  }
  await supabase.from('user_settings').upsert(row, { onConflict: 'user_id' });
}
