// The shared verse card is artwork we can't eyeball on 16 scripts every release,
// so the geometry is checked here: readable type, intact content, citations
// beside Scripture, right-to-left reading order and story safe zones.
import { describe, it, expect } from 'vitest';
import {
  CARD_SIZES,
  VERSE_TEXT_LIMIT,
  layoutVerseCard,
  riseFigure,
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

const lastBaseline = (part) => part.y + (part.lines.length - 1) * part.lineHeight;
const boxBottom = (part) => lastBaseline(part) + part.lineHeight / 2 - part.size * 0.35;
const expectLinesFit = (card, part, metrics = measure) => {
  for (const line of part.lines) {
    expect(metrics(line, part.size)).toBeLessThanOrEqual(card.width - card.margin * 2);
  }
  expect(boxBottom(part)).toBeLessThan(card.rule.y);
};

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
    expect(verseFontSize('Pray without ceasing.')).toBe(100);
    expect(verseFontSize('x'.repeat(80))).toBe(80);
    expect(verseFontSize('x'.repeat(150))).toBe(64);
    expect(verseFontSize('x'.repeat(255))).toBe(54);
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

  it('keeps the citation with the verse and gives the brand its own footer', () => {
    const card = layout();
    expect(card.reference.align).toBe(card.verse.align);
    expect(card.reference.x).toBe(card.verse.x);
    expect(card.reference.y - card.reference.size).toBeGreaterThan(lastBaseline(card.verse));
    expectLinesFit(card, card.reference);
    expect(card.brand.x).toBe(card.margin);
    expect(card.mark.align).toBe('right');
    expect(card.mark.text).toBe('qetoret.com');
    expect(card.brand.y).toBeGreaterThan(card.rule.y);
    expect(card.rule.y).toBeLessThan(card.mark.y);
  });

  it('carries the Rise silhouette on both short and longer cards', () => {
    const short = layout({ verse: 'Priez sans cesse.' });
    expect(short.figure).toBeTruthy();
    expect(short.figure.x).toBeGreaterThan(short.verse.x);
    expect(short.figure.y).toBeGreaterThan(short.label.y);
    expect(short.figure.y + short.figure.height).toBeLessThan(short.rule.y);
    expect(layout().figure).toEqual(short.figure);
  });

  it('gives CJK more leading than Latin at the same step', () => {
    const cjk = layout({ verse: '你们要先求他的国和他的义。', lang: 'zh' });
    expect(cjk.verse.lineHeight / cjk.verse.size).toBeGreaterThan(layout().verse.lineHeight / layout().verse.size);
    expectLinesFit(cjk, cjk.verse);
    expect(cjk.verse.lines.join('')).toBe('你们要先求他的国和他的义。');
  });

  it('fits a wide fallback face without clipping or changing a long passage', () => {
    // Synthetic text exercises the metrics; it is not Scripture content.
    const verse = Array(45).fill('word').join(' ');
    const wideMeasure = (text, fontSize) => text.length * fontSize * 0.75;
    const card = layout({ verse, measure: wideMeasure });
    expect(card.mode).toBe('verse');
    expect(card.verse.size).toBeLessThan(verseFontSize(verse));
    expect(card.verse.size).toBeGreaterThanOrEqual(44);
    expect(card.verse.lines.join(' ')).toBe(verse);
    expectLinesFit(card, card.verse, wideMeasure);
    expect(card.reference.y - card.reference.size).toBeGreaterThan(lastBaseline(card.verse));
    expectLinesFit(card, card.reference, wideMeasure);
  });

  it('wraps a long citation and edition beneath Scripture without losing either', () => {
    const verse = 'Le Seigneur est près de tous ceux qui l’invoquent.';
    const reference = 'Deuxième épître aux Thessaloniciens 2:16–17 · Louis Segond 1910';
    const card = layout({ verse, reference });
    expect(card.mode).toBe('verse');
    expect(card.verse.lines.join(' ')).toBe(verse);
    expect(card.reference.lines.length).toBeGreaterThan(1);
    expect(card.reference.lines.join(' ')).toBe(reference);
    expect(card.reference.y - card.reference.size).toBeGreaterThan(lastBaseline(card.verse));
    expectLinesFit(card, card.reference);
  });

  it('uses the reference fallback when measured text cannot fit readably', () => {
    const card = layout({ verse: 'x'.repeat(250), measure: (text, fontSize) => text.length * fontSize });
    expect(card.mode).toBe('reference');
    expect(card.verse).toBeNull();
    expect(card.reference.text).toBe('Psaume 145:18');
  });
});

