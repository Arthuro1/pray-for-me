// Day planner: which prayers belong to a given local day, from BOTH worlds —
// the new per-prayer schedules (src/lib/schedule.js) and the legacy weekly
// category plan (categories.week_days / prayers.week_days). Pure functions so
// the store, Home, and the calendar all agree on what "today" means.
import { occursOn, rotationForDay, addDays, seriesEnded, normalizeSchedule } from './schedule';
import { prayerPriority } from '../utils/prayer';

// Every planned entry for a day:
//   { prayer, source: 'once'|'recurring'|'days'|'category', slot: string|null }
// A prayer with its own `schedule` is governed ONLY by that schedule; legacy
// week_days / category logic applies to the rest (full backward compat).
//
// `cap` (settings.maxPerDay, "show a few per day"): when the day's list is
// longer than the cap, keep everything pinned or dated-once, and round-robin the
// rest so a big list stays coverable without one overwhelming day. Uncapped by
// default — Home and catch-up pass it, the month calendar shows the full plan.
export function prayersForDay(prayers, categories, dayKey, { cap = 0 } = {}) {
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
    // "No fixed schedule": lives in the Journal, never lands on a set day.
    if (p.schedule?.type === 'none') continue;
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

  // Global "a few per day" cap. Pinned and one-time-dated prayers are always
  // kept (they're deliberate for today); the rest round-robin by creation order
  // so coverage is fair and identical on every device for a given day.
  if (cap > 0 && entries.length > cap) {
    const keep = entries.filter((e) => e.source === 'once' || e.prayer.pinned);
    const rest = entries.filter((e) => !(e.source === 'once' || e.prayer.pinned));
    const slots = Math.max(0, cap - keep.length);
    const orderedIds = [...rest]
      .sort((a, b) => new Date(a.prayer.created_at || 0) - new Date(b.prayer.created_at || 0))
      .map((e) => e.prayer.id);
    const picked = new Set(rotationForDay(orderedIds, slots, dayKey));
    return [...keep, ...rest.filter((e) => picked.has(e.prayer.id))];
  }
  return entries;
}

// One-time client migration (Decision B): convert every legacy plan-following
// prayer — one with no `schedule` of its own — into an EXPLICIT schedule, read
// from the same rules the planner used to apply implicitly:
//   • a per-prayer weekday override, or the categories' planned weekdays → weekly
//   • uncategorized (no planned days anywhere) → daily (its old behaviour)
//   • categorized but with no planned day → "No fixed schedule" ({ type:'none' })
// Idempotent: a prayer that already has any schedule (including 'none') is left
// alone, so it runs once and then no-ops. Returns the updated prayers plus the
// list of { id, schedule } to persist.
export function migrateLegacySchedules(prayers, categories, todayKeyStr) {
  const changed = [];
  const next = prayers.map((p) => {
    if (p.schedule || p.status !== 'active') return p;
    const days = planWeekDays(categories, (p.prayer_categories || []).map((pc) => pc.category_id), p.week_days);
    let schedule;
    if (days === null) {
      schedule = normalizeSchedule({ type: 'recurring', freq: 'daily', end: { kind: 'never' } }, todayKeyStr);
    } else if (days.length === 0) {
      schedule = { type: 'none' };
    } else {
      schedule = normalizeSchedule({ type: 'recurring', freq: 'weekly', weekDays: days, end: { kind: 'never' } }, todayKeyStr);
    }
    changed.push({ id: p.id, schedule });
    return { ...p, schedule };
  });
  return { prayers: next, changed };
}

// A recurring series that can produce no more occurrences (end date past, or
// count consumed). One-time prayers are excluded on purpose: a past 'once'
// date often stays a live request; only a configured series end means "this
// plan is finished".
export function scheduleEnded(prayer, dayKey) {
  return prayer.schedule?.type === 'recurring' && seriesEnded(prayer.schedule, dayKey);
}

// Guided plans still running on `dayKey`: an active prayer references the plan
// AND its series can still occur. A finished run releases the plan, so the
// journey can be started again.
export function runningPlanIds(prayers, dayKey) {
  const ids = new Set();
  for (const p of prayers) {
    if (p.status === 'active' && p.schedule?.plan?.id && !scheduleEnded(p, dayKey)) ids.add(p.schedule.plan.id);
  }
  return ids;
}

// Which weekdays a plan-following (unscheduled) prayer actually lands on, read
// from the SAME rules prayersForDay applies above: a per-prayer weekday
// override wins, then the categories' weekly plan, and an uncategorized prayer
// returns every day. Lets the scheduler SHOW what "follow my normal rhythm"
// means instead of asking the user to remember their plan.
//   null → every day        [] → no day at all (categories set, none planned)
export function planWeekDays(categories = [], categoryIds = [], prayerWeekDays = null) {
  if (prayerWeekDays?.length) return [...new Set(prayerWeekDays)].sort((a, b) => a - b);
  if (!categoryIds.length) return null;
  const ids = new Set(categoryIds);
  const days = new Set();
  for (const c of categories) {
    if (ids.has(c.id)) (c.week_days || []).forEach((d) => days.add(d));
  }
  return [...days].sort((a, b) => a - b);
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

// Missed prayers from the last `windowDays` days: scheduled then, not prayed
// since (a completion on the missed day OR any later day — e.g. Pray now from
// the detail page today — counts as caught up), still active, and not already
// on today's list (those are simply prayed today).
// completedDays: Map(prayerId -> Set('YYYY-MM-DD')).
// Returns [{ prayer, day }] oldest-first, one entry per prayer (earliest miss).
export function catchUpPrayers(prayers, categories, completedDays, todayKey, windowDays = 3, cap = 0) {
  const todayIds = new Set(prayersForDay(prayers, categories, todayKey, { cap }).map((e) => e.prayer.id));
  // ISO day keys compare lexicographically, so `d >= day` is a date comparison.
  const prayedSince = (id, day) => {
    for (const d of completedDays.get(id) || []) if (d >= day) return true;
    return false;
  };
  const seen = new Set();
  const missed = [];
  for (let i = windowDays; i >= 1; i--) {
    const day = addDays(todayKey, -i);
    for (const { prayer } of prayersForDay(prayers, categories, day, { cap })) {
      if (seen.has(prayer.id) || todayIds.has(prayer.id)) continue;
      if (prayedSince(prayer.id, day)) continue;
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
