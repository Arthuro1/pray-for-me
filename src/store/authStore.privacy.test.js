import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authChange: null,
  getSession: vi.fn(),
  getUser: vi.fn(),
  signOut: vi.fn(),
  clearLocalData: vi.fn(),
  clearTranslationCache: vi.fn(),
  clearAllAiResultCaches: vi.fn(),
  resetAiRequestState: vi.fn(),
  clearGroupKeyCache: vi.fn(),
  clearUserKeyCache: vi.fn(),
  configureAccountContext: vi.fn(),
  getLifecycleToken: vi.fn(),
  isLifecycleCurrent: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({ supabase: { auth: {
  getSession: mocks.getSession,
  getUser: mocks.getUser,
  signOut: mocks.signOut,
  onAuthStateChange: (callback) => { mocks.authChange = callback; },
} } }));
vi.mock('../lib/dataCache', () => ({ clearLocalData: mocks.clearLocalData }));
vi.mock('../lib/crypto/accountKey', () => ({ forgetAccountKey: vi.fn() }));
vi.mock('../lib/crypto/keyManager', () => ({
  configureAccountContext: mocks.configureAccountContext,
  getLifecycleToken: mocks.getLifecycleToken,
  isLifecycleCurrent: mocks.isLifecycleCurrent,
}));
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
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'account-a' } } });
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.getLifecycleToken.mockReturnValue({ accountId: null, generation: 1 });
  mocks.isLifecycleCurrent.mockReturnValue(true);
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
    expect(mocks.configureAccountContext).toHaveBeenLastCalledWith(session?.user?.id ?? null);
    expect(useAuthStore.getState().user?.id).toBe(session?.user?.id);
  });

  it('keeps pending work and cooldowns when the same account refreshes its token', () => {
    mocks.authChange('TOKEN_REFRESHED', { user: { id: 'account-a' } });
    expect(mocks.clearTranslationCache).not.toHaveBeenCalled();
    expect(mocks.clearAllAiResultCaches).not.toHaveBeenCalled();
    expect(mocks.resetAiRequestState).not.toHaveBeenCalled();
    expect(mocks.clearGroupKeyCache).not.toHaveBeenCalled();
    expect(mocks.configureAccountContext).toHaveBeenCalledTimes(1); // initial account only
  });

  it('cancels work before exposing the new account to store subscribers', () => {
    let sawNewAccount = false;
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state.user?.id !== 'account-b') return;
      sawNewAccount = true;
      expect(mocks.clearTranslationCache).toHaveBeenCalledTimes(1);
      expect(mocks.resetAiRequestState).toHaveBeenCalledTimes(1);
      expect(mocks.configureAccountContext).toHaveBeenLastCalledWith('account-b');
    });
    mocks.authChange('SIGNED_IN', { user: { id: 'account-b' } });
    unsubscribe();
    expect(sawNewAccount).toBe(true);
  });

  it('invalidates keys before waiting for sign-out and preserves pending wrapped backups', async () => {
    let releaseUser;
    mocks.getUser.mockImplementationOnce(() => new Promise((resolve) => { releaseUser = resolve; }));
    const pending = useAuthStore.getState().signOut();
    expect(mocks.configureAccountContext).toHaveBeenLastCalledWith(null);
    expect(mocks.clearGroupKeyCache).toHaveBeenCalled();
    releaseUser({ data: { user: { id: 'account-a' } } });
    await pending;
    expect(mocks.clearLocalData).toHaveBeenCalledWith('account-a', { preserveRecovery: true });
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('does not sign out an incoming account after an old sign-out lookup completes', async () => {
    let releaseUser;
    mocks.getUser.mockImplementationOnce(() => new Promise((resolve) => { releaseUser = resolve; }));
    const pending = useAuthStore.getState().signOut();
    mocks.authChange('SIGNED_IN', { user: { id: 'account-b' } });
    mocks.isLifecycleCurrent.mockReturnValue(false);
    releaseUser({ data: { user: { id: 'account-a' } } });
    expect(await pending).toBe(false);
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.clearLocalData).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user.id).toBe('account-b');
  });
});
