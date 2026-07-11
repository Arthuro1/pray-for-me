// Bridges a deep-link "join intent" across the auth/registration boundary.
//
// An anonymous visitor who opens an invite link (/community/join/:code or
// /community/add-friend/:id) is shown the auth screen, which discards the URL —
// and email confirmation / OAuth then redirect to the site root, losing it for
// good. We stash the intended path here so it can be replayed once the visitor
// finishes signing in, completing the join they originally clicked.
const KEY = 'pfm_pending_invite';

const INVITE_RE = /^\/community\/(join|add-friend)\//;

// True for the routes an anonymous visitor might land on from a shared link.
export function isInvitePath(path) {
  return INVITE_RE.test(path || '');
}

export function savePendingInvite(path) {
  try { localStorage.setItem(KEY, path); } catch { /* storage unavailable */ }
}

// Reads and clears the stashed path (one-shot, so a replay can't loop).
export function takePendingInvite() {
  try {
    const path = localStorage.getItem(KEY);
    if (path) localStorage.removeItem(KEY);
    return path;
  } catch {
    return null;
  }
}

// Where email-confirmation / OAuth should return the user: the current path,
// minus any query string, so a CROSS-device confirmation (link opened in a
// browser that never stashed the invite) still lands back on it instead of the
// site root. Requires the origin's `<origin>/**` to be on the Supabase Auth
// "Redirect URLs" allow-list; otherwise Supabase safely falls back to the Site
// URL (root), and the localStorage replay still covers same-browser flows.
export function authRedirectTarget() {
  try {
    return window.location.origin + window.location.pathname;
  } catch {
    return undefined;
  }
}
