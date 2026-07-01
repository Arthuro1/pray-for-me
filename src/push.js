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
// Never hangs or throws. Safe to call repeatedly.
export async function enablePush(userId, { reminderTime = '07:00', lang = 'en' } = {}) {
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
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
        reminder_time: reminderTime,
        tz_offset: tzOffset(),
        lang,
        enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );
    return { error: error ? 'failed' : undefined };
  } catch {
    return { error: 'failed' };
  }
}

// Update reminder time / language for this device's subscription (if any).
export async function updatePushPrefs(userId, prefs = {}) {
  if (!pushSupported() || !userId) return;
  const reg = await swReady();
  const sub = reg && await reg.pushManager.getSubscription();
  if (!sub) return;
  const patch = { tz_offset: tzOffset(), updated_at: new Date().toISOString() };
  if (prefs.reminderTime) patch.reminder_time = prefs.reminderTime;
  if (prefs.lang) patch.lang = prefs.lang;
  await supabase.from('push_subscriptions').update(patch).eq('endpoint', sub.endpoint);
}

// Disable reminders for this device: unsubscribe locally and remove the row.
export async function disablePush() {
  const reg = await swReady();
  const sub = reg && await reg.pushManager.getSubscription();
  if (!sub) return;
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}
