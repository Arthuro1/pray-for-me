import { describe, expect, it } from 'vitest';
import { bibleLink } from './bibleLink';

describe('bibleLink', () => {
  it('opens a verse at its whole chapter in the selected Bible version', () => {
    expect(bibleLink('John 3:16', 'en'))
      .toBe('https://www.bible.com/bible/206/JHN.3');
    expect(bibleLink('Jean 3:16', 'fr'))
      .toBe('https://www.bible.com/bible/93/JHN.3');
  });

  it('removes a verse range while preserving numbered books and the chapter', () => {
    expect(bibleLink('1 Corinthians 13:4-7', 'en'))
      .toBe('https://www.bible.com/bible/206/1CO.13');
  });

  it('keeps chapter-only references at that chapter', () => {
    expect(bibleLink('Psalm 100', 'de'))
      .toBe('https://www.bible.com/bible/51/PSA.100');
  });

  it('falls back to Bible.com search when the reference cannot be mapped safely', () => {
    expect(bibleLink('Unknown book 2:3', 'en'))
      .toBe('https://www.bible.com/search/bible?q=Unknown%20book%202%3A3&version_id=206');
  });
});