describe('layoutVerseCard — right to left', () => {
  it('flips the label, the verse and the footer halves', () => {
    const card = layout({ lang: 'ar', verse: 'صلوا بلا انقطاع.', reference: 'متى 7:7' });
    expect(card.dir).toBe('rtl');
    expect(card.label.align).toBe('right');
    expect(card.verse.align).toBe('right');
    expect(card.verse.x).toBe(CARD_SIZES.square.width - CARD_SIZES.square.margin);
    expect(card.reference.align).toBe('right');
    expect(card.reference.x).toBe(card.verse.x);
    expect(card.mark.align).toBe('left');
    expect(card.brand.x).toBeGreaterThan(card.width / 2);
  });

  it('moves the Rise Mark to the side the right-aligned verse leaves free', () => {
    const card = layout({ lang: 'ar', verse: 'صلوا بلا انقطاع.' });
    const ltr = layout();
    expect(card.figure.x + card.figure.width).toBe(CARD_SIZES.square.width - ltr.figure.x);
  });

  it.each(['ar', 'fa', 'hi', 'am', 'zh', 'ja', 'ko'])('keeps the %s label untracked', (lang) => {
    const label = lang === 'ar' ? 'آية اليوم' : 'Label';
    const card = layout({ lang, label });
    expect(card.label.text).toBe(label);
    expect(card.label.spacing).toBe(0);
  });
});

describe('layoutVerseCard — story', () => {
  it.each(['verse', 'reference'])('holds %s artwork clear of platform chrome', (mode) => {
    const card = layout({ size: 'story', ...(mode === 'reference' ? { verse: '' } : {}) });
    const { height } = CARD_SIZES.story;
    expect(card.label.y - card.label.size).toBeGreaterThan(height * 0.14);
    expect(card.figure.y).toBeGreaterThan(height * 0.14);
    expect(card.figure.y + card.figure.height).toBeLessThan(height * 0.8);
    expect(card.accent.y).toBeGreaterThan(card.label.y);
    expect(card.brand.y + card.brand.height).toBeLessThan(height * 0.8);
    expect(card.mark.y + card.mark.size * 0.3).toBeLessThan(height * 0.8);
    if (card.verse) expectLinesFit(card, card.verse);
    expectLinesFit(card, card.reference);
    if (card.invite) expectLinesFit(card, card.invite);
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
    expect(card.reference.align).toBe('left');
    expect(card.invite.text).toBe('Lisez-le dans votre Bible');
    expect(card.figure).toBeTruthy();
  });

  it('does the same for a passage too long to set, rather than shrinking it away', () => {
    expect(layout({ verse: 'x'.repeat(VERSE_TEXT_LIMIT + 1) }).mode).toBe('reference');
  });

  it.each(['square', 'story'])('fits a long reference and invitation in %s format', (size) => {
    const reference = 'Deuxième épître aux Thessaloniciens 2:16–17 · Louis Segond 1910';
    const invite = 'Lisez ce passage dans votre Bible et prenez un moment pour le méditer aujourd’hui.';
    const card = layout({ size, verse: '', reference, invite });
    expect(card.mode).toBe('reference');
    expect(card.reference.lines.length).toBeGreaterThan(1);
    expect(card.reference.lines.join(' ')).toBe(reference);
    expect(card.invite.lines.length).toBeGreaterThan(1);
    expect(card.invite.lines.join(' ')).toBe(invite);
    expect(card.invite.y - card.invite.size).toBeGreaterThan(lastBaseline(card.reference));
    expectLinesFit(card, card.reference);
    expectLinesFit(card, card.invite);
  });
});

describe('riseFigure', () => {
  const box = { x: 500, y: 200, width: 400, height: 260 };

  it('keeps the Rise Mark inside the space the layout set aside', () => {
    const { bounds } = riseFigure({ box });
    expect(bounds.x).toBeGreaterThanOrEqual(box.x);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(box.x + box.width);
    expect(bounds.y).toBeGreaterThanOrEqual(box.y);
    expect(bounds.y + bounds.height).toBeCloseTo(box.y + box.height);
  });

  it('rises from the bottom of the space, centred across it, and never taller than asked', () => {
    const { bounds } = riseFigure({ box, maxHeight: 120 });
    expect(bounds.height).toBe(120);
    expect(bounds.x + bounds.width / 2).toBeCloseTo(box.x + box.width / 2);
  });
});
