import { create } from 'zustand';
import { addDays, parseKey } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';

// Per-prayer "follow up / check back in" reminders.
//
// This is deliberately SEPARATE from two other things it is easy to confuse with:
//   1. The prayer's recurrence schedule (prayers.schedule) — a follow-up is a
//      one-time "remind me to look at THIS prayer again", not a praying habit.
//   2. The account-level follow-up cadence in Settings (settings.followUpEnabled /
//      followUpDays) — that nudges you about your journal in general; this is tied
//      to one specific prayer.
//
// SCAFFOLD NOTE: follow-ups are stored client-side in localStorage, keyed by
// prayer id. That keeps this change stable and self-contained (no DB migration,
// no server write that could fail). Delivery is currently in-app only — a due
// follow-up surfaces as a banner when the prayer is opened.
// TODO: to deliver as a push notification and sync across devices, move this to a
// `prayers.follow_up` jsonb column (+ migration) and extend the reminder Edge
// Functions; the shape below ({ date, status }) is chosen to port cleanly.

const STORAGE_KEY = 'pfm_followups';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persist(map) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch { /* storage unavailable */ }
}

// A follow-up is "due" once its date has arrived (today or earlier).
export function isFollowUpDue(followUp, today = todayKey()) {
  return !!followUp && followUp.status === 'pending' && followUp.date <= today;
}

const useFollowUpStore = create((set, get) => ({
  // { [prayerId]: { date: 'YYYY-MM-DD', status: 'pending', createdAt: ISO } }
  followUps: load(),

  getFollowUp: (prayerId) => (prayerId ? get().followUps[prayerId] || null : null),

  // Set (or replace) a prayer's follow-up date. Passing a falsy date clears it,
  // so the create/edit form can round-trip "no reminder" cleanly.
  setFollowUp: (prayerId, date) => {
    if (!prayerId) return;
    set((state) => {
      const next = { ...state.followUps };
      if (!date) delete next[prayerId];
      else next[prayerId] = { date, status: 'pending', createdAt: new Date().toISOString() };
      persist(next);
      return { followUps: next };
    });
  },

  clearFollowUp: (prayerId) => get().setFollowUp(prayerId, null),

  // Push a pending follow-up out by N days from the later of today / its own date,
  // so snoozing a due reminder always lands in the future.
  snoozeFollowUp: (prayerId, days = 3) => {
    const cur = get().followUps[prayerId];
    const base = cur?.date && cur.date > todayKey() ? cur.date : todayKey();
    get().setFollowUp(prayerId, addDays(base, days));
  },
}));

// Shared "when" presets for the follow-up picker (label key + how many days out).
// `null` days = clear it. Kept here so the field and any future surfaces agree.
export const FOLLOW_UP_OPTIONS = [
  { id: 'off', days: null, labelKey: 'followUpOff' },
  { id: 'tomorrow', days: 1, labelKey: 'tomorrow' },
  { id: 'in3', days: 3, labelKey: 'followUpIn3Days' },
  { id: 'in1w', days: 7, labelKey: 'followUpIn1Week' },
  { id: 'in2w', days: 14, labelKey: 'followUpIn2Weeks' },
];

// Turn a chosen preset into an absolute day-key (or null to clear).
export function followUpDateFor(option, today = todayKey()) {
  return option?.days == null ? null : addDays(today, option.days);
}

// Localized "in N days" / weekday-style description of when a follow-up lands.
export function followUpWhenLabel(date, lang) {
  if (!date) return '';
  return parseKey(date).toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' });
}

export default useFollowUpStore;
