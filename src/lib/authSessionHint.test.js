import { describe, expect, it } from 'vitest';
import {
  AUTH_SESSION_HINT_KEY,
  hasAuthCallback,
  hasAuthSessionHint,
  setAuthSessionHint,
  shouldLoadAuthenticatedShell,
} from './authSessionHint';

function storage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    get length() { return values.size; },
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    key: (index) => [...values.keys()][index] ?? null,
  };
}

describe('authenticated shell bootstrap hint', () => {
  it('stores only a content-free session-presence bit', () => {
    const store = storage();
    setAuthSessionHint(true, store);
    expect(store.getItem(AUTH_SESSION_HINT_KEY)).toBe('1');
    expect(hasAuthSessionHint(store)).toBe(true);

    setAuthSessionHint(false, store);
    expect(store.getItem(AUTH_SESSION_HINT_KEY)).toBeNull();
  });

  it('recognizes a pre-existing Supabase session by storage key, not token contents', () => {
    const store = storage({ 'sb-project-ref-auth-token': 'sensitive-token-value' });
    expect(hasAuthSessionHint(store)).toBe(true);
  });

  it('loads auth for deep links and auth callbacks, but not a clean landing visit', () => {
    const empty = storage();
    expect(shouldLoadAuthenticatedShell({ pathname: '/', search: '', hash: '' }, empty)).toBe(false);
    expect(shouldLoadAuthenticatedShell({ pathname: '/community/join/abc', search: '', hash: '' }, empty)).toBe(true);
    expect(hasAuthCallback({ search: '?code=oauth-code', hash: '' })).toBe(true);
    expect(shouldLoadAuthenticatedShell({ pathname: '/', search: '?code=oauth-code', hash: '' }, empty)).toBe(true);
    expect(shouldLoadAuthenticatedShell({ pathname: '/', search: '?action=add-prayer', hash: '' }, empty)).toBe(false);
  });
});
