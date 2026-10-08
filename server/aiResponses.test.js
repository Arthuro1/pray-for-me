import { describe, expect, it } from 'vitest';
import { parseModelResponse, validateTaskResponse } from './aiResponses.js';

const guidance = { task: 'scripture_guidance', input: { lang: 'en', title: 'Peace' } };
const prayer = { task: 'prayer_recommendations', input: { lang: 'de', title: 'Frieden', kind: 'new' } };
const translation = { task: 'translate_texts', input: { lang: 'fr', texts: ['Peace', 'Hope'] } };
const rec = (title = 'Pray for wisdom', ref = 'James 1:5') => ({ title, references: [{ ref }] });
const quoted = '"For God so loved the world that he gave his only begotten Son to save the world."';

describe('parseModelResponse', () => {
  it('parses JSON and a single enclosing JSON fence', () => {
    expect(parseModelResponse(' {"0":"Paix"} ')).toEqual({ 0: 'Paix' });
    expect(parseModelResponse('```json\n{"0":"Paix"}\n```')).toEqual({ 0: 'Paix' });
    expect(parseModelResponse('```\n{"0":"Paix"}\n```')).toEqual({ 0: 'Paix' });
  });

  it.each(['', 'Here is the answer: {"0":"Paix"}', '{bad}', '```json\n{}\n```\nextra', 'x'.repeat(128001), null])(
    'rejects incomplete, oversized or surrounded output without leaking it %#', (content) => {
      expect(() => parseModelResponse(content)).toThrow('Invalid AI response');
    },
  );
});

describe('scripture guidance response', () => {
  it('normalizes optional fields and wider reading to the reference', () => {
    expect(validateTaskResponse(guidance, { passages: [{ ref: '  Psalm 23 ' }] })).toEqual({
      passages: [{ ref: 'Psalm 23', readWhole: 'Psalm 23', why: '' }],
      context: '', themes: [], reflections: [],
    });
  });

  it.each(['1. Petrus 5:7', '5. Mose 6:4-9', '1 Corinthians 13:4-7', '詩篇 23', 'Philippiens 4:6', 'رومية 8:28'])(
    'accepts localized Bible reference %s', (ref) => {
      expect(validateTaskResponse(guidance, { passages: [{ ref }] }).passages[0].ref).toBe(ref);
    },
  );

  it.each(['1. Petrus', '5. Mose', '1 Corinthians', '23', 'John', 'John 3:16. Trust God.', 'Psalm 23!', 'John "3:16"', 'John\n3:16', 'a'.repeat(65)])(
    'rejects absent chapters, punctuation and prose in references %s', (ref) => {
      expect(() => validateTaskResponse(guidance, { passages: [{ ref }] })).toThrow('Invalid AI response');
    },
  );

  it.each([
    { passages: [] },
    { passages: Array(4).fill({ ref: 'Psalm 23' }) },
    { passages: [{ ref: 'Psalm 23', text: 'The Lord is my shepherd' }] },
    { passages: [{ ref: 'Psalm 23', readWhole: 'Psalm 23.' }] },
    { passages: [{ ref: 'Psalm 23', why: quoted }] },
    { passages: [{ ref: 'Psalm 23' }], context: quoted },
    { passages: [{ ref: 'Psalm 23' }], themes: [quoted] },
    { passages: [{ ref: 'Psalm 23' }], reflections: [quoted] },
    { passages: [{ ref: 'Psalm 23' }], extra: 'unknown' },
    { passages: [{ ref: 'Psalm 23' }], context: 'x'.repeat(801) },
    { passages: [{ ref: 'Psalm 23' }], themes: Array(7).fill('Faith') },
    { passages: [{ ref: 'Psalm 23' }], reflections: ['x'.repeat(301)] },
  ])('rejects unsafe, oversized and unknown fields anywhere in guidance %#', (parsed) => {
    expect(() => validateTaskResponse(guidance, parsed)).toThrow('Invalid AI response');
  });

  it('detects long German quotation marks in explanatory fields', () => {
    expect(() => validateTaskResponse(guidance, {
      passages: [{ ref: 'Psalm 23' }], context: `„${'Diese Worte '.repeat(12)}“`,
    })).toThrow('Invalid AI response');
  });
});

