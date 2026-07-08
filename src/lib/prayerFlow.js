// Shared definitions for the guided-prayer flows, used by both the tap-based
// PrayerSession and the voice-guided HandsFreePrayerMode so the movements stay
// in one place.
//
// A "flow" is an ordered list of stages. Scripture movements (adoration /
// confession / thanksgiving) each point the user to a Psalm to read; the
// "requests" stage walks the user's actual prayers one at a time.

export const MODE_STAGES = {
  requests: ['requests'],
  guided: ['adoration', 'requests', 'thanksgiving'],
  acts: ['adoration', 'confession', 'thanksgiving', 'requests'],
};

export const MOVEMENT_META = {
  adoration: { emoji: '🙌', titleKey: 'stageAdoration', promptKey: 'stageAdorationPrompt' },
  confession: { emoji: '🕊️', titleKey: 'stageConfession', promptKey: 'stageConfessionPrompt' },
  thanksgiving: { emoji: '🙏', titleKey: 'stageThanksgiving', promptKey: 'stageThanksgivingPrompt' },
};

// Silence-window lengths (seconds) offered in the pre-session settings. Kept
// modest so the pauses feel like room to breathe, not dead air.
export const PAUSE_SECONDS = { short: 20, medium: 40, long: 60 };

export function pauseSeconds(key) {
  return PAUSE_SECONDS[key] ?? PAUSE_SECONDS.medium;
}

// Flatten a mode into the ordered steps a hands-free session walks through:
//   { type: 'movement', stage }          — a Scripture movement
//   { type: 'request',  prayer, index }  — one of the user's prayers
export function buildSteps(mode, prayers = []) {
  const stages = MODE_STAGES[mode] || MODE_STAGES.requests;
  const steps = [];
  for (const stage of stages) {
    if (stage === 'requests') {
      prayers.forEach((prayer, index) => steps.push({ type: 'request', stage, prayer, index }));
    } else {
      steps.push({ type: 'movement', stage });
    }
  }
  return steps;
}
