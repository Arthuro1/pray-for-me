import { notificationRoute } from './notificationRoutes';

// Notifications of the same kind that lead to the same place collapse into one
// row ("… and 2 others"): three friend requests are one thing to look at, not
// three. Read and unread never merge, so the unread dot stays honest. A row
// takes the place of its newest member — the input is newest-first.
export function groupNotifications(notifications) {
  const rows = [];
  const byKey = new Map();
  for (const n of notifications) {
    const key = [n.type, n.group_id || '', notificationRoute(n), n.read_at ? 'read' : 'unread'].join('|');
    const row = byKey.get(key);
    if (row) {
      row.ids.push(n.id);
      continue;
    }
    const next = { latest: n, ids: [n.id] };
    byKey.set(key, next);
    rows.push(next);
  }
  return rows;
}
