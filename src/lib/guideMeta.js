// Guide-level display metadata. Duration is AUTHORED on the guide (`minutes`
// in prayerGuides.js); the deterministic step-count fallback exists only so a
// future guide without the field still shows something honest. Never derived
// from user behaviour.
export function guideDurationMinutes(guide) {
  if (!guide) return null;
  if (typeof guide.minutes === 'number' && guide.minutes > 0) return guide.minutes;
  const steps = (guide.steps || []).length;
  if (steps === 0) return null;
  // Intro plus roughly a minute and a half of unhurried prayer per step.
  return Math.max(3, Math.round(steps * 1.5) + 1);
}
