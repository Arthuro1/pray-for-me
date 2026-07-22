// Imports a saved GUEST prayer into the authenticated account, exactly once,
// through the normal encrypted prayer-creation path — the final step of the
// "pray first, sign up only to save" flow.
//
// Correctness requirements it upholds:
//   • NEVER a plaintext server write: it refuses to run until the account key is
//     unlocked (isUnlocked), so the imported row is encrypted at rest like any
//     other private prayer. While locked it no-ops and can be retried later.
//   • Idempotent under React StrictMode double effects, refreshes and offline
//     queue replay: a single in-flight promise coalesces concurrent calls, the
//     draft's own client-generated UUID drives an id-based upsert (createPrayer),
//     and an existing-row check skips a second create. The draft is cleared once
//     imported, so a later boot finds nothing to do.
//   • A guest prayer that was actually prayed records TODAY's completion — but is
//     never re-opened to be prayed again.
import usePrayerStore from '../store/prayerStore';
import { isUnlocked } from './crypto/keyManager';
import { defaultNewSchedule } from './scheduleDraft';
import { todayKey } from './prayedLog';
import { setContentLang } from './contentLang';
import { loadGuestDraft, clearGuestDraft } from './guestPrayerDraft';
import { track, EVENTS } from './analytics';

// Coalesces concurrent callers within one page life; a resolved promise stays
// cached so repeated effects can't run the body twice. A fresh page load resets
// this — by then the draft is already cleared, so the retry no-ops.
let inFlight = null;

// Import the pending guest draft once. Returns { imported, reason?, id? }.
export function importGuestPrayerOnce() {
  if (!inFlight) inFlight = runImport();
  return inFlight;
}

async function runImport() {
  // Wait for the account key. Reset inFlight so a later call (once unlocked) can
  // retry rather than being permanently short-circuited by this early return.
  if (!isUnlocked()) { inFlight = null; return { imported: false, reason: 'locked' }; }

  const draft = await loadGuestDraft();
  if (!draft) { inFlight = null; return { imported: false, reason: 'none' }; }

  const store = usePrayerStore.getState();
  const alreadyImported = store.prayers.some((p) => p.id === draft.id);

  if (!alreadyImported) {
    // The normal encrypted path: addPrayer accepts the draft's UUID, encrypts the
    // sensitive fields, and enqueues an id-based upsert (idempotent on replay).
    await store.addPrayer({
      id: draft.id,
      title: draft.title,
      schedule: defaultNewSchedule(),
      contentLanguage: draft.contentLanguage,
    });
  }
  // Record the writing language locally so translation never pays to "translate"
  // the prayer into the language it was already written in (mirrors onboarding).
  if (draft.contentLanguage) setContentLang(draft.contentLanguage);

  // A prayed guest prayer gets today's completion (markPrayedOn is idempotent per
  // day) — but we never send them back to pray the same prayer again.
  if (draft.completed && !(usePrayerStore.getState().completions[draft.id] || []).includes(todayKey())) {
    usePrayerStore.getState().markPrayedOn(draft.id, todayKey());
  }

  await clearGuestDraft();
  try { localStorage.setItem('pfm_onboarded', '1'); } catch { /* ignore */ }
  track(EVENTS.GUEST_PRAYER_IMPORTED); // content-free: only THAT an import happened
  return { imported: !alreadyImported, id: draft.id };
}

// Test-only: forget the in-flight/cached promise to simulate a fresh page load.
export function __resetImportForTests() {
  inFlight = null;
}
