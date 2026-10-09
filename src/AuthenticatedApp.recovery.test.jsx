// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const state = vi.hoisted(() => ({
  auth: { user: null, loading: false, init: vi.fn(), signOut: vi.fn() },
  vault: { initialized: false, unlocked: true, refresh: vi.fn() },
  prayer: { settings: { language: 'en' }, prayers: [], categories: [], loadData: vi.fn() },
  pull: vi.fn(), ensure: vi.fn(), remember: vi.fn(), configure: vi.fn(),
  noop: vi.fn(), subscribe: vi.fn(() => () => {}),
}));

vi.mock('./store/authStore', () => ({ default: Object.assign(
  (selector) => selector ? selector(state.auth) : state.auth,
  { getState: () => state.auth },
) }));
vi.mock('./store/vaultStore', () => ({ default: Object.assign(
  (selector) => selector ? selector(state.vault) : state.vault,
  { getState: () => state.vault },
) }));
vi.mock('./store/prayerStore', () => ({ default: Object.assign(
  (selector) => selector ? selector(state.prayer) : state.prayer,
  { getState: () => state.prayer },
) }));
vi.mock('./store/translationStore', () => ({ default: () => ({ loadTranslations: state.noop, translateContent: state.noop }) }));
vi.mock('./store/communityStore', () => ({ default: (selector) => selector({ fetchPendingCount: state.noop, subscribePending: state.subscribe }) }));
vi.mock('./store/notificationStore', () => ({ default: (selector) => selector({ fetchNotifications: state.noop, subscribeNotifications: state.subscribe, reset: state.noop }) }));
vi.mock('./store/toastStore', () => ({ toast: { success: state.noop, error: state.noop } }));
vi.mock('./lib/vaultSync', () => ({ pullVaultRecord: state.pull }));
vi.mock('./lib/crypto/accountKey', () => ({
  ensureAccountCryptoReady: state.ensure, rememberAccountKey: state.remember,
  CRYPTO_STATUS: { READY: 'ready', LOCKED: 'locked', ORPHANED: 'orphaned', UNAVAILABLE: 'unavailable' },
}));
vi.mock('./lib/crypto/keyManager', () => ({ configureAccountContext: state.configure }));
vi.mock('./lib/aiConsent', () => ({ hasAiConsent: () => false }));
vi.mock('./lib/contentLang', () => ({ getContentLang: () => 'en', ensureContentLang: state.noop }));
vi.mock('./lib/mutationQueue', () => ({ initQueue: state.noop, onMutationDropped: state.noop }));
vi.mock('./lib/mutationExecutors', () => ({}));
vi.mock('./lib/prayerNotes', () => ({ initPrayerNotes: state.noop }));
vi.mock('./lib/pwaInstall', () => ({ resolvePwaShortcut: () => null }));
vi.mock('./lib/pendingInvite', () => ({ isInvitePath: () => false, savePendingInvite: state.noop, takePendingInvite: () => null }));
vi.mock('./lib/guestPrayerDraft', () => ({ hasPendingGuestDraftSync: () => false, clearGuestDraft: state.noop }));
vi.mock('./lib/planShareLink', () => ({ hasPendingPlanJoin: () => false, isPlanSharePath: () => false }));
vi.mock('./lib/guestPrayerImport', () => ({ importGuestPrayerOnce: state.noop }));
vi.mock('./utils/theme', () => ({ applyTheme: state.noop, normalizeTheme: () => 'light' }));
vi.mock('./i18n', () => ({ t: (_lang, key) => key, loadLocale: async () => {}, isLocaleLoaded: () => true, dirFor: () => 'ltr' }));

vi.mock('./components/shared/Brand', () => ({ BrandLoader: () => <div data-testid="crypto-loader">Checking account</div> }));
vi.mock('./components/VaultLockScreen', () => ({ default: () => <div data-testid="vault-lock">Unlock prayers</div> }));
vi.mock('./components/AccountKeyRecoveryScreen', () => ({ default: () => <div data-testid="account-recovery">Recover prayers</div> }));
vi.mock('./components/AccountKeyUnavailableScreen', () => ({ default: () => <div data-testid="crypto-unavailable">Retry recovery lookup</div> }));
vi.mock('./components/Layout', () => ({ default: ({ children }) => <main data-testid="private-shell">{children}</main> }));
vi.mock('./components/CommunityTermsGate', () => ({ default: ({ children }) => children }));
vi.mock('./components/shared/ContextualNudgeCoordinator', () => ({ ContextualNudgeProvider: ({ children }) => children }));
vi.mock('./components/ErrorBoundary', () => ({ default: ({ children }) => children }));
vi.mock('./pages/HomeTab', () => ({ default: () => <div>Private prayer history</div> }));
vi.mock('./pages/LandingPage', () => ({ default: () => <div data-testid="guest-landing">Guest landing</div> }));
vi.mock('./components/PrayerForm', () => ({ default: () => null }));
vi.mock('./components/shared/Toaster', () => ({ default: () => null }));
vi.mock('./components/shared/ConfirmHost', () => ({ default: () => null }));
vi.mock('./components/circles/CarryPlacementHost', () => ({ default: () => null }));
vi.mock('./components/shared/OfflineBanner', () => ({ default: () => null }));
vi.mock('./components/shared/SyncIndicator', () => ({ default: () => null }));
vi.mock('./components/Onboarding', () => ({ default: () => null }));
vi.mock('./components/FirstPrayerFlow', () => ({ default: () => null }));
vi.mock('./components/RecoveryPromptBanner', () => ({ default: () => null }));
vi.mock('./components/OriginMigrationBanner', () => ({ default: () => null }));

