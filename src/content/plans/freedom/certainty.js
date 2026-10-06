// What a reader actually KNOWS about a category — and why the distinction is
// load-bearing rather than cosmetic.
//
// A deliverance plan that treated "I did this" and "someone told me my
// grandmother may have done this" identically would do two harmful things at
// once: it would hand a reader guilt that Scripture does not give them
// (Ezekiel 18:19-20), and it would invite them to invent a family history in
// order to have something to confess. So the certainty a reader reports is the
// ONE input that changes which reviewed prayer modules a guided session is
// built from (see src/lib/freedomSession.js).
//
// PRIVACY: these ids are never persisted, never synced and never sent to
// analytics. The selection lives in React state for the length of the visit and
// then it is gone — the app has no record of what anyone answered here. That is
// deliberate: an occult or family-spiritual history is the single most sensitive
// thing this app could hold, and the plan works perfectly without keeping it.
export const CERTAINTY_LEVELS = [
  { id: 'personal', labelKey: 'freedomCertaintyPersonal' },
  { id: 'known_family_history', labelKey: 'freedomCertaintyKnownFamily' },
  { id: 'reported_family_history', labelKey: 'freedomCertaintyReportedFamily' },
  { id: 'uncertain', labelKey: 'freedomCertaintyUncertain' },
  { id: 'none', labelKey: 'freedomCertaintyNone' },
];

export const CERTAINTY_IDS = CERTAINTY_LEVELS.map((c) => c.id);

// No answer at all. Not the same as 'none' ("not applicable"): unanswered means
// the question has simply not been put, and the day is prayed in its general
// form rather than in a form that assumes anything either way.
export const NO_CERTAINTY = null;

export function isCertainty(value) {
  return CERTAINTY_IDS.includes(value);
}

// How the reader may answer "did anything come to mind?" after inviting the
// Holy Spirit. "Nothing specific" and "I'm not sure" are first-class answers —
// §6: freedom does not depend on discovering something.
export const REMEMBRANCE_ANSWERS = [
  { id: 'note', labelKey: 'freedomRemembranceNote' },
  { id: 'nothing', labelKey: 'freedomRemembranceNothing' },
  { id: 'unsure', labelKey: 'freedomRemembranceUnsure' },
];
