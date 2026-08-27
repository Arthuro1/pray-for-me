// The ONE place that decides whether the app should teach someone about a
// secondary feature right now — and, if so, which one.
//
// The core loop is: write a prayer → pray it → come back when it returns. A
// first-time user should be able to live in that loop for a while before the app
// starts explaining rhythms, reminders and organizing. Every individual prompt is
// reasonable; it is the pile-up right after a spiritual moment that turns the app
// into configuration work. So the thresholds live here, named and in one file,
// instead of being scattered as bare numbers across components.
//
// Three rules hold across everything below:
//   1. At most ONE education prompt exists at a time.
//   2. Handling or dismissing one ends education FOR THIS VISIT — it never
//      reveals the next card in the same breath.
//   3. Natural product state completes a step: an enabled reminder needs no
//      prompt, an already-organized journal needs no introduction.
//
// There is no checklist, no percentage, and nothing here ever counts what a
// person "should" have done.
import {
  ACTIVATION_STEPS,
  educationHandledThisVisit,
  legacyReminderSuggested,
  readActivationProgress,
} from './activationProgress';

const SESSION_COMPLETED = 'session_completed';

// A rhythm is worth explaining once there is more than one thing to place in the
// week — a single prayer has no rhythm problem to solve.
const RHYTHM_MIN_PRAYERS = 2;
// A reminder is worth offering to someone who has shown they want to come back,
// not to someone who has prayed exactly once.
const REMINDER_MIN_PRAYERS = 2;
// Organizing is worth introducing when a list has become something to navigate.
const ORGANIZE_MIN_PRAYERS = 3;
// "Came back" = prayed on more than one distinct day.
const RETURNING_MIN_DAYS = 2;

const isActive = (prayer) => prayer?.status !== 'answered';

function hasOrganization(prayer) {
  return !!(
    prayer?.for_other
    || prayer?.person_name
    || (prayer?.category_ids || []).length
    || (prayer?.prayer_categories || []).length
  );
}

// A prayer that never comes back on its own is real evidence that changing a
// rhythm would solve an actual problem — as opposed to guessing that it might.
function neverReturns(prayer) {
  return prayer?.schedule?.type === 'none';
}

// How many DISTINCT days this person has prayed on, from the completion records
// the app already keeps. No new storage, no new tracking: it is the same
// content-free per-prayer day log that drives Today.
export function returningDayCount(completions = {}) {
  const days = new Set();
  for (const list of Object.values(completions)) {
    for (const day of list || []) days.add(day);
  }
  return days.size;
}

// Returns ONE next step, or null. Ordered by how likely it is to be useful now.
export function nextActivationStep({
  prayers = [],
  completions = {},
  dailyReminderEnabled = false,
  progress = readActivationProgress(),
  handled = progress.handled,
  sessionCompleted = progress.signals.includes(SESSION_COMPLETED),
  legacyReminderHandled = legacyReminderSuggested(),
  handledThisVisit = educationHandledThisVisit(),
} = {}) {
  // Something was already offered and answered in this visit. Praying is the
  // point of coming back; one invitation per visit is the whole budget.
  if (handledThisVisit) return null;

  const done = new Set(handled);
  const active = prayers.filter(isActive);
  const returning = returningDayCount(completions) >= RETURNING_MIN_DAYS;

  // Rhythm — only once there is something a rhythm would actually help with:
  // more than one prayer, a person who keeps coming back, or a prayer that has
  // no way of returning at all.
  if (
    !done.has(ACTIVATION_STEPS.RHYTHM)
    && (active.length >= RHYTHM_MIN_PRAYERS || returning || active.some(neverReturns))
  ) {
    return ACTIVATION_STEPS.RHYTHM;
  }

  // Reminder — never straight after the first prayer. It waits for evidence of
  // repeated use: a second prayer, or a second day.
  if (
    sessionCompleted
    && !dailyReminderEnabled
    && !legacyReminderHandled
    && !done.has(ACTIVATION_STEPS.REMINDER)
    && (active.length >= REMINDER_MIN_PRAYERS || returning)
  ) {
    return ACTIVATION_STEPS.REMINDER;
  }

  // Organizing — only once the list has become something worth grouping, and
  // only if nothing in it is organized already.
  if (
    active.length >= ORGANIZE_MIN_PRAYERS
    && !active.some(hasOrganization)
    && !done.has(ACTIVATION_STEPS.ORGANIZE)
  ) {
    return ACTIVATION_STEPS.ORGANIZE;
  }

  return null;
}

// The install invitation is education too, and it queues behind the same rule:
// never beside an activation card, and never in a visit where one has already
// been answered. (Whether installing is even possible — a captured browser
// prompt, an iOS device, an already-installed app, enough return visits — stays
// with pwaInstall.js; this only decides whether it may compete for attention.)
export function pwaInstallAllowed({
  activationStep = null,
  handledThisVisit = educationHandledThisVisit(),
} = {}) {
  return !activationStep && !handledThisVisit;
}

export function activationTargetPrayer(step, prayers = []) {
  const active = prayers.filter(isActive);
  if (step === ACTIVATION_STEPS.RHYTHM) {
    // The prayer the prompt can actually improve: one that never returns if
    // there is one, otherwise simply the first.
    return active.find(neverReturns) || active[0] || null;
  }
  if (step === ACTIVATION_STEPS.ORGANIZE) {
    return active.find((prayer) => !hasOrganization(prayer)) || null;
  }
  return null;
}
