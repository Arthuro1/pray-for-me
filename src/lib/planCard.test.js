import { describe, it, expect } from 'vitest';
import { clampLines, layoutPlanCard, planTitleSize } from './planCard';
import { CARD_SIZES } from './verseCard';

// Every glyph is half its font size wide — enough to exercise wrapping.
const measure = (text, size) => String(text).length * size * 0.5;

const base = {
  label: 'Pray with me',
  title: 'Seven Days at the Altar',
  meta: '7 days',
  sub: 'A week of daily surrender before God',
  count: 7,
  measure,
};

describe('planTitleSize', () => {
  it('sets a short name large and a long one smaller, never below the floor', () => {
    expect(planTitleSize('Fast')).toBe(104);
    expect(planTitleSize('Seven Days at the Altar with Friends')).toBe(88);
    expect(planTitleSize('x'.repeat(200))).toBe(60);
  });
});

describe('clampLines', () => {
  it('ends the last kept line with an ellipsis that still fits', () => {
    const lines = clampLines(['aaaa', 'bbbb', 'cccc'], 2, 4 * 5, (text) => text.length * 5);
    expect(lines).toEqual(['aaaa', 'bbb…']);
  });

  it('leaves short text alone', () => {
    expect(clampLines(['one'], 3, 100, measure)).toEqual(['one']);
  });
});

describe('layoutPlanCard', () => {
  it('keeps every line inside the margins and above the footer rule', () => {
    for (const size of ['square', 'story']) {
      const layout = layoutPlanCard({ ...base, size });
      const { width, margin } = CARD_SIZES[size];
      for (const line of layout.title.lines) expect(measure(line, layout.title.size)).toBeLessThanOrEqual(width - margin * 2);
      const lastSub = layout.sub.y + (layout.sub.lines.length - 1) * layout.sub.lineHeight;
      expect(lastSub).toBeLessThan(layout.rule.y);
      expect(layout.label.y).toBeLessThan(layout.title.y);
    }
  });

  it('stays out of the platform chrome in the story frame', () => {
    const layout = layoutPlanCard({ ...base, size: 'story' });
    const { height } = CARD_SIZES.story;
    expect(layout.label.y).toBeGreaterThan(height * 0.14);
    expect(layout.mark.y).toBeLessThan(height * 0.8);
    expect(layout.mark.align).toBe('center');
  });

  it('never runs a very long name or subtitle past its line budget', () => {
    const layout = layoutPlanCard({ ...base, title: 'word '.repeat(80), sub: 'long '.repeat(200) });
    expect(layout.title.lines.length).toBeLessThanOrEqual(4);
    expect(layout.sub.lines.length).toBeLessThanOrEqual(3);
    expect(layout.sub.lines.at(-1).endsWith('…')).toBe(true);
  });

  it('hangs text off the right margin for right-to-left languages', () => {
    const layout = layoutPlanCard({ ...base, lang: 'ar' });
    expect(layout.dir).toBe('rtl');
    expect(layout.title.align).toBe('right');
    expect(layout.title.x).toBe(CARD_SIZES.square.width - CARD_SIZES.square.margin);
    expect(layout.figure.x).toBe(CARD_SIZES.square.margin);
  });

  it('draws a constellation of the plan length, within a readable range', () => {
    expect(layoutPlanCard({ ...base, count: 7 }).figure.count).toBe(7);
    expect(layoutPlanCard({ ...base, count: 42 }).figure.count).toBe(12);
    expect(layoutPlanCard({ ...base, count: 1 }).figure.count).toBe(3);
  });

  it('omits the subtitle cleanly when there is none', () => {
    expect(layoutPlanCard({ ...base, sub: '' }).sub).toBe(null);
  });
});
