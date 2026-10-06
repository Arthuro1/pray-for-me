// The seven Intercession Circles (docs/QETORET_IDENTITY.md §5): the widening
// reach of intercession, from one's own heart to God's Kingdom. They are
// reminders of breadth — never levels, scores or achievements — so nothing here
// orders prayers by circle "progress" or counts how far someone has come.
//
// A circle is optional. It lives INSIDE the encrypted prayer payload (see
// PAYLOAD_ONLY_FIELDS in lib/crypto/prayerCrypto.js), never in a plaintext
// column, and an old prayer without one simply belongs to "Your prayers".
// Nothing ever assigns a circle on the person's behalf.
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

// The circle a prayer was explicitly placed in, or null.
export function circleOf(prayer) {
  return isCircle(prayer?.circle) ? prayer.circle : null;
}

// i18n key for a circle's name ("My heart", "My house", …).
export const circleLabelKey = (circle) => `circle_${circle}`;

// Group prayers by circle, keeping the canonical inner-to-outer order and
// dropping empty circles. Unplaced prayers come back under `null`, last.
export function groupByCircle(prayers) {
  const buckets = new Map([...CIRCLES, null].map((c) => [c, []]));
  for (const prayer of prayers || []) buckets.get(circleOf(prayer)).push(prayer);
  return [...buckets].filter(([, list]) => list.length > 0).map(([circle, list]) => ({ circle, prayers: list }));
}
