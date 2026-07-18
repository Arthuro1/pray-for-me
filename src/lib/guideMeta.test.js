// Guide durations are authored metadata with a deterministic content-based
// fallback — never generated from user behaviour.
import { describe, it, expect } from 'vitest';
import { guideDurationMinutes } from './guideMeta';
import { guides } from '../content/teaching';

describe('guideDurationMinutes', () => {
  it('prefers the authored minutes field', () => {
    expect(guideDurationMinutes({ minutes: 8, steps: [{}] })).toBe(8);
  });

  it('falls back deterministically to the step count when unauthored', () => {
    expect(guideDurationMinutes({ steps: [{}, {}, {}, {}] })).toBe(7);
    expect(guideDurationMinutes({ steps: [{}] })).toBe(3); // floor
  });

  it('returns null when there is nothing to derive from', () => {
    expect(guideDurationMinutes(null)).toBeNull();
    expect(guideDurationMinutes({ steps: [] })).toBeNull();
  });

  it('every shipped guide carries an authored duration', () => {
    for (const g of guides) {
      expect(typeof g.minutes, g.id).toBe('number');
      expect(g.minutes).toBeGreaterThan(0);
    }
  });
});
