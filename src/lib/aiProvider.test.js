// @vitest-environment jsdom
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import {
  acknowledgeAiProvider,
  clearAiProviderAcknowledgement,
  getAiProvider,
  getAiProviderLabel,
  hasAiProviderAcknowledgement,
} from './aiProvider';

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv('VITE_AI_PROVIDER', 'anthropic');
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('AI provider disclosure acknowledgement', () => {
  it('preserves private-service consent without requiring an external-provider acknowledgement', () => {
    vi.stubEnv('VITE_AI_PROVIDER', 'ollama');
    expect(getAiProvider()).toBe('ollama');
    expect(getAiProviderLabel()).toBe('Qetoret');
    expect(hasAiProviderAcknowledgement('account-a', 'prayer')).toBe(true);
  });

  it('matches the direct server default and requires Claude disclosure when the build variable is omitted', () => {
    vi.stubEnv('VITE_AI_PROVIDER', '');
    expect(getAiProvider()).toBe('anthropic');
    expect(getAiProviderLabel()).toBe('Claude (Anthropic)');
    expect(hasAiProviderAcknowledgement('account-a', 'prayer')).toBe(false);
  });

  it('scopes the external-provider acknowledgement to the account and consent context', () => {
    expect(getAiProviderLabel()).toBe('Claude (Anthropic)');
    expect(hasAiProviderAcknowledgement('account-a')).toBe(false);
    acknowledgeAiProvider('account-a', 'prayer');
    expect(hasAiProviderAcknowledgement('account-a', 'prayer')).toBe(true);
    expect(hasAiProviderAcknowledgement('account-a')).toBe(true);
    expect(hasAiProviderAcknowledgement('account-a', 'home')).toBe(false);
    expect(hasAiProviderAcknowledgement('account-b')).toBe(false);
    expect(hasAiProviderAcknowledgement(null)).toBe(false);
  });

  it('rejects acknowledgement of an outdated disclosure revision', () => {
    acknowledgeAiProvider('account-a');
    localStorage.setItem(localStorage.key(0), 'anthropic:0');
    expect(hasAiProviderAcknowledgement('account-a')).toBe(false);
  });

  it('clears both grants only for the account withdrawing consent', () => {
    acknowledgeAiProvider('account-a', 'prayer');
    acknowledgeAiProvider('account-a', 'home');
    acknowledgeAiProvider('account-b', 'prayer');
    clearAiProviderAcknowledgement('account-a');
    expect(hasAiProviderAcknowledgement('account-a')).toBe(false);
    expect(hasAiProviderAcknowledgement('account-b')).toBe(true);
  });

  it('fails closed when browser storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('unavailable'); });
    expect(hasAiProviderAcknowledgement('account-a')).toBe(false);
  });
});
