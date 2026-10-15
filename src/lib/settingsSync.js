// Account-level settings sync (user_settings table). Language, appearance,
// AI consent and reminder preferences are the same for a user everywhere they
// sign in; this module moves them between the store's camelCase settings
// object and the one-row-per-user server table. notificationsGranted is
// deliberately NOT here — it is a per-device browser fact, not a preference.
import { supabase } from './supabase';

// store key → user_settings column
const COLUMNS = {
  language: 'language',
  theme: 'theme',
  dailyReminderEnabled: 'daily_reminder_enabled',
  dailyReminderTime: 'daily_reminder_time',
  followUpEnabled: 'follow_up_enabled',
  followUpDays: 'follow_up_days',
  followUpTime: 'follow_up_time',
  aiConsentPrayer: 'ai_consent_prayer',
  aiConsentHome: 'ai_consent_home',
  // What a push notification may reveal ('generic' | 'count') — privacy choice,
  // account-level so every device honours it (see supabase/notification_detail.sql).
  notificationDetail: 'notification_detail',
};

// Columns added after the original table. They are read when present and
// written in their own request, so a client that ships before the migration
// (supabase/migrations/20261015120000_church_anchor_and_sunday_prep.sql) is
// applied loses only that one preference, never the core settings above.
const LATER_COLUMNS = {
  sundayPrepEnabled: 'sunday_prep_enabled',
};

const ALL_COLUMNS = { ...COLUMNS, ...LATER_COLUMNS };

// True when a settings patch touches anything that lives server-side.
export function touchesSyncedSettings(updates) {
  return Object.keys(updates).some((k) => k in ALL_COLUMNS);
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
  for (const [key, col] of Object.entries(ALL_COLUMNS)) {
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

  const later = {};
  for (const [key, col] of Object.entries(LATER_COLUMNS)) {
    if (settings[key] !== undefined) later[col] = settings[key];
  }
  if (Object.keys(later).length === 0) return;
  await supabase.from('user_settings').update(later).eq('user_id', userId);
}
