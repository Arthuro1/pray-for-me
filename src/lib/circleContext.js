// Which circle the prayer composer PRESELECTS when someone arrives with
// context — a circle on the landing page, a theme's "Pray this", a circle in
// the Journal, a guided plan. Only ever a suggestion: the person can change or
// clear it, and nothing is saved until they save the prayer themselves.
//
// The sources, strongest first: an explicit circle; the circle an AUTHORED
// theme belongs to (src/content/intercessionCircles); a plan's primary circle.
// A person's own labels are never read here — "Tuesday", "Sarah" or "Urgent"
// say nothing about a circle, and guessing would put words in their mouth.
import { normalizeCircle, planCircles } from './circles';
import { circlesForTheme } from '../content/intercessionCircles';

export function suggestedCircle({ circle, themeId, plan } = {}) {
  return normalizeCircle(circle) ?? circlesForTheme(themeId)[0] ?? planCircles(plan).primary;
}
