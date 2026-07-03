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

// Ask permission, subscribe via the service worker, and store the subscription
// in Supabase. Returns { error } on failure ('denied' | 'unsupported' | 'failed').
// Never hangs or throws. Safe to call repeatedly. `followUpEnabled`/`followUpDays`
// are omitted from the upsert (leaving any existing value untouched) unless
// explicitly passed, so enabling the daily reminder alone doesn't clobber the
// follow-up reminder's independent state on their shared subscription row —
// callers must pass the current `enabled` explicitly to preserve it likewise.
export async function enablePush(userId, { reminderTime = '07:00', lang = 'en', enabled, followUpEnabled, followUpDays } = {}) {
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
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const json = sub.toJSON();
    const payload = {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      reminder_time: reminderTime,
      tz_offset: tzOffset(),
      lang,
      enabled: enabled === undefined ? true : enabled,
      updated_at: new Date().toISOString(),
    };
    if (followUpEnabled !== undefined) payload.follow_up_enabled = followUpEnabled;
    if (followUpDays !== undefined) payload.follow_up_days = followUpDays;
    const { error } = await supabase.from('push_subscriptions').upsert(payload, { onConflict: 'endpoint' });
    return { error: error ? 'failed' : undefined };
  } catch {
    return { error: 'failed' };
  }
}

// Update reminder time / language / reminder toggles for this device's
// subscription (if any). Only the passed fields are touched.
export async function updatePushPrefs(userId, prefs = {}) {
  if (!pushSupported() || !userId) return;
  const reg = await swReady();
  const sub = reg && await reg.pushManager.getSubscription();
  if (!sub) return;
  const patch = { tz_offset: tzOffset(), updated_at: new Date().toISOString() };
  if (prefs.reminderTime) patch.reminder_time = prefs.reminderTime;
  if (prefs.lang) patch.lang = prefs.lang;
  if (prefs.enabled !== undefined) patch.enabled = prefs.enabled;
  if (prefs.followUpEnabled !== undefined) patch.follow_up_enabled = prefs.followUpEnabled;
  if (prefs.followUpDays !== undefined) patch.follow_up_days = prefs.followUpDays;
  await supabase.from('push_subscriptions').update(patch).eq('endpoint', sub.endpoint);
}

// Reads this device's last-follow-up-sent timestamp (set server-side by
// send-follow-up-reminder), so Settings can show when the next one is due.
// Null if never sent yet or there's no subscription for this device.
export async function getFollowUpLastSent() {
  const reg = await swReady();
  const sub = reg && await reg.pushManager.getSubscription();
  if (!sub) return null;
  const { data } = await supabase
    .from('push_subscriptions')
    .select('last_follow_up_sent_at')
    .eq('endpoint', sub.endpoint)
    .maybeSingle();
  return data?.last_follow_up_sent_at || null;
}

// Disable reminders for this device: unsubscribe locally and remove the row.
export async function disablePush() {
  const reg = await swReady();
  const sub = reg && await reg.pushManager.getSubscription();
  if (!sub) return;
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}
