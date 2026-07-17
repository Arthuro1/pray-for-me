import { supabase } from './lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

const tzOffset = () => -new Date().getTimezoneOffset(); // minutes to add to UTC for local time

// IANA timezone (e.g. 'Europe/Berlin'). This is the primary timezone
// representation for notification scheduling / quiet hours — it stays correct
// across daylight-saving changes, unlike a fixed numeric offset. tz_offset is
// still written alongside it for backward compatibility with the existing
// reminder schedulers.
const tzName = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch { return null; }
};

// Resolve the active service worker registration WITHOUT hanging. `serviceWorker
// .ready` never resolves when no SW is registered (e.g. `npm run dev`, or a
// failed registration), which would otherwise freeze the caller. Give up after
// a short timeout and return null so callers can fall back gracefully.
async function swReady(timeoutMs = 3000) {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
  } catch {
    return null;
  }
}

// A PushSubscription is permanently bound to the applicationServerKey it was
// created with — if VAPID_PUBLIC_KEY has rotated since this device subscribed,
// server sends fail auth silently. Detect that before trusting an existing sub.
function boundToCurrentKey(sub) {
  try {
    const current = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    const bound = new Uint8Array(sub.options.applicationServerKey);
    return bound.length === current.length && bound.every((b, i) => b === current[i]);
  } catch {
    return false;
  }
}

// The push_subscriptions row for this device. Follow-up fields are included
// only when explicitly passed (leaving any existing value untouched), so
// enabling the daily reminder alone doesn't clobber the follow-up reminder's
// independent state on their shared subscription row.
function subscriptionRow(userId, sub, { reminderTime = '07:00', lang = 'en', enabled, followUpEnabled, followUpDays, followUpTime }) {
  const json = sub.toJSON();
  const row = {
    user_id: userId,
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
    reminder_time: reminderTime,
    tz_offset: tzOffset(),
    timezone: tzName(),
    lang,
    enabled: enabled === undefined ? true : enabled,
    updated_at: new Date().toISOString(),
  };
  if (followUpEnabled !== undefined) row.follow_up_enabled = followUpEnabled;
  if (followUpDays !== undefined) row.follow_up_days = followUpDays;
  if (followUpTime !== undefined) row.follow_up_time = followUpTime;
  return row;
}

// Ask permission, subscribe via the service worker, and store the subscription
// in Supabase. Returns { error } on failure ('denied' | 'unsupported' | 'failed').
// Never hangs or throws. Safe to call repeatedly. Callers must pass the current
// `enabled` explicitly to preserve it (see subscriptionRow).
export async function enablePush(userId, { reminderTime = '07:00', lang = 'en', enabled, followUpEnabled, followUpDays, followUpTime } = {}) {
  if (!pushSupported() || !VAPID_PUBLIC_KEY || !userId) return { error: 'unsupported' };

  let permission;
  try {
    permission = await Notification.requestPermission();
  } catch {
    return { error: 'unsupported' };
  }
  if (permission !== 'granted') return { error: 'denied' };

  const reg = await swReady();
  if (!reg) return { error: 'unsupported' }; // no service worker (dev / registration failed)

  try {
    // Always re-subscribe rather than reusing whatever's already registered,
    // in case VAPID_PUBLIC_KEY was rotated since this device last subscribed
    // (see boundToCurrentKey — an explicit enable is the safest moment to
    // refresh the binding).
    let sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    const { error } = await supabase.from('push_subscriptions').upsert(
      subscriptionRow(userId, sub, { reminderTime, lang, enabled, followUpEnabled, followUpDays, followUpTime }),
      { onConflict: 'endpoint' }
    );
    return { error: error ? 'failed' : undefined };
  } catch {
    return { error: 'failed' };
  }
}

