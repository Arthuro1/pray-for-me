// The shared verse card is artwork we can't eyeball on 16 scripts every release,
// so the geometry is pinned here: the type ramp, the wrapping that keeps CJK
// inside the margin, the right-to-left flip, the story frame's keep-out zones,
// and the reference-only fallback that must never invent Scripture.
import { describe, it, expect } from 'vitest';
import {
  CARD_SIZES,
  constellationFigure,
  VERSE_TEXT_LIMIT,
  layoutVerseCard,
  starField,
  verseFontSize,
  weightedLength,
  wrapLines,
} from './verseCard';

// Every glyph is half its point size wide. Crude, but it makes the expected line
// breaks arithmetic instead of font-dependent.
const measure = (text, fontSize) => text.length * fontSize * 0.5;

const layout = (overrides = {}) => layoutVerseCard({
  label: 'Verset du jour',
  verse: 'Le Seigneur est près de tous ceux qui l’invoquent.',
  reference: 'Psaume 145:18',
  invite: 'Lisez-le dans votre Bible',
  measure,
  ...overrides,
});

describe('weightedLength', () => {
  it('counts a Latin character as one', () => {
    expect(weightedLength('Priez sans cesse.')).toBe(17);
  });

  it('counts an ideograph as nearly two, so CJK verses land on the right step', () => {
    expect(weightedLength('不住地祷告')).toBeCloseTo(9, 5);
    // 26 Chinese glyphs weigh more than 40 Latin characters would.
    expect(weightedLength('你们要先求他的国和他的义，这些东西都要加给你们了。')).toBeGreaterThan(40);
  });
});

describe('verseFontSize', () => {
  it('sets a short verse large and a long one small', () => {
    expect(verseFontSize('Pray without ceasing.')).toBe(84);
    expect(verseFontSize('x'.repeat(80))).toBe(64);
    expect(verseFontSize('x'.repeat(150))).toBe(52);
    expect(verseFontSize('x'.repeat(255))).toBe(44);
  });

  it('refuses to set a passage past the ramp instead of shrinking further', () => {
    expect(verseFontSize('x'.repeat(VERSE_TEXT_LIMIT + 1))).toBeNull();
  });
});

describe('wrapLines', () => {
  it('breaks on spaces and keeps every line inside the width', () => {
    const lines = wrapLines({ text: 'aaa bbb ccc ddd', maxWidth: 40, measure: (t) => t.length * 10 });
    expect(lines).toEqual(['aaa', 'bbb', 'ccc', 'ddd']);
  });

  it('breaks a space-less run per character, which is the only thing that fits CJK', () => {
    const lines = wrapLines({ text: '你们要先求他的国', maxWidth: 40, measure: (t) => t.length * 10 });
    expect(lines).toEqual(['你们要先', '求他的国']);
    expect(lines.join('')).toBe('你们要先求他的国');
  });
});

describe('layoutVerseCard — square', () => {
  it('keeps every line inside the margins', () => {
    const card = layout();
    const boxWidth = CARD_SIZES.square.width - CARD_SIZES.square.margin * 2;
    expect(card.mode).toBe('verse');
    for (const line of card.verse.lines) {
      expect(measure(line, card.verse.size)).toBeLessThanOrEqual(boxWidth);
    }
  });

  it('puts the reference in the footer opposite the wordmark', () => {
    const card = layout();
    expect(card.reference.align).toBe('right');
    expect(card.mark.align).toBe('left');
    expect(card.reference.y).toBe(card.mark.y);
    expect(card.rule.y).toBeLessThan(card.mark.y);
  });

  it('draws a constellation into the sky a short verse leaves empty', () => {
    const short = layout({ verse: 'Priez sans cesse.' });
    expect(short.figure).toBeTruthy();
    // On the side the text doesn't occupy, and clear of both the label and the verse.
    expect(short.figure.x).toBeGreaterThan(short.verse.x);
    expect(short.figure.x + short.figure.width).toBe(CARD_SIZES.square.width - CARD_SIZES.square.margin);
    expect(short.figure.y).toBeGreaterThan(short.label.y);
    expect(short.figure.y + short.figure.height).toBeLessThan(short.verse.y);
    expect(layout().figure).toBeNull();
  });

  it('gives CJK more leading than Latin at the same step', () => {
    const cjk = layout({ verse: '你们要先求他的国和他的义。', lang: 'zh' });
    expect(cjk.verse.lineHeight).toBe(Math.round(cjk.verse.size * 1.6));
    expect(layout().verse.lineHeight).toBe(Math.round(layout().verse.size * 1.42));
  });
});

