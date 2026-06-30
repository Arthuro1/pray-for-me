// Local record of days the user completed a guided prayer session, so the home
// screen can gently note when you haven't prayed yet today (not a streak/score).
const KEY = 'pfm_prayed_days';
const pad = (n) => String(n).padStart(2, '0');

// Today's local date key (YYYY-MM-DD) — exported so callers can check membership.
export const todayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function getPrayedDays() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function markPrayedToday() {
  const days = getPrayedDays();
  const today = todayKey();
  if (!days.includes(today)) {
    localStorage.setItem(KEY, JSON.stringify([...days, today].slice(-400)));
  }
  return getPrayedDays();
}
