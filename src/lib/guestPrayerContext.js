import { normalizeCircle } from './circles';

// A circle chosen on the landing page — and, from "Pray this", the prompt it
// offered — frames the guest prayer. Anything else (a plain call to pray, or
// the click event a button hands its handler) frames nothing. The person still
// writes every word of their prayer; this only shapes the question.
export const MAX_PROMPT_LENGTH = 280;

export function guestPrayerContext(value) {
  const circle = normalizeCircle(value?.circle);
  if (!circle) return null;
  const prompt = typeof value.prompt === 'string' ? value.prompt.trim().slice(0, MAX_PROMPT_LENGTH) : '';
  return { circle, prompt: prompt || null };
}
