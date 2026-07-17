// First-group checklist: a lightweight, dismissible nudge that walks a new
// group leader from "created a group" to "praying together" — invite, first
// request, pray. State is derived from live group data wherever possible;
// localStorage only records what the server can't know (a dismissal, a share
// tap, a begun prayer) so steps complete themselves as the group comes alive.
const KEY = 'pfm_group_checklist';

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function write(map) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch { /* storage unavailable */ }
}

// { dismissed?: true, invited?: true, prayed?: true } for one group.
export function checklistFlags(groupId) {
  return (groupId && read()[groupId]) || {};
}

export function setChecklistFlag(groupId, flag) {
  if (!groupId || !flag) return;
  const map = read();
  map[groupId] = { ...(map[groupId] || {}), [flag]: true };
  write(map);
}

export function dismissChecklist(groupId) {
  setChecklistFlag(groupId, 'dismissed');
}

// The three steps with their live completion state. `memberCount` includes the
// leader; `hasPrayed` is any "I'm praying" of the user's inside this group.
export function checklistSteps({ memberCount = 1, requestCount = 0, hasPrayed = false, flags = {} }) {
  return [
    { id: 'invite', done: memberCount >= 2 || !!flags.invited },
    { id: 'request', done: requestCount > 0 },
    { id: 'pray', done: hasPrayed || !!flags.prayed },
  ];
}

// Visible while the leader hasn't dismissed it and something remains to do —
// it disappears by itself once the group is up and praying.
export function checklistVisible(groupId, steps) {
  if (checklistFlags(groupId).dismissed) return false;
  return steps.some((s) => !s.done);
}
