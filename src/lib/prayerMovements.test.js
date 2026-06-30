import { describe, it, expect } from 'vitest';
import { movementPassage } from './prayerMovements.js';

describe('movementPassage', () => {
  const jan1 = new Date(2026, 0, 1);

  it('returns a localized Psalm reference for a known movement', () => {
    expect(movementPassage('adoration', 'fr', jan1)).toMatch(/^Psaume \d/);
    expect(movementPassage('thanksgiving', 'en', jan1)).toMatch(/^Psalm \d/);
  });

  it('uses the language-specific book name', () => {
    expect(movementPassage('confession', 'ko', jan1).startsWith('시편')).toBe(true);
    expect(movementPassage('confession', 'pt', jan1).startsWith('Salmos')).toBe(true);
  });

  it('falls back to the English book name for an unknown language', () => {
    expect(movementPassage('adoration', 'xx', jan1).startsWith('Psalm')).toBe(true);
  });

  it('returns null for an unknown movement', () => {
    expect(movementPassage('nonsense', 'en', jan1)).toBe(null);
  });

  it('rotates the passage by day but is stable within a day', () => {
    const a = movementPassage('adoration', 'en', new Date(2026, 0, 1));
    const b = movementPassage('adoration', 'en', new Date(2026, 0, 1, 23));
    const c = movementPassage('adoration', 'en', new Date(2026, 0, 2));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
