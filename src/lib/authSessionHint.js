// A content-free bootstrap hint that lets the lightweight anonymous shell decide
// whether it should load the authenticated Supabase application. It stores only
// the presence of a session, never a user id, token, email, or prayer metadata.
export const AUTH_SESSION_HINT_KEY = 'pfm_auth_session_present';

function safeStorage(storage = globalThis.localStorage) {
  try {
    return storage;
  } catch {
    return null;
  }
}

export function setAuthSessionHint(present, storage = globalThis.localStorage) {
  try {
    if (present) safeStorage(storage)?.setItem(AUTH_SESSION_HINT_KEY, '1');
    else safeStorage(storage)?.removeItem(AUTH_SESSION_HINT_KEY);
  } catch {
    // Best-effort bootstrap optimization. Supabase remains the source of truth.
  }
}

export function hasAuthSessionHint(storage = globalThis.localStorage) {
  try {
    const store = safeStorage(storage);
    if (store?.getItem(AUTH_SESSION_HINT_KEY) === '1') return true;

    // Migration path for sessions created before the content-free hint existed:
    // detect Supabase's persisted-session slot by key name without reading the
    // token value. The full auth client still validates the session after load.
    for (let index = 0; index < (store?.length || 0); index += 1) {
      const key = store.key(index);
      if (key && /^sb-[a-z0-9_-]+-auth-token$/i.test(key)) return true;
    }
  } catch {
    // Restricted storage means no reliable hint; stay on the private landing.
  }
  return false;
}

export function hasAuthCallback(location = globalThis.location) {
  if (!location) return false;
  const search = new URLSearchParams(location.search || '');
  const hash = new URLSearchParams((location.hash || '').replace(/^#/, ''));
  return (
    search.has('code')
    || search.has('token_hash')
    || search.has('error')
    || search.has('error_code')
    || hash.has('access_token')
    || hash.has('refresh_token')
    || hash.has('error')
    || hash.has('error_code')
  );
}

export function shouldLoadAuthenticatedShell(
  location = globalThis.location,
  storage = globalThis.localStorage,
) {
  if (!location) return hasAuthSessionHint(storage);
  if ((location.pathname || '/') !== '/') return true;
  return hasAuthSessionHint(storage) || hasAuthCallback(location);
}
