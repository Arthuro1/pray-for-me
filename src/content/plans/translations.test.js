// Folding a language overlay into an authored plan. The rules that matter:
// structure never moves (ids, Scripture, movements, topics all stay in the
// source), the source is never mutated, and a partial overlay degrades to the
// authored en/fr rather than to a blank screen.
import { describe, it, expect } from 'vitest';
import { mergePlan } from './translations.js';
import { PREPARING_IN_PRAYER } from './preparingInPrayer.js';
import { pick } from '../teaching/pick.js';

const overlay = {
  preparing21: {
    intro: 'Intro auf Deutsch',
    biblical: 'Die biblische Geschichte',
    completion: 'Zum Abschluss',
    days: [
      {
        reflection: 'Reflexion für Tag 1',
        prompts: ['Erstes Gebet', 'Zweites Gebet', 'Drittes Gebet'],
        selfPrompt: 'Bete auch für dich',
        practice: 'Übung für heute',
      },
      // Day 2 gets only a reflection and one role — everything else must fall back.
      { reflection: 'Reflexion für Tag 2', roles: { wife: 'Für die Ehefrau' } },
    ],
  },
};

const merged = mergePlan(PREPARING_IN_PRAYER, overlay, 'de');

describe('mergePlan', () => {
  it('resolves translated prose for the overlay language', () => {
    expect(pick(merged.intro, 'de')).toBe('Intro auf Deutsch');
    expect(pick(merged.biblical.text, 'de')).toBe('Die biblische Geschichte');
    expect(pick(merged.completion, 'de')).toBe('Zum Abschluss');
    expect(pick(merged.days[0].reflection, 'de')).toBe('Reflexion für Tag 1');
    expect(pick(merged.days[0].prompts[1], 'de')).toBe('Zweites Gebet');
    expect(pick(merged.days[0].selfPrompt, 'de')).toBe('Bete auch für dich');
    expect(pick(merged.days[0].practice, 'de')).toBe('Übung für heute');
  });

  it('keeps the authored en/fr fallback for anything the overlay omits', () => {
    // Day 2 has no prompts in the overlay.
    expect(pick(merged.days[1].prompts[0], 'de')).toBe(PREPARING_IN_PRAYER.days[1].prompts[0].en);
    // …and days beyond the overlay are untouched.
    expect(pick(merged.days[10].reflection, 'de')).toBe(PREPARING_IN_PRAYER.days[10].reflection.en);
    expect(pick(merged.days[0].reflection, 'en')).toBe(PREPARING_IN_PRAYER.days[0].reflection.en);
  });

  it('translates only the role the overlay supplies', () => {
    expect(pick(merged.days[1].roles.wife, 'de')).toBe('Für die Ehefrau');
    expect(pick(merged.days[1].roles.husband, 'de')).toBe(PREPARING_IN_PRAYER.days[1].roles.husband.en);
  });

  it('never moves structure: ids, Scripture, movements and topics stay in the source', () => {
    expect(merged.id).toBe(PREPARING_IN_PRAYER.id);
    expect(merged.count).toBe(PREPARING_IN_PRAYER.count);
    expect(merged.days).toHaveLength(PREPARING_IN_PRAYER.days.length);
    merged.days.forEach((day, i) => {
      const source = PREPARING_IN_PRAYER.days[i];
      expect(day.ref).toBe(source.ref);
      expect(day.related).toEqual(source.related);
      expect(day.movement).toBe(source.movement);
      expect(day.resourceTopics).toEqual(source.resourceTopics);
      expect(day.theme).toBe(source.theme);
    });
    expect(merged.biblical.ref).toBe(PREPARING_IN_PRAYER.biblical.ref);
  });

  it('does not mutate the authored source', () => {
    expect(PREPARING_IN_PRAYER.intro.de).toBeUndefined();
    expect(PREPARING_IN_PRAYER.days[0].reflection.de).toBeUndefined();
  });

  it('returns the plan untouched when the language has no overlay', () => {
    expect(mergePlan(PREPARING_IN_PRAYER, null, 'ko')).toBe(PREPARING_IN_PRAYER);
    expect(mergePlan(PREPARING_IN_PRAYER, { otherPlan: {} }, 'ko')).toBe(PREPARING_IN_PRAYER);
  });
});
