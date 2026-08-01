// Imported into the Workbox-generated service worker (see vite.config.js
// workbox.importScripts). Handles incoming Web Push messages and clicks for both
// the reminder pushes and the event-notification pushes
// (supabase/functions/send-event-notifications).
//
// SECURITY: the `url` in a payload is ALWAYS normalized against this app's own
// origin — a payload can never make us open an external site (see safePath).

// Parse a push message body into a plain object, tolerating non-JSON / empty
// payloads without throwing.
const LEGACY_USER_CACHE_NAMES = ['supabase-cache'];

async function deleteLegacyUserCaches() {
  await Promise.all(LEGACY_USER_CACHE_NAMES.map((name) => caches.delete(name)));
}

self.addEventListener('activate', (event) => {
  event.waitUntil(deleteLegacyUserCaches());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_USER_CACHES') {
    event.waitUntil(deleteLegacyUserCaches());
  }
});

function parsePushData(event) {
  try {
    return (event && event.data) ? event.data.json() : {};
  } catch (_) {
    return {};
  }
}

// Resolve a payload `url` to a SAFE, same-origin path. Anything that resolves to
// a different origin (or fails to parse) falls back to the app root, so a
// malformed or hostile payload can never navigate the user off-site.
function safePath(url) {
  try {
    const parsed = new URL(url || '/', self.location.origin);
    if (parsed.origin !== self.location.origin) return '/';
    return parsed.pathname + parsed.search + parsed.hash;
  } catch (_) {
    return '/';
  }
}

self.addEventListener('push', (event) => {
  const data = parsePushData(event);
  const title = data.title || 'Pray4Me 🙏';
  const path = safePath(data.url);
  // A stable tag collapses repeat pushes about the same entity instead of
  // stacking duplicates; renotify:false keeps a refresh from re-alerting.
  const tag = data.tag || 'pray4me';

  event.waitUntil((async () => {
    // Foreground suppression: if a visible app window is already showing the
    // exact target route, the in-app realtime inbox is handling this event —
    // don't also pop a system notification.
    try {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const focusedOnTarget = clientsList.some((c) => {
        if (c.visibilityState !== 'visible') return false;
        try { return new URL(c.url).pathname === path.split('?')[0].split('#')[0]; }
        catch (_) { return false; }
      });
      if (focusedOnTarget) return;
    } catch (_) { /* fall through and show the notification */ }

    await self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag,
      renotify: false,
      data: { url: path, notificationId: data.notificationId || null },
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = safePath(event.notification.data && event.notification.data.url);
  const target = new URL(path, self.location.origin).href;

  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Prefer an existing Pray4Me window: navigate it to the target and focus it,
    // rather than spawning a duplicate tab.
    for (const client of clientsList) {
      let sameOrigin = false;
      try { sameOrigin = new URL(client.url).origin === self.location.origin; } catch (_) { /* skip */ }
      if (!sameOrigin) continue;
      try {
        if ('navigate' in client) await client.navigate(target);
      } catch (_) { /* navigation may be disallowed — still focus */ }
      if ('focus' in client) return client.focus();
    }
    // No existing window → open a new one.
    if (self.clients.openWindow) return self.clients.openWindow(target);
  })());
});
