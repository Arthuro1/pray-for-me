// Local-day helpers for the prayer log. Whether "today is prayed" is now DERIVED
// from the per-prayer completion records (prayerStore.completions) — the old
// pfm_prayed_days day-level flag was a second source of truth that could
// disagree with them, so it's gone.
const pad = (n) => String(n).padStart(2, '0');

// Today's local date key (YYYY-MM-DD) — exported so callers can check membership.
export const todayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
