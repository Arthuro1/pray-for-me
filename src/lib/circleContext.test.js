import { describe, expect, it } from 'vitest';
import { suggestedCircle } from './circleContext';
import { circlesForTheme } from '../content/intercessionCircles';

describe('suggestedCircle', () => {
  it('prefers an explicit circle', () => {
    expect(suggestedCircle({ circle: 'church', themeId: 'peace', plan: { primaryCircle: 'self' } })).toBe('church');
  });

  it('falls back to the circle an authored theme belongs to', () => {
    expect(suggestedCircle({ themeId: 'children' })).toBe('household');
    // A theme prayed for in several circles suggests the innermost one.
    expect(circlesForTheme('reconciliation')).toEqual(['people', 'nations']);
    expect(suggestedCircle({ themeId: 'reconciliation' })).toBe('people');
  });

  it('then to a plan’s primary circle', () => {
    expect(suggestedCircle({ plan: { primaryCircle: 'kingdom', circles: ['kingdom'] } })).toBe('kingdom');
    expect(suggestedCircle({ themeId: 'not-a-theme', plan: { circles: ['household'] } })).toBe('household');
  });

  it('suggests nothing without context — and never reads a person’s own labels', () => {
    expect(suggestedCircle()).toBeNull();
    expect(suggestedCircle({ circle: 'galaxies' })).toBeNull();
    // A user label is not an authored theme, whatever it is called.
    for (const label of ['Tuesday', 'Sarah', 'Urgent', 'Marriage', 'family']) {
      expect(suggestedCircle({ themeId: label })).toBeNull();
    }
  });
});
