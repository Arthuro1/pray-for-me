// Deterministic assembly of a guided deliverance prayer from reviewed modules.
//
// ─────────────────────────────────────────────────────────────────────────────
// PERSONALIZATION, NOT DIAGNOSIS
// ─────────────────────────────────────────────────────────────────────────────
// This module answers exactly one question: given the day the reader is on and
// what they VOLUNTARILY said they know, which authored prayer modules apply and
// in what order? It is a pure function of those two inputs. It contains no
// model call, no inference, no scoring and no notion of "likely". It never
// concludes that a curse exists, that a covenant was made, that an ancestor did
// something, or that any of it explains a difficulty in the reader's life.
//
// The order is fixed and biblical rather than dramatic: God is invited, Christ
// is confessed, the matter is brought into the light, repentance comes before
// renunciation, Scripture is prayed, the reader is filled, and the prayer ends
// in thanksgiving and one practical step. Warfare language, where it appears at
// all, comes after submission — never before it (James 4:7).
import { PRAYER_MODULES } from '../content/plans/freedom/prayerModules';
import { isCertainty } from '../content/plans/freedom/certainty';

// Which modules a reported certainty adds, and — just as importantly — which it
// does NOT. A reader who only knows a family story is never guided to confess
// guilt for it; a reader who says "not applicable" is never handed a
// renunciation for something they have told us is not there.
const BY_CERTAINTY = {
  personal: ['bringBeforeGod', 'repentPersonal', 'renouncePersonal'],
  known_family_history: ['bringKnownFamily', 'renounceFamilyAgreement'],
  reported_family_history: ['bringReportedFamily', 'rejectFear'],
  uncertain: ['entrustUnknown', 'rejectFear'],
  none: [],
};

// The frame every guided session shares, with the certainty-specific middle
// spliced in at `#category`.
const FRAME = ['inviteSpirit', 'confessChrist', '#category', 'prayTheWord', 'standInChrist', 'askFilled', 'thanksgiving'];

// A day may ask for extra reviewed modules (day 1 opens at the cross; day 5 and
// day 20 include forgiveness; renunciation days close with a practical step).
// Anything a day names must be a real module id, and it is inserted at a fixed
// place rather than wherever the content file happens to list it.
const EXTRA_SLOTS = {
  thanksCross: { after: 'confessChrist' },
  forgive: { after: '#category' },
  practicalObedience: { after: 'thanksgiving' },
};

// The steps of one guided session, in order.
//
//   day        a plan day (only `day.freedom` is read)
//   certainty  what the reader reported, or null when they were not asked /
//              chose not to answer. Unknown values are treated as unanswered.
//
// Returns [{ id, titleKey, body, refs, source }] where `source` is the day's own
// override for that step when it supplied one — a day about family altars says
// "bring this before God" in its own words, but the STEP is the same reviewed
// step, in the same place, for everyone.
export function buildGuidedSession(day, certainty = null) {
  const freedom = day?.freedom || null;
  const level = isCertainty(certainty) ? certainty : null;

  // Unanswered (or a day with no inventory at all) prays the general form: the
  // matter is still brought before God, but nothing is assumed about it.
  const category = level ? BY_CERTAINTY[level] : ['bringBeforeGod'];

  const ids = [];
  for (const slot of FRAME) {
    if (slot === '#category') ids.push(...category);
    else ids.push(slot);
    for (const [extra, position] of Object.entries(EXTRA_SLOTS)) {
      if (position.after === slot && (freedom?.modules || []).includes(extra)) ids.push(extra);
    }
  }

  // A day that asks for the same module the certainty already added (day 20
  // includes forgiveness while a reader also selected "I personally
  // participated") must not pray it twice.
  const unique = [];
  for (const id of ids) {
    if (PRAYER_MODULES[id] && !unique.includes(id)) unique.push(id);
  }

  return unique
    .map((id) => ({
      ...PRAYER_MODULES[id],
      // A day may say the "bring this before God" and "stand" steps in its own
      // words. It may never replace the invitation, the confession of Christ,
      // repentance or renunciation — those stay identical everywhere they run.
      body: freedom?.stepText?.[id] || PRAYER_MODULES[id].body,
      refs: id === 'prayTheWord' && freedom?.standRefs?.length
        ? freedom.standRefs
        : PRAYER_MODULES[id].refs,
    }));
}

// Which reviewed modules a day is allowed to name for itself.
export const DAY_EXTRA_MODULES = Object.keys(EXTRA_SLOTS);

// Only these steps may be reworded by a day (see `stepText` above).
export const OVERRIDABLE_STEPS = ['bringBeforeGod', 'bringKnownFamily', 'bringReportedFamily', 'entrustUnknown', 'standInChrist'];