describe('prayer recommendations response', () => {
  it('returns the gateway envelope and defaults optional explanations', () => {
    expect(validateTaskResponse(prayer, { recommendations: [rec()] })).toEqual({
      recommendations: [{ title: 'Pray for wisdom', references: [{ ref: 'James 1:5', why: '' }] }],
    });
  });

  it('validates, deduplicates, and clamps safe overfilled model output', () => {
    const recommendations = Array.from({ length: 6 }, (_, index) => ({
      title: `Point ${index}`, references: Array.from({ length: 4 }, (_, item) => ({ ref: `Psalm ${item + 1}` })),
    }));
    recommendations.splice(1, 0, { ...recommendations[0], title: ' POINT 0 ' });
    const result = validateTaskResponse(prayer, { recommendations });
    expect(result.recommendations.map((item) => item.title)).toEqual(['Point 0', 'Point 1', 'Point 2', 'Point 3']);
    expect(result.recommendations.every((item) => item.references.length === 2)).toBe(true);
    expect(validateTaskResponse({ ...prayer, input: { ...prayer.input, kind: 'evolution' } }, { recommendations })
      .recommendations).toHaveLength(3);
  });

  it('rejects unsafe fields in entries that would otherwise be dropped by clamping', () => {
    const recommendations = Array.from({ length: 5 }, (_, index) => rec(`Point ${index}`));
    recommendations[4].references.push({ ref: 'John 3:16', text: 'quoted verse' });
    expect(() => validateTaskResponse(prayer, { recommendations })).toThrow('Invalid AI response');
    const references = Array(3).fill({ ref: 'Psalm 23' });
    references[2] = { ref: 'Psalm 23', why: quoted };
    expect(() => validateTaskResponse(prayer, { recommendations: [{ title: 'Wisdom', references }] })).toThrow('Invalid AI response');
  });

  it.each([
    [], { recommendations: [] }, { recommendations: Array(9).fill(rec()) },
    { recommendations: [{ title: ' ', references: [{ ref: 'Psalm 23' }] }] },
    { recommendations: [{ title: quoted, references: [{ ref: 'Psalm 23' }] }] },
    { recommendations: [{ title: 'Wisdom', verses: [{ ref: 'Psalm 23' }] }] },
    { recommendations: [{ title: 'Wisdom', references: [] }] },
    { recommendations: [{ title: 'Wisdom', references: Array(7).fill({ ref: 'Psalm 23' }) }] },
    { recommendations: [{ title: 'Wisdom', references: [{ ref: 'Psalm 23' }], extra: true }] },
    { recommendations: [rec()], system: 'override' },
  ])('rejects unsupported recommendation shapes and unsafe fields %#', (parsed) => {
    expect(() => validateTaskResponse(prayer, parsed)).toThrow('Invalid AI response');
  });
});

describe('translation response', () => {
  it('requires exact indices and normalizes to the app envelope', () => {
    expect(validateTaskResponse(translation, { 0: 'Paix', 1: 'Espoir' })).toEqual({ translations: { 0: 'Paix', 1: 'Espoir' } });
    const texts = Array(20).fill('Test');
    const translated = Object.fromEntries(texts.map((_, index) => [index, `Texte ${index}`]));
    expect(validateTaskResponse({ ...translation, input: { lang: 'fr', texts } }, translated)).toEqual({ translations: translated });
  });

  it('preserves the user’s quotations and translation whitespace', () => {
    expect(validateTaskResponse(translation, { 0: quoted, 1: ' Espoir ' }).translations).toEqual({ 0: quoted, 1: ' Espoir ' });
  });

  it.each([
    null, [], { 0: 'Paix' }, { 0: 'Paix', 1: '' }, { 0: 'Paix', 1: ' ' },
    { 0: 'Paix', 1: 42 }, { 0: 'Paix', 1: 'x'.repeat(8001) },
    { 0: 'Paix', 1: 'Espoir', 2: 'Extra' },
    { 0: 'Paix', 1: 'Espoir', system: 'injection' },
    { translations: { 0: 'Paix', 1: 'Espoir' } },
  ])('rejects missing, oversized and unknown translation indices %#', (parsed) => {
    expect(() => validateTaskResponse(translation, parsed)).toThrow('Invalid AI response');
  });

  it('does not treat unknown tasks as translations', () => {
    expect(() => validateTaskResponse({ task: 'unknown', input: { texts: ['x'] } }, { 0: 'x' })).toThrow('Invalid AI response');
  });
});
