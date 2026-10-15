// The Lord's day on Today: the app takes its rhythm from the gathered Church.
// From Saturday evening until Sunday midday it invites the person to prepare
// their heart for worship and pray for their church; from Sunday afternoon it
// asks what they received. Nothing is counted or scored, and a dismissed card
// stays dismissed for that moment on this device only (a per-viewer nicety —
// it holds no prayer content).
const DISMISS_KEY = 'pfm_sunday_dismissed';

export const SUNDAY_MOMENTS = Object.freeze({ PREPARE: 'prepare', REFLECT: 'reflect' });

// 'prepare' | 'reflect' | null for a local date-time.
export function sundayMoment(date = new Date()) {
  const day = date.getDay();
  const hour = date.getHours();
  if ((day === 6 && hour >= 17) || (day === 0 && hour < 13)) return SUNDAY_MOMENTS.PREPARE;
  if (day === 0) return SUNDAY_MOMENTS.REFLECT;
  return null;
}

// Identifies one occurrence of a moment ("2026-10-18:reflect"), so dismissing
// this Sunday's card never hides next Sunday's. A Saturday evening belongs to
// the Sunday that follows it.
export function sundayMomentId(date = new Date()) {
  const moment = sundayMoment(date);
  if (!moment) return null;
  const sunday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + (date.getDay() === 6 ? 1 : 0));
  const pad = (n) => String(n).padStart(2, '0');
  return `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}:${moment}`;
}

export function isSundayMomentDismissed(id) {
  if (!id) return false;
  try { return localStorage.getItem(DISMISS_KEY) === id; } catch { return false; }
}

export function dismissSundayMoment(id) {
  if (!id) return;
  try { localStorage.setItem(DISMISS_KEY, id); } catch { /* private mode — the card simply returns */ }
}
