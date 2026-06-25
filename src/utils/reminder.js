// When the next daily reminder will fire, given a "HH:MM" time. If that time
// has already passed today, it's tomorrow. Pure so it can be unit-tested.
export function nextReminder(timeStr, now = new Date()) {
  const [h, m] = (timeStr || '07:00').split(':').map((n) => parseInt(n, 10) || 0);
  const pad = (n) => String(n).padStart(2, '0');
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  return { tomorrow: next <= now, time: `${pad(h)}:${pad(m)}` };
}
