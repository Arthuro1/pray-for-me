import { describe, expect, it } from 'vitest';
import { guestPrayerContext, MAX_PROMPT_LENGTH } from './guestPrayerContext';

describe('guestPrayerContext', () => {
  it('keeps a valid circle and its prompt', () => {
    expect(guestPrayerContext({ circle: 'church', prompt: '  Strengthen Your Church.  ' }))
      .toEqual({ circle: 'church', prompt: 'Strengthen Your Church.' });
    expect(guestPrayerContext({ circle: 'self' })).toEqual({ circle: 'self', prompt: null });
  });

  it('frames nothing for a plain call to pray', () => {
    // A button hands its click event to the handler; that is not a circle.
    expect(guestPrayerContext({ type: 'click', target: {} })).toBeNull();
    expect(guestPrayerContext(undefined)).toBeNull();
    expect(guestPrayerContext({ circle: 'galaxies', prompt: 'x' })).toBeNull();
  });

  it('bounds the prompt', () => {
    const long = 'a'.repeat(MAX_PROMPT_LENGTH + 50);
    expect(guestPrayerContext({ circle: 'self', prompt: long }).prompt).toHaveLength(MAX_PROMPT_LENGTH);
    expect(guestPrayerContext({ circle: 'self', prompt: 42 }).prompt).toBeNull();
  });
});
