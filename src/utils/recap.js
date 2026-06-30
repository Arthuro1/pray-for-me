import { testimonyList } from './prayer';

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

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
