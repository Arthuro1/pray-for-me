// The plan discovery funnel, content-free by construction.
//
// Every event here says only THAT something happened with a plan — never which
// plan. Two scalar properties may ride along: `source`, the door the person
// came through, and `day`, the number of a plan day walked. Neither can say
// what someone is praying through.
//
// Plans with their own dedicated events (the relationship and deliverance
// plans — see `analyticsEvents` in their content files) are the ones whose very
// choice says something personal, and those events were deliberately made
// property-free. The funnel follows the same rule for them: counted, never
// described — not even by a source or a day number.
import { EVENTS, track } from './analytics';

// Where a person entered the plan flow. Kept short and fixed so the property
// can never carry anything but one of these words.
export const PLAN_SOURCES = Object.freeze({
  TAB: 'tab',
  TODAY_CARD: 'today_card',
  EMPTY_DAY: 'empty_day',
  COMPLETION: 'completion',
  GROUP: 'group',
  INVITATION: 'invitation',
  SHARE_LINK: 'share_link',
  DIRECT: 'direct',
});

const KNOWN_SOURCES = new Set(Object.values(PLAN_SOURCES));

export function planSource(value) {
  return KNOWN_SOURCES.has(value) ? value : PLAN_SOURCES.DIRECT;
}

function isPersonalPlan(plan) {
  return !!plan?.analyticsEvents;
}

function trackPlanEvent(name, plan, props) {
  track(name, isPersonalPlan(plan) ? undefined : props);
}

export function trackPlansPageViewed(source) {
  track(EVENTS.PLANS_PAGE_VIEWED, { source: planSource(source) });
}

export function trackPlanDetailOpened(plan, source) {
  trackPlanEvent(EVENTS.PLAN_DETAIL_OPENED, plan, { source: planSource(source) });
}

export function trackPlanStarted(plan, source) {
  trackPlanEvent(EVENTS.PLAN_STARTED, plan, { source: planSource(source) });
}

export function trackPlanDayCompleted(plan, day) {
  trackPlanEvent(EVENTS.PLAN_DAY_COMPLETED, plan, Number.isInteger(day) && day > 0 ? { day } : undefined);
}
