import { testimonyList } from './prayer';

const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// The set of local calendar days on which the user touched their journal:
// created or edited a prayer, posted an update, answered one, or wrote a testimony.
export function activityDays(prayers = []) {
  const days = new Set();
  const add = (v) => { if (v) days.add(dayKey(new Date(v))); };
  for (const p of prayers) {
    add(p.created_at); add(p.updated_at); add(p.answered_at);
    (p.prayer_updates || []).forEach((u) => add(u.created_at));
    testimonyList(p).forEach((tm) => add(tm.created_at));
  }
  return days;
}

// Consecutive days of journal activity ending today (or yesterday, so the
// streak survives until the day is over). Returns 0 if neither has activity.
export function computeStreak(prayers = [], today = new Date()) {
  const days = activityDays(prayers);
  if (days.size === 0) return 0;
  let cursor = startOfDay(today);
  if (!days.has(dayKey(cursor))) {
    cursor = addDays(cursor, -1);
    if (!days.has(dayKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

// Counts of prayers answered and testimonies written in the last 7 days.
export function weeklyRecap(prayers = [], now = new Date()) {
  const since = addDays(startOfDay(now), -6);
  let answered = 0;
  let testimonies = 0;
  for (const p of prayers) {
    if (p.answered_at && new Date(p.answered_at) >= since) answered++;
    for (const tm of testimonyList(p)) {
      if (tm.created_at && new Date(tm.created_at) >= since) testimonies++;
    }
  }
  return { answered, testimonies };
}
