export const LEGACY_USER_CACHE_NAMES = Object.freeze(['supabase-cache']);

export async function deleteLegacyUserCaches(cacheStorage = globalThis.caches) {
  if (!cacheStorage?.delete) return;
  await Promise.all(LEGACY_USER_CACHE_NAMES.map((name) => cacheStorage.delete(name)));
}

export async function clearServiceWorkerUserCaches({
  cacheStorage = globalThis.caches,
  serviceWorker = globalThis.navigator?.serviceWorker,
} = {}) {
  await deleteLegacyUserCaches(cacheStorage);
  const targets = new Set();
  if (serviceWorker?.controller) targets.add(serviceWorker.controller);
  try {
    const registration = await serviceWorker?.getRegistration?.();
    if (registration?.active) targets.add(registration.active);
    if (registration?.waiting) targets.add(registration.waiting);
    if (registration?.installing) targets.add(registration.installing);
  } catch {
    // Cache deletion is the security boundary; messaging is best-effort.
  }
  for (const target of targets) target.postMessage?.({ type: 'CLEAR_USER_CACHES' });
}
