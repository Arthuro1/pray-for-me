// localizeRef must translate a reference's book name into every supported
// language — not just French. Regression guard for the bug where non-fr/en users
// saw Bible references (in prayer plans and Grow-tab teaching) in English only.
import { describe, it, expect } from 'vitest';
import { localizeRef } from './pick';
import { articles, guides, gospelJourney } from './index';
import { PLANS } from '../prayerPlans';

describe('localizeRef — book-name localization', () => {
  it('localizes the book name while keeping chapter:verse intact', () => {
    expect(localizeRef('Philippians 4:6-7', 'fr')).toBe('Philippiens 4:6-7');
    expect(localizeRef('Philippians 4:6-7', 'es')).toBe('Filipenses 4:6-7');
    expect(localizeRef('Philippians 4:6-7', 'zh')).toBe('腓立比书 4:6-7');
    expect(localizeRef('Philippians 4:6-7', 'ko')).toBe('빌립보서 4:6-7');
    expect(localizeRef('Philippians 4:6-7', 'ar')).toBe('فيلبي 4:6-7');
  });

  it('handles numbered books', () => {
    expect(localizeRef('1 Corinthians 13:4-7', 'fr')).toBe('1 Corinthiens 13:4-7');
    expect(localizeRef('1 Corinthians 13:4-7', 'zh')).toBe('哥林多前书 13:4-7');
    expect(localizeRef('2 Peter 3:9', 'de')).toBe('2. Petrus 3:9');
  });

  it('handles chapter-only references', () => {
    expect(localizeRef('Psalm 27', 'zh')).toBe('诗篇 27');
    expect(localizeRef('Psalm 27', 'ru')).toBe('Псалтирь 27');
  });

  it('accepts the "Psalms" alternate spelling', () => {
    expect(localizeRef('Psalms 100:4', 'es')).toBe('Salmos 100:4');
  });

  it('localizes books outside the daily-verse pool (Acts, Genesis, Revelation)', () => {
    expect(localizeRef('Acts 2:42', 'ko')).toBe('사도행전 2:42');
    expect(localizeRef('Genesis 1:26-27', 'ja')).toBe('創世記 1:26-27');
    expect(localizeRef('Revelation 3:20', 'pt')).toBe('Apocalipse 3:20');
  });

  it('leaves English and malformed input unchanged, and never throws on empties', () => {
    expect(localizeRef('Romans 8:28', 'en')).toBe('Romans 8:28');
    expect(localizeRef('not a reference', 'zh')).toBe('not a reference');
    expect(localizeRef('', 'zh')).toBe('');
    expect(localizeRef(null, 'zh')).toBe('');
    expect(localizeRef(undefined, undefined)).toBe('');
  });

  // Prayer verses are authored in the language active at creation, so a reference
  // may arrive in any language and still needs re-localizing to the reader's — not
  // only English → other (the teaching-content case above).
  it('re-localizes a reference authored in a non-English language', () => {
    expect(localizeRef('Jean 3:16', 'en')).toBe('John 3:16');
    expect(localizeRef('Jean 3:16', 'es')).toBe('Juan 3:16');
    expect(localizeRef('Salmos 23:1', 'en')).toBe('Psalm 23:1');
    expect(localizeRef('1 Corinthiens 13:4-7', 'ko')).toBe('고린도전서 13:4-7');
    expect(localizeRef('창세기 1:1', 'fr')).toBe('Genèse 1:1');
  });

  it('falls back to the original reference for an unknown book', () => {
    expect(localizeRef('Nostrabook 1:1', 'zh')).toBe('Nostrabook 1:1');
  });
});

// Collect every reference the app authors and shows through localizeRef.
function allAuthoredRefs() {
  const refs = [];
  for (const plan of PLANS) {
    if (plan.biblical?.ref) refs.push(plan.biblical.ref);
    for (const day of plan.days) {
      if (day.ref) refs.push(day.ref);
      refs.push(...(day.related || []));
    }
  }
  for (const article of articles) {
    for (const section of article.sections) refs.push(...(section.refs || []));
  }
  for (const guide of guides) {
    for (const step of guide.steps) if (step.passage) refs.push(step.passage);
  }
  for (const section of gospelJourney.sections) refs.push(...(section.refs || []));
  for (const q of gospelJourney.questions) refs.push(...(q.refs || []));
  return [...new Set(refs)];
}

describe('every authored reference is localizable in all languages', () => {
  const refs = allAuthoredRefs();
  // Non-Latin languages: a localized book name always differs from the English
  // original, so an unchanged result proves the book was left untranslated.
  const NON_LATIN = ['zh', 'ko', 'ja', 'ru', 'ar', 'hi'];

  it('covers a non-trivial set of references', () => {
    expect(refs.length).toBeGreaterThan(50);
  });

  for (const lang of NON_LATIN) {
    it(`translates the book name of every reference in "${lang}"`, () => {
      const untranslated = refs.filter((ref) => localizeRef(ref, lang) === ref);
      expect(untranslated).toEqual([]);
    });
  }
});
