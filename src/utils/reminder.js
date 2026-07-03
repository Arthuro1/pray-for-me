// When the next daily reminder will fire, given a "HH:MM" time. If that time
// has already passed today, it's tomorrow. Pure so it can be unit-tested.
export function nextReminder(timeStr, now = new Date()) {
  const [h, m] = (timeStr || '07:00').split(':').map((n) => parseInt(n, 10) || 0);
  const pad = (n) => String(n).padStart(2, '0');
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  return { tomorrow: next <= now, time: `${pad(h)}:${pad(m)}` };
}

// When the next follow-up reminder will fire, given the cadence anchor (the
// last time one was sent, or the moment follow-up was enabled), the cadence
// in days, and the follow-up delivery time. With no anchor yet the count
// starts now, so the shown date always sits one full cadence out and moves
// when the user picks a different frequency. Mirrors followUpDue() in the
// send-follow-up-reminder Edge Function so the UI matches what the server
// will actually do. Pure so it can be unit-tested.
export function nextFollowUp(lastSentAt, days, timeStr, now = new Date()) {
  const [h, m] = (timeStr || '07:00').split(':').map((n) => parseInt(n, 10) || 0);
  const pad = (n) => String(n).padStart(2, '0');
  const anchor = lastSentAt ? new Date(lastSentAt) : now;
  const dueAt = new Date(anchor.getTime() + (days || 7) * 86400000);

  const target = new Date(Math.max(dueAt.getTime(), now.getTime()));
  target.setHours(h, m, 0, 0);
  while (target < dueAt || target <= now) target.setDate(target.getDate() + 1);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTarget = new Date(target);
  startOfTarget.setHours(0, 0, 0, 0);
  const daysAhead = Math.round((startOfTarget - startOfToday) / 86400000);

  return { date: target, daysAhead, time: `${pad(h)}:${pad(m)}` };
}
