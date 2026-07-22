import { describe, it, expect } from 'vitest';
import { EVENTS, isEventAllowed, sanitizeProps } from './analytics';

describe('isEventAllowed', () => {
  it('accepts declared events and rejects anything else', () => {
    expect(isEventAllowed(EVENTS.FIRST_PRAYER_CREATED)).toBe(true);
    expect(isEventAllowed('first_prayer_created')).toBe(true);
    expect(isEventAllowed('read_prayer_text')).toBe(false);
    expect(isEventAllowed('')).toBe(false);
    expect(isEventAllowed(undefined)).toBe(false);
  });

  // The product activation/habit funnel the app is expected to be able to
  // measure. Guards against an event name being dropped or renamed by accident.
  it('allowlists the full required product-activation event set', () => {
    const required = [
      'first_prayer_created', 'reminder_set', 'prayer_prayed', 'prayer_updated',
      'prayer_answered', 'vault_enabled', 'ai_consent_enabled', 'ai_consent_revoked',
      'group_joined', 'prayer_shared', 'data_exported', 'account_deleted_started',
      'privacy_center_opened',
    ];
    for (const name of required) expect(isEventAllowed(name)).toBe(true);
  });

  // The pray-first guest funnel is measurable but content-free: only THAT each
  // step happened, never the prayer subject.
  it('allowlists the content-free guest funnel events', () => {
    for (const name of ['guest_prayer_started', 'guest_prayer_prayed', 'guest_prayer_save_requested', 'guest_prayer_imported']) {
      expect(isEventAllowed(name)).toBe(true);
    }
  });

  // No paid-plan gating ships in the app, so the Supporter/feature-gate events
  // must NOT exist — this guards against them being reintroduced.
  it('does not allow Supporter / feature-gate prompt events', () => {
    for (const name of ['supporter_prompt_viewed', 'supporter_prompt_clicked', 'feature_gate_seen']) {
      expect(isEventAllowed(name)).toBe(false);
    }
  });
});

describe('sanitizeProps — the privacy guard', () => {
  it('keeps allowlisted scalar props', () => {
    expect(sanitizeProps({ source: 'settings', count: 3, enabled: true })).toEqual({
      source: 'settings', count: 3, enabled: true,
    });
  });

  it('drops any key not on the allowlist (content, and the removed plan/tier keys)', () => {
    const dirty = {
      title: 'Pray for my mother',
      description: 'she is very sick',
      personName: 'Jane Doe',
      phone: '+15551234567',
      testimony: 'God healed her',
      prompt: 'write a prayer about...',
      text: 'secret',
      plan: 'supporter', // plan/tier are no longer tracked at all
      tier: 'supporter',
      source: 'settings',
    };
    expect(sanitizeProps(dirty)).toEqual({ source: 'settings' });
  });

  // A guest event must never smuggle the prayer subject or the draft id — those
  // keys aren't allowlisted, so nothing survives.
  it('strips a guest prayer subject / draft id even if an event tried to carry them', () => {
    expect(sanitizeProps({ title: 'pray for my brother', draftId: 'a1b2', personName: 'Jane' })).toBeUndefined();
  });

  it('drops non-scalar values even on allowlisted keys', () => {
    expect(sanitizeProps({ source: { nested: 1 }, count: [1, 2], method: () => {} })).toBeUndefined();
  });

  it('drops overly long strings (guards against smuggled free text)', () => {
    const long = 'x'.repeat(65);
    expect(sanitizeProps({ source: long })).toBeUndefined();
    expect(sanitizeProps({ source: 'onboarding' })).toEqual({ source: 'onboarding' });
  });

  it('returns undefined for empty / non-object input', () => {
    expect(sanitizeProps(undefined)).toBeUndefined();
    expect(sanitizeProps(null)).toBeUndefined();
    expect(sanitizeProps({})).toBeUndefined();
    expect(sanitizeProps('nope')).toBeUndefined();
  });

  it('drops NaN / infinite numbers', () => {
    expect(sanitizeProps({ count: NaN })).toBeUndefined();
    expect(sanitizeProps({ count: Infinity })).toBeUndefined();
  });
});
