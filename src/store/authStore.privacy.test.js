import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authChange: null,
  getSession: vi.fn(),
  clearTranslationCache: vi.fn(),
  clearAllAiResultCaches: vi.fn(),
  resetAiRequestState: vi.fn(),
  clearGroupKeyCache: vi.fn(),
  clearUserKeyCache: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({ supabase: { auth: {
  getSession: mocks.getSession,
  onAuthStateChange: (callback) => { mocks.authChange = callback; },
} } }));
vi.mock('../lib/dataCache', () => ({ clearLocalData: vi.fn() }));
vi.mock('../lib/crypto/accountKey', () => ({ forgetAccountKey: vi.fn() }));
vi.mock('../lib/pendingInvite', () => ({ authRedirectTarget: vi.fn() }));
vi.mock('../lib/authSessionHint', () => ({ setAuthSessionHint: vi.fn() }));
vi.mock('../lib/identityPhoto', () => ({ setIdentityUser: vi.fn() }));
vi.mock('../lib/avatarPhotos', () => ({ AVATAR_SCOPES: [], removeAllAvatarObjects: vi.fn() }));
vi.mock('../lib/serviceWorkerSecurity', () => ({ clearServiceWorkerUserCaches: vi.fn() }));
vi.mock('../lib/crypto/userKeys', () => ({ clearUserKeyCache: mocks.clearUserKeyCache }));
vi.mock('../lib/crypto/groupKeys', () => ({ clearGroupKeyCache: mocks.clearGroupKeyCache }));
vi.mock('../lib/aiResultCache', () => ({ clearAllAiResultCaches: mocks.clearAllAiResultCaches }));
vi.mock('../lib/aiCore', () => ({ resetAiRequestState: mocks.resetAiRequestState }));
vi.mock('./translationStore', () => ({ clearTranslationCache: mocks.clearTranslationCache }));

import useAuthStore from './authStore';

beforeEach(async () => {
  vi.clearAllMocks();
  mocks.authChange = null;
  useAuthStore.setState({ user: null, loading: true });
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'account-a' } } } });
  await useAuthStore.getState().init();
});

describe('auth event AI privacy boundary', () => {
  it.each([
    ['SIGNED_OUT', null],
    ['SIGNED_IN', { user: { id: 'account-b' } }],
  ])('clears AI work on an external %s account transition', (event, session) => {
    // These callbacks also cover Supabase auth events broadcast by another tab.
    mocks.authChange(event, session);
    expect(mocks.clearTranslationCache).toHaveBeenCalledTimes(1);
    expect(mocks.clearAllAiResultCaches).toHaveBeenCalledTimes(1);
    expect(mocks.resetAiRequestState).toHaveBeenCalledTimes(1);
    expect(mocks.clearGroupKeyCache).toHaveBeenCalledTimes(1);
    expect(mocks.clearUserKeyCache).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user?.id).toBe(session?.user?.id);
  });

  it('keeps pending work and cooldowns when the same account refreshes its token', () => {
    mocks.authChange('TOKEN_REFRESHED', { user: { id: 'account-a' } });
    expect(mocks.clearTranslationCache).not.toHaveBeenCalled();
    expect(mocks.clearAllAiResultCaches).not.toHaveBeenCalled();
    expect(mocks.resetAiRequestState).not.toHaveBeenCalled();
    expect(mocks.clearGroupKeyCache).not.toHaveBeenCalled();
  });

  it('cancels work before exposing the new account to store subscribers', () => {
    let sawNewAccount = false;
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state.user?.id !== 'account-b') return;
      sawNewAccount = true;
      expect(mocks.clearTranslationCache).toHaveBeenCalledTimes(1);
      expect(mocks.resetAiRequestState).toHaveBeenCalledTimes(1);
    });
    mocks.authChange('SIGNED_IN', { user: { id: 'account-b' } });
    unsubscribe();
    expect(sawNewAccount).toBe(true);
  });
});
