import { describe, it, expect } from 'vitest';
import { redactSensitive, redactMany, restore } from './aiRedaction';

describe('redactSensitive', () => {
  it('redacts an email and restores it', () => {
    const { text, map } = redactSensitive('Please pray for jane.doe@example.com and her family');
    expect(text).not.toContain('jane.doe@example.com');
    expect(text).toContain('[EMAIL_1]');
    expect(restore(text, map)).toContain('jane.doe@example.com');
  });

  it('redacts a phone number but leaves a verse range alone', () => {
    const { text } = redactSensitive('Call +1 415 555 2671 about Philippians 4:6-7');
    expect(text).toContain('[PHONE_1]');
    expect(text).toContain('Philippians 4:6-7');
  });

  it('redacts an API key / bearer token', () => {
    const { text } = redactSensitive('my key is sk-ABCD1234efgh5678ijkl and a bearer token: abc123DEF456ghi');
    expect(text).toContain('[SECRET_1]');
    expect(text).not.toContain('sk-ABCD1234efgh5678ijkl');
  });

  it('redacts a URL carrying a sensitive query parameter', () => {
    const { text } = redactSensitive('reset here https://example.com/r?token=supersecretvalue123 thanks');
    expect(text).toContain('[URL_1]');
    expect(text).not.toContain('supersecretvalue123');
  });

  it('redacts an identifiable street address', () => {
    const { text } = redactSensitive('We moved to 221 Baker Street last week');
    expect(text).toContain('[ADDRESS_1]');
    expect(text).not.toContain('221 Baker Street');
  });

  it('never redacts people\'s names — they are the point of a prayer', () => {
    const { text } = redactSensitive('Dear Lord Jesus, please heal John Smith and Mary Johnson on Monday');
    expect(text).toContain('John Smith');
    expect(text).toContain('Mary Johnson');
    expect(text).toContain('Dear Lord Jesus');
    expect(text).not.toContain('[NAME_');
  });
});

describe('redactMany', () => {
  it('shares placeholder numbering so identical values map consistently', () => {
    const { texts, map } = redactMany([
      'contact a@b.com',
      'again a@b.com and c@d.com',
    ]);
    expect(texts[0]).toContain('[EMAIL_1]');
    expect(texts[1]).toContain('[EMAIL_1]'); // same value → same placeholder
    expect(texts[1]).toContain('[EMAIL_2]');
    expect(restore(texts[1], map)).toBe('again a@b.com and c@d.com');
  });
});
