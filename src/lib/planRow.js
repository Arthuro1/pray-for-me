// How a running guided plan READS in a list row.
//
// A plan run is an ordinary prayer carrying schedule.plan (see guidedPlan.js),
// so every list rendered it through the generic recurrence machinery — "Every
// day · 30 times" — which says nothing about the journey it actually is. The
// calendar's day agenda already read a plan day properly ("Day 12 of 30 ·
// <theme>"); this is that same reading, shared so Journal and Today agree with
// the agenda, the detail page and the session on what a plan row is called.
import { getPlan, planDayContent } from '../content/prayerPlans';
import { pick } from '../content/teaching';
import { t } from '../i18n';
import { planPrayerText } from './guidedPlan';
import { canUsePlan } from './planReview';
import { planTotal } from './planTempo';
import { todayKey } from './prayedLog';
import { restingPlanDay } from './schedule';

// What a plan run says on `dayKey`:
//
//   { name, theme, dayLabel, paused }
//
// null when the prayer is not a plan run whose content can be read — no plan,
// or content that is unknown or still awaiting its review sign-off. Callers
// then keep the ordinary prayer rendering.
//
// `name` comes from the PLAN CONTENT in the reader's language, never from the
// title stored when the run started: a run begun in French kept showing its
// French name to a German reader, with the AI-translate toggle offered over a
// name that is already authored in all 16 locales.
//
// The day is read with restingPlanDay, not planDayNumber, because a row is
// shown on days the run does not land on — a weekly or alternating pace, a
// skipped or moved day, a paused run — and every one of those reported no day
// at all before. `theme` is '' on a day the plan has no content for (a run
// walked past its last day), and the row falls back to the plan's name.
export function planRowSummary(prayer, lang, dayKey = todayKey()) {
  const ref = prayer?.schedule?.plan;
  if (!ref?.id) return null;
  const plan = getPlan(ref.id, ref.version || null);
  if (!canUsePlan(plan)) return null;

  const resting = restingPlanDay(prayer.schedule, dayKey, prayer.schedule_overrides || {});
  const dayNo = resting?.dayNo ?? null;
  const total = plan.count || planTotal(prayer.schedule) || '';
  const content = dayNo ? planDayContent(ref.id, dayNo, plan) : null;

  return {
    name: planPrayerText(plan, lang)?.title || '',
    theme: content ? pick(content.theme, lang) : '',
    dayLabel: dayNo ? t(lang, 'planDayOf', { n: dayNo, total }) : '',
    // A paused run has no dates at all, so it never reaches Today and would sit
    // in the Journal reading exactly like a running one — silently never coming
    // up again. The row says so instead.
    paused: resting?.state === 'paused',
  };
}

// The one line under a Today row, and the eyebrow over the hero card: which
// plan this is and how far in. Kept beside the summary so both callers phrase
// it identically.
export function planRowContext(summary) {
  return [summary?.name, summary?.dayLabel].filter(Boolean).join(' · ');
}
