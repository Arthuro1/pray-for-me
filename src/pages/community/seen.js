// Per-group "last visited" timestamps, kept device-local (localStorage) to
// compute the Community hub's unread badges and cleared when a group is opened.
// Shared by useCommunityHubData (reads it to badge groups) and GroupView (marks
// a group seen on open).
const SEEN_KEY = 'pfm_group_seen';

export function readSeen() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch { return {}; }
}

export function markGroupSeen(groupId) {
  const m = readSeen();
  m[groupId] = new Date().toISOString();
  localStorage.setItem(SEEN_KEY, JSON.stringify(m));
}