// Subscribe THIS device for community/event Web Push, independent of the daily
// and follow-up reminders. Those live on `enabled`/`follow_up_enabled`; event
// push is gated only by the account-level notification_preferences.push_enabled.
// So all we need here is a live push endpoint on file — we must NOT flip the
// reminder flags. Returns { error } like enablePush ('denied' | 'unsupported' |
// 'failed'). Never hangs or throws.
export async function subscribeDeviceForPush(userId, { lang = 'en' } = {}) {
  if (!pushSupported() || !VAPID_PUBLIC_KEY || !userId) return { error: 'unsupported' };

  let permission;
  try {
    permission = await Notification.requestPermission();
  } catch {
    return { error: 'unsupported' };
  }
  if (permission !== 'granted') return { error: 'denied' };

  const reg = await swReady();
  if (!reg) return { error: 'unsupported' }; // no service worker (dev / registration failed)

  try {
    let sub = await reg.pushManager.getSubscription();
    if (sub && !boundToCurrentKey(sub)) {
      await sub.unsubscribe(); // stale VAPID binding — sends would fail silently
      sub = null;
    }
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    // Preserve any existing daily-reminder `enabled` on this endpoint; a brand-new
    // row defaults to enabled=false so subscribing for event push never silently
    // switches the daily reminder on (the column default is true — see
    // push_notifications.sql).
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('enabled')
      .eq('endpoint', sub.endpoint)
      .maybeSingle();
    const json = sub.toJSON();
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      lang,
      enabled: existing?.enabled ?? false,
      tz_offset: tzOffset(),
      timezone: tzName(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' });
    return { error: error ? 'failed' : undefined };
  } catch {
    return { error: 'failed' };
  }
}

// Silently re-align this device with the account's settings on app load.
// Reminder AND event-push prefs are account-level, so a device enabled in one
// browser must also be delivered by every other signed-in browser: if this
// device already granted notification permission, make sure it holds a live
// subscription bound to the current VAPID key, with the account prefs on its
// row. `eventPushEnabled` (notification_preferences.push_enabled) is a third
// reason to keep the subscription alive — it lets a "Push notifications" toggle
// flipped on one device propagate to every other permission-granted device.
// Never prompts — devices that haven't granted permission are left alone until
// the user flips a toggle there explicitly (the browser forbids subscribing
// without a prior permission grant).
export async function ensurePushSubscription(userId, settings = {}, eventPushEnabled = false) {
  if (!pushSupported() || !VAPID_PUBLIC_KEY || !userId) return;
  if (!settings.dailyReminderEnabled && !settings.followUpEnabled && !eventPushEnabled) return;
  if (Notification.permission !== 'granted') return;
  const reg = await swReady();
  if (!reg) return;

  try {
    let sub = await reg.pushManager.getSubscription();
    if (sub && !boundToCurrentKey(sub)) {
      await sub.unsubscribe(); // stale VAPID binding — sends would fail silently
      sub = null;
    }
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    await supabase.from('push_subscriptions').upsert(
      subscriptionRow(userId, sub, {
        reminderTime: settings.dailyReminderTime,
        lang: settings.language,
        enabled: !!settings.dailyReminderEnabled,
        followUpEnabled: !!settings.followUpEnabled,
        followUpDays: settings.followUpDays,
        followUpTime: settings.followUpTime,
      }),
      { onConflict: 'endpoint' }
    );
  } catch {
    // best-effort — an explicit toggle in Settings can still repair this device
  }
}

// Update reminder time / language / reminder toggles on ALL of the user's
// device subscriptions. These prefs are account-level, so a change made in one
// browser must reach the rows the schedulers read for every device. Only the
// passed fields are touched. tz_offset is genuinely per-device and is only
// re-stamped on this browser's own row.
export async function updatePushPrefs(userId, prefs = {}) {
  if (!userId) return;
  const now = new Date().toISOString();
  const patch = { updated_at: now };
  if (prefs.reminderTime) patch.reminder_time = prefs.reminderTime;
  if (prefs.lang) patch.lang = prefs.lang;
  if (prefs.enabled !== undefined) patch.enabled = prefs.enabled;
  if (prefs.followUpEnabled !== undefined) patch.follow_up_enabled = prefs.followUpEnabled;
  if (prefs.followUpDays !== undefined) patch.follow_up_days = prefs.followUpDays;
  if (prefs.followUpTime) patch.follow_up_time = prefs.followUpTime;
  // Notification privacy: what a push may reveal ('generic' | 'count'). Mirrored
  // onto every device row so the schedulers read it per-send (notify.ts).
  if (prefs.notificationDetail) patch.notification_detail = prefs.notificationDetail;
  // Cadence anchor — stamped when the user enables follow-ups so the first
  // one arrives a full follow_up_days later (the server otherwise stamps it
  // on its next pass; see send-follow-up-reminder).
  if (prefs.followUpLastSentAt) patch.last_follow_up_sent_at = prefs.followUpLastSentAt;
  await supabase.from('push_subscriptions').update(patch).eq('user_id', userId);

  const reg = await swReady();
  const sub = reg && await reg.pushManager.getSubscription();
  if (sub) {
    await supabase.from('push_subscriptions')
      .update({ tz_offset: tzOffset(), timezone: tzName(), updated_at: now })
      .eq('endpoint', sub.endpoint);
  }
}

// Reads the account's most recent follow-up-sent timestamp (set server-side by
// send-follow-up-reminder on whichever device row it pushed to), so Settings
// can show when the next one is due. Null if never sent yet.
export async function getFollowUpLastSent(userId) {
  if (!userId) return null;
  const { data } = await supabase
    .from('push_subscriptions')
    .select('last_follow_up_sent_at')
    .eq('user_id', userId)
    .not('last_follow_up_sent_at', 'is', null)
    .order('last_follow_up_sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.last_follow_up_sent_at || null;
}