describe('layoutVerseCard — right to left', () => {
  it('flips the label, the verse and the footer halves', () => {
    const card = layout({ lang: 'ar', verse: 'صلوا بلا انقطاع.', reference: 'متى 7:7' });
    expect(card.dir).toBe('rtl');
    expect(card.label.align).toBe('right');
    expect(card.verse.align).toBe('right');
    expect(card.verse.x).toBe(CARD_SIZES.square.width - CARD_SIZES.square.margin);
    expect(card.reference.align).toBe('left');
    expect(card.mark.align).toBe('right');
  });

  it('moves the constellation to the side the right-aligned verse leaves free', () => {
    const card = layout({ lang: 'ar', verse: 'صلوا بلا انقطاع.' });
    expect(card.figure.x).toBe(CARD_SIZES.square.margin);
  });
});

describe('layoutVerseCard — story', () => {
  it('holds the artwork clear of the platform chrome', () => {
    const card = layout({ size: 'story' });
    const { height } = CARD_SIZES.story;
    expect(card.label.y).toBeGreaterThan(height * 0.14);
    expect(card.mark.y).toBeLessThan(height * 0.79);
    expect(card.mark.align).toBe('center');
  });

  it('turns the reference into a caption under the verse', () => {
    const card = layout({ size: 'story' });
    expect(card.reference.align).toBe('left');
    expect(card.reference.y).toBeGreaterThan(card.verse.y);
    expect(card.reference.y).toBeLessThan(card.rule.y);
  });
});

describe('layoutVerseCard — reference only', () => {
  it('falls back to the reference when no authoritative text exists', () => {
    const card = layout({ verse: '' });
    expect(card.mode).toBe('reference');
    expect(card.verse).toBeNull();
    expect(card.reference.text).toBe('Psaume 145:18');
    expect(card.reference.align).toBe('center');
    expect(card.invite.text).toBe('Lisez-le dans votre Bible');
  });

  it('does the same for a passage too long to set, rather than shrinking it away', () => {
    expect(layout({ verse: 'x'.repeat(VERSE_TEXT_LIMIT + 1) }).mode).toBe('reference');
  });
});

describe('starField', () => {
  it('is the same sky for everyone on the same day', () => {
    const args = { width: 1080, height: 1080, count: 12 };
    expect(starField({ seed: '2026-08-25', ...args })).toEqual(starField({ seed: '2026-08-25', ...args }));
    expect(starField({ seed: '2026-08-26', ...args })).not.toEqual(starField({ seed: '2026-08-25', ...args }));
  });

  it('stays inside the canvas', () => {
    for (const star of starField({ seed: 'x', width: 1080, height: 1920, count: 40 })) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(1080);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThanOrEqual(1920);
    }
  });
});

describe('constellationFigure', () => {
  const box = { x: 500, y: 200, width: 400, height: 260 };

  it('keeps every star inside the space the layout set aside', () => {
    for (const point of constellationFigure({ seed: '2026-08-25', box })) {
      expect(point.x).toBeGreaterThanOrEqual(box.x);
      expect(point.x).toBeLessThanOrEqual(box.x + box.width);
      expect(point.y).toBeGreaterThanOrEqual(box.y);
      expect(point.y).toBeLessThanOrEqual(box.y + box.height);
    }
  });

  it('wanders left to right, so the joining line never doubles back', () => {
    const xs = constellationFigure({ seed: 'a', box }).map((point) => point.x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
  });
});
