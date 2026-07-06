// Day planner: which prayers belong to a given local day, from BOTH worlds —
// the new per-prayer schedules (src/lib/schedule.js) and the legacy weekly
// category plan (categories.week_days / prayers.week_days). Pure functions so
// the store, Home, and the calendar all agree on what "today" means.
import { occursOn, rotationForDay, addDays } from './schedule';
import { prayerPriority } from '../utils/prayer';

// Every planned entry for a day:
//   { prayer, source: 'once'|'recurring'|'days'|'category', slot: string|null }
// A prayer with its own `schedule` is governed ONLY by that schedule; legacy
// week_days / category logic applies to the rest (full backward compat).
export function prayersForDay(prayers, categories, dayKey) {
  const weekday = ((d) => d.getDay())(new Date(
    parseInt(dayKey.slice(0, 4), 10), parseInt(dayKey.slice(5, 7), 10) - 1, parseInt(dayKey.slice(8, 10), 10)
  ));
  const dayCats = categories.filter((c) => (c.week_days || []).includes(weekday));
  const dayCatIds = new Set(dayCats.map((c) => c.id));

  // Rotation picks per rotation-enabled category scheduled this day, over the
  // category's active legacy prayers ordered by creation (stable across devices).
  const rotationPickIds = new Map(); // catId -> Set(prayerIds)
  for (const cat of dayCats) {
    const perDay = cat.rotation?.perDay;
    if (!perDay) continue;
    const members = prayers
      .filter((p) => p.status === 'active' && !p.schedule && (p.prayer_categories || []).some((x) => x.category_id === cat.id))
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
      .map((p) => p.id);
    rotationPickIds.set(cat.id, new Set(rotationForDay(members, perDay, dayKey)));
  }

  const entries = [];
  for (const p of prayers) {
    if (p.status !== 'active') continue;
    if (p.schedule) {
      if (occursOn(p.schedule, dayKey, p.schedule_overrides || {})) {
        entries.push({ prayer: p, source: p.schedule.type === 'once' ? 'once' : 'recurring', slot: p.schedule.slot || null });
      }
      continue;
    }
    // Legacy: per-prayer weekday override wins; else categories; uncategorized = daily.
    if (p.week_days?.length) {
      if (p.week_days.includes(weekday)) entries.push({ prayer: p, source: 'days', slot: null });
      continue;
    }
    const catIds = (p.prayer_categories || []).map((pc) => pc.category_id);
    if (catIds.length === 0) {
      entries.push({ prayer: p, source: 'category', slot: null });
      continue;
    }
    const scheduledCats = catIds.filter((cid) => dayCatIds.has(cid));
    if (scheduledCats.length === 0) continue;
    // Visible if ANY scheduled category either has no rotation, or picked it today.
    const visible = scheduledCats.some((cid) => {
      const picks = rotationPickIds.get(cid);
      return !picks || picks.has(p.id);
    });
    if (visible) entries.push({ prayer: p, source: 'category', slot: null });
  }
  return entries;
}

// Sorts entries the way the lists expect: pinned first, then category priority.
export function sortEntries(entries, categories) {
  const orderById = Object.fromEntries(categories.map((c, i) => [c.id, i]));
  return [...entries].sort((a, b) => {
    const byPin = (b.prayer.pinned ? 1 : 0) - (a.prayer.pinned ? 1 : 0);
    if (byPin !== 0) return byPin;
    return prayerPriority(a.prayer, orderById) - prayerPriority(b.prayer, orderById);
  });
}

// Groups a day's entries by prayer-time slot for the agenda ("anytime" last).
export const SLOT_ORDER = ['morning', 'midday', 'evening', 'anytime'];
export function groupBySlot(entries) {
  const groups = { morning: [], midday: [], evening: [], anytime: [] };
  for (const e of entries) groups[e.slot && groups[e.slot] ? e.slot : 'anytime'].push(e);
  return groups;
}

// Missed prayers from the last `windowDays` days: scheduled then, not marked
// prayed then, still active, and not already on today's list (those are simply
// prayed today). completedDays: Map(prayerId -> Set('YYYY-MM-DD')).
// Returns [{ prayer, day }] oldest-first, one entry per prayer (earliest miss).
export function catchUpPrayers(prayers, categories, completedDays, todayKey, windowDays = 3) {
  const todayIds = new Set(prayersForDay(prayers, categories, todayKey).map((e) => e.prayer.id));
  const seen = new Set();
  const missed = [];
  for (let i = windowDays; i >= 1; i--) {
    const day = addDays(todayKey, -i);
    for (const { prayer } of prayersForDay(prayers, categories, day)) {
      if (seen.has(prayer.id) || todayIds.has(prayer.id)) continue;
      if (completedDays.get(prayer.id)?.has(day)) continue;
      seen.add(prayer.id);
      missed.push({ prayer, day });
    }
  }
  return missed;
}

// Calendar month summary: dayKey -> { once, recurring, plan } counts, cheap
// enough to recompute per render for a 31-day window.
export function monthDots(prayers, categories, monthDayKeys) {
  const out = {};
  for (const key of monthDayKeys) {
    let once = 0, recurring = 0, plan = 0;
    for (const e of prayersForDay(prayers, categories, key)) {
      if (e.source === 'once') once++;
      else if (e.source === 'recurring') recurring++;
      else plan++;
    }
    if (once || recurring || plan) out[key] = { once, recurring, plan };
  }
  return out;
}
