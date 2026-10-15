// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { dismissSundayMoment, isSundayMomentDismissed, sundayMoment, sundayMomentId } from './sundayRhythm';

// 2026-10-17 is a Saturday, 2026-10-18 a Sunday.
const at = (day, hour) => new Date(2026, 9, day, hour, 0);

describe('sundayMoment', () => {
  it('prepares from Saturday evening until Sunday midday', () => {
    expect(sundayMoment(at(17, 16))).toBeNull();
    expect(sundayMoment(at(17, 17))).toBe('prepare');
    expect(sundayMoment(at(18, 8))).toBe('prepare');
    expect(sundayMoment(at(18, 12))).toBe('prepare');
  });

  it('reflects from Sunday afternoon, and is quiet the rest of the week', () => {
    expect(sundayMoment(at(18, 13))).toBe('reflect');
    expect(sundayMoment(at(18, 22))).toBe('reflect');
    expect(sundayMoment(at(19, 9))).toBeNull();
    expect(sundayMoment(at(15, 20))).toBeNull();
  });
});

describe('sundayMomentId', () => {
  it('ties Saturday evening to the Sunday that follows', () => {
    expect(sundayMomentId(at(17, 20))).toBe('2026-10-18:prepare');
    expect(sundayMomentId(at(18, 9))).toBe('2026-10-18:prepare');
    expect(sundayMomentId(at(18, 15))).toBe('2026-10-18:reflect');
    expect(sundayMomentId(at(16, 9))).toBeNull();
  });
});

describe('dismissal', () => {
  beforeEach(() => localStorage.clear());

  it('hides only the moment that was dismissed', () => {
    dismissSundayMoment('2026-10-18:prepare');
    expect(isSundayMomentDismissed('2026-10-18:prepare')).toBe(true);
    expect(isSundayMomentDismissed('2026-10-18:reflect')).toBe(false);
    expect(isSundayMomentDismissed('2026-10-25:prepare')).toBe(false);
  });
});
