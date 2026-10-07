// The seven Intercession Circles (docs/QETORET_IDENTITY.md §5): the widening
// reach of intercession, from one's own heart to God's Kingdom. They are
// reminders of breadth — never levels, scores or achievements — so nothing here
// orders prayers by circle "progress" or counts how far someone has come.
//
// A circle is optional. It lives INSIDE the encrypted prayer payload (see
// PAYLOAD_ONLY_FIELDS in lib/crypto/prayerCrypto.js), never in a plaintext
// column, and an old prayer without one simply belongs to "Your prayers".
// Nothing ever assigns a circle on the person's behalf.
//
// This module is the single canonical model. What a circle MEANS (its teaching,
// themes and Scripture) lives in src/content/intercessionCircles/; how it LOOKS
// lives in components/shared (CircleGlyph, circleIcons). docs/INTERCESSION_CIRCLES.md
// explains how the three fit together.
export const CIRCLES = Object.freeze([
  'self',
  'household',
  'people',
  'church',
  'authorities',
  'nations',
  'kingdom',
]);

export const isCircle = (value) => CIRCLES.includes(value);

// A stored value read back as a circle, or null. Read-time only: a value this
// build does not know (a newer build's circle, a damaged payload) is treated as
// "unplaced" here but is never rewritten, so nothing is lost by reading it.
export const normalizeCircle = (value) => (isCircle(value) ? value : null);

// The circle a prayer was explicitly placed in, or null.
export function circleOf(prayer) {
  return normalizeCircle(prayer?.circle);
}

// i18n key for a circle's name ("My heart", "My house", …).
export const circleLabelKey = (circle) => `circle_${circle}`;

// i18n key for what a circle holds ("Family and household", …).
export const circleDescKey = (circle) => `circleDesc_${circle}`;

// i18n key for the question the prayer composer asks when someone arrives from
// a circle ("Who has God placed on your heart?"). They remain free to write
// anything; the question only frames the empty field.
export const circlePromptKey = (circle) => `circlePrompt_${circle}`;

// Everything the UI needs to name a circle, derived from CIRCLES so an id can
// never exist in one list and not the other. `order` is the inner-to-outer
// position — the shape of intercession, not a rank.
export const CIRCLE_DEFINITIONS = Object.freeze(Object.fromEntries(CIRCLES.map((id, order) => [id, Object.freeze({
  id,
  order,
  labelKey: circleLabelKey(id),
  descKey: circleDescKey(id),
  promptKey: circlePromptKey(id),
})])));

// The circles a circle reaches across, from the heart outward: "Nations" holds
// My heart through Nations. The ring art lights these; it is the widening
// reach of one life of prayer, never a count of circles "completed".
export function circlesWithin(circle) {
  const index = CIRCLES.indexOf(circle);
  return index < 0 ? [] : CIRCLES.slice(0, index + 1);
}

// Group prayers by circle, keeping the canonical inner-to-outer order and
// dropping empty circles. Unplaced prayers come back under `null`, last.
export function groupByCircle(prayers) {
  const buckets = new Map([...CIRCLES, null].map((c) => [c, []]));
  for (const prayer of prayers || []) buckets.get(circleOf(prayer)).push(prayer);
  return [...buckets].filter(([, list]) => list.length > 0).map(([circle, list]) => ({ circle, prayers: list }));
}

// A guided plan's optional circle metadata (`primaryCircle`, `circles` on a
// PLANS entry), read defensively: a plan without it — or with a value this
// build doesn't know — simply has no circle, and never disappears for it.
// The primary circle always comes first in `circles`.
export function planCircles(plan) {
  const listed = (Array.isArray(plan?.circles) ? plan.circles : []).filter(isCircle);
  const primary = normalizeCircle(plan?.primaryCircle) ?? listed[0] ?? null;
  const circles = primary ? [primary, ...listed.filter((c) => c !== primary)] : [];
  return { primary, circles: [...new Set(circles)] };
}

// The plans that shape prayer in one circle, from authored metadata only (no
// recommendation algorithm): those whose PRIMARY circle it is first, then those
// that also touch it, each group in the order `plans` gives them.
export function plansForCircle(plans, circle) {
  if (!isCircle(circle)) return [];
  const withCircles = (plans || []).map((plan) => ({ plan, ...planCircles(plan) }));
  return [
    ...withCircles.filter((entry) => entry.primary === circle),
    ...withCircles.filter((entry) => entry.primary !== circle && entry.circles.includes(circle)),
  ].map((entry) => entry.plan);
}
