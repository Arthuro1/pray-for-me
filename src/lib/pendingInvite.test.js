// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { isInvitePath, savePendingInvite, takePendingInvite } from './pendingInvite';

describe('isInvitePath', () => {
  it('matches the shareable invite routes an anonymous visitor can land on', () => {
    expect(isInvitePath('/community/join/ABC123')).toBe(true);
    expect(isInvitePath('/community/add-friend/some-uuid')).toBe(true);
  });

  it('ignores ordinary routes so we never hijack normal navigation', () => {
    expect(isInvitePath('/community')).toBe(false);
    expect(isInvitePath('/community/group/g1')).toBe(false);
    expect(isInvitePath('/')).toBe(false);
    expect(isInvitePath('')).toBe(false);
    expect(isInvitePath(undefined)).toBe(false);
  });
});

describe('save/takePendingInvite', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a stashed path across the auth boundary', () => {
    savePendingInvite('/community/join/ABC123');
    expect(takePendingInvite()).toBe('/community/join/ABC123');
  });

  it('is one-shot so a replay cannot loop', () => {
    savePendingInvite('/community/join/ABC123');
    expect(takePendingInvite()).toBe('/community/join/ABC123');
    expect(takePendingInvite()).toBe(null);
  });

  it('returns null when nothing was stashed', () => {
    expect(takePendingInvite()).toBe(null);
  });
});
