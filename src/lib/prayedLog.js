// Local record of days the user completed a guided prayer session, so a session
// counts toward the streak even if no prayer was edited/answered that day.
const KEY = 'pfm_prayed_days';
const pad = (n) => String(n).padStart(2, '0');
const todayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

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
