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
// leader; `hasPrayed` is any confirmed prayer action of the user's inside this
// group ("I'm praying" / Pray now on a request). The pray step can NEVER be
// complete while the group has no request — praying requires something to pray
// for, and a stale local flag must not fake the sequence.
//
// `blocked` says the same thing to the UI in advance: with nothing to pray for,
// the row must not offer "Begin praying" as though it were available. It sends
// the leader to add the first request instead, which is the honest next step.
export function checklistSteps({ memberCount = 1, requestCount = 0, hasPrayed = false, flags = {} }) {
  const hasRequest = requestCount > 0;
  return [
    { id: 'invite', done: memberCount >= 2 || !!flags.invited },
    { id: 'request', done: hasRequest },
    { id: 'pray', done: hasRequest && (hasPrayed || !!flags.prayed), blocked: !hasRequest },
  ];
}

// Visible while the leader hasn't dismissed it and something remains to do —
// it disappears by itself once the group is up and praying.
export function checklistVisible(groupId, steps) {
  if (checklistFlags(groupId).dismissed) return false;
  return steps.some((s) => !s.done);
}
