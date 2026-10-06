// Single source of truth for mapping a notification (type + metadata) to an
// internal application route. Used by the inbox UI and toasts so route strings
// are never re-derived in multiple components.
//
// This is the client-side twin of supabase/functions/_shared/eventNotify.ts's
// eventUrl(); a parity test (notificationRoutes.test.js) keeps them in lock-step
// so a push deep-link and an in-app click always land on the same page.
//
// Identifiers are validated as UUIDs before being placed in a route, so a
// malformed/forged metadata value can never build a broken or off-site link.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);

export function notificationRoute(notification) {
  const type = notification?.type;
  const meta = notification?.metadata || {};
  const group = meta.group_id;
  const prayer = meta.community_prayer_id;

  switch (type) {
    case 'community_update':
    case 'answered':
    case 'reaction_bucket':
    case 'testimony':
      if (isUuid(group) && isUuid(prayer)) return `/community/group/${group}/prayer/${prayer}`;
      if (isUuid(group)) return `/community/group/${group}`;
      return '/community';
    case 'group_prayer_added':
    case 'membership_change':
    case 'role_change':
      return isUuid(group) ? `/community/group/${group}` : '/community';
    case 'friend_request':
    case 'group_invitation':
      return '/community';
    case 'plan_invitation':
      return '/community';
    default:
      return '/community';
  }
}
