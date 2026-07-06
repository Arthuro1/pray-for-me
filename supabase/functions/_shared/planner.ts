// Server port of the day planner (src/lib/planner.js, prayersForDay only). Given
// a user's prayers + categories and a LOCAL day key, returns the prayers due
// that day from BOTH worlds — per-prayer schedules and the legacy weekly
// category plan (including rotation) — so the reminder count matches the app.
// If you change the planning rules here, change src/lib/planner.js too.
import { occursOn, rotationForDay, type Schedule, type Overrides } from './schedule.ts';

export interface PlannerPrayer {
  id: string;
  title?: string;
  status?: string;
  created_at?: string;
  schedule?: Schedule | null;
  schedule_overrides?: Overrides | null;
  week_days?: number[] | null;
  prayer_categories?: { category_id: string }[] | null;
  [key: string]: unknown;
}

export interface PlannerCategory {
  id: string;
  week_days?: number[] | null;
  rotation?: { perDay?: number } | null;
}

// Weekday (0=Sun) of a calendar day key — timezone-independent for a pure date.
function weekdayOf(dayKey: string): number {
  return new Date(
    parseInt(dayKey.slice(0, 4), 10),
    parseInt(dayKey.slice(5, 7), 10) - 1,
    parseInt(dayKey.slice(8, 10), 10),
  ).getDay();
}

// The active prayers due on `dayKey`. A prayer with its own `schedule` is
// governed ONLY by that schedule; everything else follows legacy week_days /
// category rules with rotation applied.
export function prayersForDay(
  prayers: PlannerPrayer[],
  categories: PlannerCategory[],
  dayKey: string,
): PlannerPrayer[] {
  const weekday = weekdayOf(dayKey);
  const dayCats = categories.filter((c) => (c.week_days || []).includes(weekday));
  const dayCatIds = new Set(dayCats.map((c) => c.id));

  const rotationPickIds = new Map<string, Set<string>>();
  for (const cat of dayCats) {
    const perDay = cat.rotation?.perDay;
    if (!perDay) continue;
    const members = prayers
      .filter((p) => p.status === 'active' && !p.schedule && (p.prayer_categories || []).some((x) => x.category_id === cat.id))
      .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
      .map((p) => p.id);
    rotationPickIds.set(cat.id, new Set(rotationForDay(members, perDay, dayKey)));
  }

  const due: PlannerPrayer[] = [];
  for (const p of prayers) {
    if (p.status !== 'active') continue;
    if (p.schedule) {
      if (occursOn(p.schedule, dayKey, p.schedule_overrides || {})) due.push(p);
      continue;
    }
    if (p.week_days?.length) {
      if (p.week_days.includes(weekday)) due.push(p);
      continue;
    }
    const catIds = (p.prayer_categories || []).map((pc) => pc.category_id);
    if (catIds.length === 0) {
      due.push(p);
      continue;
    }
    const scheduledCats = catIds.filter((cid) => dayCatIds.has(cid));
    if (scheduledCats.length === 0) continue;
    const visible = scheduledCats.some((cid) => {
      const picks = rotationPickIds.get(cid);
      return !picks || picks.has(p.id);
    });
    if (visible) due.push(p);
  }
  return due;
}
