// Pure helpers for GROUP prayer plans — a plan a whole group is walking through
// together (see supabase/group_plans.sql). Kept free of React/Supabase so the
// display logic (status, ordering, the warm "who's praying" line) is unit-tested
// directly. A group plan row is { plan_id, start_date, participantCount,
// joinedByMe, ... }; start_date is an ISO 'YYYY-MM-DD' local day key.

// Is the group already praying this (start day reached), or is it still upcoming?
export function groupPlanStatus(startDate, today) {
  return startDate && startDate <= today ? 'running' : 'upcoming';
}

// Order for display: plans being prayed now first (earliest start first), then
// upcoming ones (soonest start first). Stable and non-mutating.
export function sortGroupPlans(plans, today) {
  const rank = (p) => (groupPlanStatus(p.start_date, today) === 'running' ? 0 : 1);
  return [...plans].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    return (a.start_date || '').localeCompare(b.start_date || '');
  });
}

// The warm, non-numeric-leaderboard "who's praying" fragment shown beside a
// plan's status. Returns an { key, vars } pair for t(); `count` is the total
// number praying (including the viewer when joinedByMe).
export function prayingLabel({ count = 0, joinedByMe = false } = {}) {
  if (joinedByMe) {
    const others = Math.max(0, count - 1);
    return others === 0
      ? { key: 'groupPlanCountJustYou', vars: {} }
      : { key: 'groupPlanCountYouPlus', vars: { n: others } };
  }
  return count === 0
    ? { key: 'groupPlanCountNone', vars: {} }
    : { key: 'groupPlanCountOthers', vars: { n: count } };
}
