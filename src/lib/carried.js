// Long-carried prayer, given dignity (docs/QETORET_IDENTITY.md §2, Zechariah):
// "Carried since March 2025" helps a person REMEMBER. It never measures holiness,
// never implies that duration obligates God, and never turns into a score — so
// there is no streak, no percentage and no "consistency" here, only dates and a
// plain count of the days a prayer was prayed.
//
// "Tend your altar" is the gentle periodic review that keeps a prayer list from
// becoming an abandoned archive. A prayer qualifies when it has quietly gone
// unprayed for a while; reviewing it is the person's decision, and every choice
// (continue, something changed, testimony, release) is a good one.
import { parseKey, toKey } from './schedule';

// How long a prayer may rest before "Tend your altar" offers it for review,
// and how long a review answer holds before the same prayer is offered again.
export const TEND_AFTER_DAYS = 30;
export const TEND_QUIET_DAYS = 60;
export const TEND_STORAGE_KEY = 'pfm_altar_tended_v1';

const DAY_MS = 24 * 60 * 60 * 1000;

const isOwnActivePrayer = (prayer) => (
  prayer?.status === 'active'
  && !prayer._locked
  && !prayer.community_origin_id
  && !prayer.schedule?.plan?.id
);

// The number of distinct days this prayer was prayed — memory, not merit.
export function prayedDayCount(completions, prayerId) {
  return new Set(completions?.[prayerId] || []).size;
}

// When the person first brought this prayer before God, as a Date (or null).
export function carriedSinceDate(prayer) {
  const date = prayer?.created_at ? new Date(prayer.created_at) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

// "March 2025" in the reader's language.
export function carriedSinceLabel(prayer, lang) {
  const date = carriedSinceDate(prayer);
  return date ? date.toLocaleDateString(lang, { month: 'long', year: 'numeric' }) : null;
}

// Whether "Carried since…" applies: the person's own, still-active prayer that
// is not a guided-plan run (a plan has its own day counter).
export function showsCarriedSince(prayer) {
  return isOwnActivePrayer(prayer) && !!carriedSinceDate(prayer);
}

// The most recent day this prayer was prayed, as a Date (or null).
export function lastPrayedDate(prayer, completions) {
  const days = [...(completions?.[prayer.id] || [])].sort();
  const fromLog = days.length ? parseKey(days[days.length - 1]) : null;
  const fromRow = prayer.last_prayed_at ? new Date(prayer.last_prayed_at) : null;
  const valid = [fromLog, fromRow].filter((d) => d && !Number.isNaN(d.getTime()));
  return valid.length ? new Date(Math.max(...valid.map((d) => d.getTime()))) : null;
}

// Device-local review marks: { prayerId: 'YYYY-MM-DD' }. Ids and dates only —
// never a title or anything else about what the prayer says.
export function readTended() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TEND_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function markTended(prayerId, now = new Date()) {
  try {
    const next = { ...readTended(), [prayerId]: toKey(now) };
    localStorage.setItem(TEND_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode): the review simply offers it again.
  }
}

// Prayers to offer in "Tend your altar", oldest-resting first.
export function tendCandidates(prayers, completions, { now = new Date(), tended = readTended() } = {}) {
  const restedLongEnough = (date) => !date || now - date >= TEND_AFTER_DAYS * DAY_MS;
  const recentlyTended = (id) => {
    const day = tended[id];
    return !!day && now - parseKey(day) < TEND_QUIET_DAYS * DAY_MS;
  };
  return (prayers || [])
    .filter(isOwnActivePrayer)
    .filter((p) => restedLongEnough(carriedSinceDate(p)) && carriedSinceDate(p))
    .filter((p) => restedLongEnough(lastPrayedDate(p, completions)))
    .filter((p) => !recentlyTended(p.id))
    .sort((a, b) => (lastPrayedDate(a, completions) || carriedSinceDate(a)) - (lastPrayedDate(b, completions) || carriedSinceDate(b)));
}

// "Release from my rhythm" is offered only to a prayer that still returns on
// its own — including a legacy prayer with no schedule, which returns daily.
export const canReleaseFromRhythm = (prayer) => !!prayer && prayer.schedule?.type !== 'none';