import AuthenticatedApp from './AuthenticatedApp';

function deferred() {
  let resolve;
  const promise = new Promise((complete) => { resolve = complete; });
  return { promise, resolve };
}

function app() { return <MemoryRouter><AuthenticatedApp /></MemoryRouter>; }

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('pfm_onboarded', '1');
  state.auth.user = { id: 'account-a' };
  state.auth.loading = false;
  state.vault.initialized = false;
  state.vault.unlocked = true;
  state.pull.mockResolvedValue('absent');
  state.ensure.mockResolvedValue('ready');
  state.remember.mockResolvedValue(true);
});
afterEach(cleanup);

describe('authenticated encryption readiness gates', () => {
  it('shows the unlock screen after an idle lock for a READY auto-key account without legacy recovery', async () => {
    const view = render(app());
    await screen.findByTestId('private-shell');
    await waitFor(() => expect(state.prayer.loadData).toHaveBeenCalledWith('account-a'));
    expect(state.vault.initialized).toBe(false);
    const loadsBeforeLock = state.prayer.loadData.mock.calls.length;

    state.vault.unlocked = false;
    view.rerender(app());

    expect(screen.getByTestId('vault-lock')).toBeTruthy();
    expect(screen.queryByTestId('private-shell')).toBeNull();
    expect(state.prayer.loadData).toHaveBeenCalledTimes(loadsBeforeLock);
  });

  it('keeps account B behind the loader until B readiness completes, even after account A was READY', async () => {
    const view = render(app());
    await screen.findByTestId('private-shell');
    await waitFor(() => expect(state.prayer.loadData).toHaveBeenCalledWith('account-a'));
    state.prayer.loadData.mockClear();
    state.remember.mockClear();
    const pendingB = deferred();
    state.ensure.mockImplementation((userId) => userId === 'account-b' ? pendingB.promise : Promise.resolve('ready'));

    state.auth.user = { id: 'account-b' };
    view.rerender(app());
    expect(screen.getByTestId('crypto-loader')).toBeTruthy();
    expect(screen.queryByTestId('private-shell')).toBeNull();
    await waitFor(() => expect(state.ensure).toHaveBeenCalledWith('account-b', 'absent'));
    expect(state.prayer.loadData).not.toHaveBeenCalled();
    expect(state.remember).not.toHaveBeenCalled();

    await act(async () => { pendingB.resolve('ready'); });
    await screen.findByTestId('private-shell');
    expect(state.prayer.loadData).toHaveBeenCalledWith('account-b');
    expect(state.remember).toHaveBeenCalledWith('account-b');
  });

  it('ignores a stale account A key-readiness completion after switching to account B', async () => {
    const pendingA = deferred();
    const pendingB = deferred();
    state.ensure.mockImplementation((userId) => userId === 'account-a' ? pendingA.promise : pendingB.promise);
    const view = render(app());
    await waitFor(() => expect(state.ensure).toHaveBeenCalledWith('account-a', 'absent'));

    state.auth.user = { id: 'account-b' };
    view.rerender(app());
    await waitFor(() => expect(state.ensure).toHaveBeenCalledWith('account-b', 'absent'));
    await act(async () => { pendingA.resolve('ready'); });
    expect(screen.getByTestId('crypto-loader')).toBeTruthy();
    expect(screen.queryByTestId('private-shell')).toBeNull();
    expect(state.vault.refresh).not.toHaveBeenCalled();
    expect(state.prayer.loadData).not.toHaveBeenCalled();

    state.vault.unlocked = false;
    await act(async () => { pendingB.resolve('locked'); });
    expect(await screen.findByTestId('vault-lock')).toBeTruthy();
    expect(state.vault.refresh).toHaveBeenCalledTimes(1);
    expect(state.prayer.loadData).not.toHaveBeenCalled();
  });

  it('never starts stale account A key readiness after its wrapper lookup completes on account B', async () => {
    const pendingPullA = deferred();
    const pendingPullB = deferred();
    state.pull.mockReset().mockReturnValueOnce(pendingPullA.promise).mockReturnValueOnce(pendingPullB.promise);
    const view = render(app());
    await waitFor(() => expect(state.pull).toHaveBeenCalledTimes(1));

    state.auth.user = { id: 'account-b' };
    view.rerender(app());
    await waitFor(() => expect(state.pull).toHaveBeenCalledTimes(2));
    await act(async () => { pendingPullA.resolve('absent'); });
    expect(state.ensure).not.toHaveBeenCalled();
    expect(screen.getByTestId('crypto-loader')).toBeTruthy();

    await act(async () => { pendingPullB.resolve('absent'); });
    await screen.findByTestId('private-shell');
    expect(state.ensure).toHaveBeenCalledTimes(1);
    expect(state.ensure).toHaveBeenCalledWith('account-b', 'absent');
  });
});
