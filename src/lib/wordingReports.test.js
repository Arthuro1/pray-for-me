import { describe, it, expect, vi } from 'vitest';
vi.mock('./supabase', () => ({ supabase: { from: vi.fn() } }));
import { buildWordingPayload, canReviewWording, updateWordingStatus } from './wordingReports';
import { supabase } from './supabase';

describe('wording report privacy and authorization', () => {
  const entries = [{ id: 'ui:save', locale: 'de', surface: 'ui', text: 'Speichern', privatePrayer: 'Do not send this' }];
  it('sends only the published-text allowlist and explicit correction', () => {
    expect(buildWordingPayload(entries, 'ui:save', 'de', 'unclear', '  Sichern  ')).toEqual({ locale: 'de', translation_key: 'ui:save', screen: 'ui', current_string: 'Speichern', issue_type: 'unclear', suggested_wording: 'Sichern' });
  });
  it('rejects unknown text, mismatched language and unsupported categories', () => {
    expect(() => buildWordingPayload(entries, 'private prayer', 'de', 'unclear', '')).toThrow();
    expect(() => buildWordingPayload(entries, 'ui:save', 'fr', 'unclear', '')).toThrow();
    expect(() => buildWordingPayload(entries, 'ui:save', 'de', 'approved', '')).toThrow();
    expect(() => buildWordingPayload(entries, 'ui:save', 'de', 'unclear', 'x'.repeat(2001))).toThrow();
  });
  it('does not accept user-editable metadata or anonymous editor claims', () => {
    expect(canReviewWording({ user_metadata: { content_reviewer: true } })).toBe(false);
    expect(canReviewWording({ app_metadata: { content_reviewer: 'true' } })).toBe(false);
    expect(canReviewWording({ is_anonymous: true, app_metadata: { content_reviewer: true } })).toBe(false);
    expect(canReviewWording({ app_metadata: { content_reviewer: true } })).toBe(true);
  });
  it('treats a denied or zero-row editor update as failure', async () => {
    supabase.from.mockReturnValue({ update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ error: new Error('No row') }) }) }) }) });
    await expect(updateWordingStatus('id', 'resolved')).rejects.toThrow('No row');
  });
});
