import { describe, expect, it } from 'vitest';
import { containsSensitiveContactDetails, safetyText } from './communitySafety';

describe('community sharing safety', () => {
  it('detects phone numbers and email addresses locally', () => {
    expect(containsSensitiveContactDetails('Call +49 151 234 5678')).toBe(true);
    expect(containsSensitiveContactDetails('write to care@example.org')).toBe(true);
    expect(containsSensitiveContactDetails('Please pray for wisdom this week')).toBe(false);
  });

  it('provides localized copy with an English fallback', () => {
    expect(safetyText('fr', 'report')).toBe('Signaler');
    expect(safetyText('unknown', 'block')).toBe('Block author');
  });
});
