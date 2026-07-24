// @vitest-environment jsdom
//
// The auth page must be fully localized (no hard-coded French), default to LOG IN,
// preserve the language chosen earlier, and expose forgot-password / resend /
// back-to-home with friendly, specific validation.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';

// Supabase builds realtime at construct time; stub it so the stores import cleanly.
vi.mock('../lib/supabase', () => {
  const chain = {
    upsert: () => Promise.resolve({ data: null, error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return {
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
        getUser: async () => ({ data: { user: null } }),
      },
      from: () => chain,
    },
  };
});

import AuthPage from './AuthPage';
import useAuthStore from '../store/authStore';
import usePrayerStore from '../store/prayerStore';
import { t, loadLocale } from '../i18n';

afterEach(cleanup);

beforeEach(() => {
  usePrayerStore.setState({ settings: { language: 'fr' } });
  useAuthStore.setState({
    signInWithEmail: vi.fn(async () => ({ error: null })),
    signUpWithEmail: vi.fn(async () => ({ error: null })),
    signInWithGoogle: vi.fn(async () => ({ error: null })),
    resetPassword: vi.fn(async () => ({ error: null })),
    resendConfirmation: vi.fn(async () => ({ error: null })),
  });
});

// Submit the visible auth form directly — the tab and the submit button can share
// a label ("Log in"), so target the <form> instead of a button by name.
const submitForm = (container) => fireEvent.submit(container.querySelector('form'));

describe('AuthPage', () => {
  it('renders in the selected language (English), with no leftover French', async () => {
    await loadLocale('en');
    usePrayerStore.setState({ settings: { language: 'en' } });
    render(<AuthPage onBack={() => {}} />);
    expect(screen.getAllByText('Log in').length).toBeGreaterThan(0);
    expect(screen.getByText('Continue with Google')).toBeTruthy();
    expect(screen.getByText('Forgot password?')).toBeTruthy();
    // The old hard-coded French must be gone.
    expect(screen.queryByText('Se connecter')).toBeNull();
    expect(screen.queryByText('Continuer avec Google')).toBeNull();
  });

  it('defaults to login and exposes Google, forgot-password and back-to-home', () => {
    const onBack = vi.fn();
    const { container } = render(<AuthPage onBack={onBack} />);
    expect(screen.getByText(t('fr', 'authForgotPassword'))).toBeTruthy();
    expect(screen.getByText(t('fr', 'authContinueGoogle'))).toBeTruthy();
    expect(container.querySelector('.constellation-auth__sky-image--light')).toBeTruthy();
    expect(container.querySelector('.constellation-auth__sky-image--dark')).toBeTruthy();
    expect(container.querySelector('img[src="/logo-constellation.svg"]')).toBeTruthy();
    expect(container.querySelector('img[src="/assets/google-g.png"]')).toBeTruthy();
    fireEvent.click(screen.getByLabelText(t('fr', 'authBackHome')));
    expect(onBack).toHaveBeenCalled();
  });

  it('presents registration as a secondary option (name field + create account)', () => {
    const { container } = render(<AuthPage />);
    const switcher = container.querySelector('.auth-mode-switch');
    const login = within(switcher).getByRole('button', { name: t('fr', 'authLogIn') });
    const signUp = within(switcher).getByRole('button', { name: t('fr', 'authSignUp') });
    expect(login.getAttribute('aria-pressed')).toBe('true');
    expect(signUp.getAttribute('aria-pressed')).toBe('false');
    expect(login.closest('.auth-mode-switch')).toBeTruthy();

    fireEvent.click(signUp);

    expect(login.getAttribute('aria-pressed')).toBe('false');
    expect(signUp.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByPlaceholderText(t('fr', 'authNamePlaceholder'))).toBeTruthy();
    expect(screen.getByRole('button', { name: t('fr', 'authCreateAccount') })).toBeTruthy();
    // Forgot-password belongs to the login view only.
    expect(screen.queryByText(t('fr', 'authForgotPassword'))).toBeNull();
  });

  it('opens the reset view and sends a reset link', async () => {
    const { container } = render(<AuthPage />);
    fireEvent.click(screen.getByText(t('fr', 'authForgotPassword')));
    expect(screen.getByText(t('fr', 'authResetTitle'))).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText(t('fr', 'authEmail')), { target: { value: 'a@b.com' } });
    submitForm(container);
    await waitFor(() => expect(useAuthStore.getState().resetPassword).toHaveBeenCalledWith('a@b.com'));
    await screen.findByText(t('fr', 'authResetSent'));
  });

  it('shows a friendly, specific email error and does not hit the network', () => {
    const { container } = render(<AuthPage />);
    fireEvent.change(screen.getByPlaceholderText(t('fr', 'authEmail')), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByPlaceholderText(t('fr', 'authPassword')), { target: { value: 'secret1' } });
    submitForm(container);
    expect(screen.getByText(t('fr', 'authErrEmail'))).toBeTruthy();
    expect(useAuthStore.getState().signInWithEmail).not.toHaveBeenCalled();
  });

  // Pray-first: the contextual auth that follows a guest prayer the visitor chose
  // to keep. Registration leads (they have no account yet), the copy is warm and
  // specific, and "I already have an account" stays one tap away.
  it('save-prayer intent leads with registration and warm, specific copy', () => {
    render(<AuthPage intent="save-prayer" onBack={() => {}} />);
    expect(screen.getByText(t('fr', 'authSavePrayerTitle'))).toBeTruthy();
    expect(screen.getByText(t('fr', 'authSavePrayerBody'))).toBeTruthy();
    // Registration is the default view: the name field shows and the CTA is the
    // save-specific "Continue to save privately", not a generic signup label.
    expect(screen.getByPlaceholderText(t('fr', 'authNamePlaceholder'))).toBeTruthy();
    expect(screen.getByRole('button', { name: t('fr', 'authSavePrayerCta') })).toBeTruthy();
    expect(screen.queryByRole('button', { name: t('fr', 'authCreateAccount') })).toBeNull();
    // The login tab remains available for existing users.
    expect(screen.getByRole('button', { name: t('fr', 'authLogIn') })).toBeTruthy();
  });

  it('without the save-prayer intent it still defaults to log in (no contextual copy)', () => {
    render(<AuthPage onBack={() => {}} />);
    expect(screen.queryByText(t('fr', 'authSavePrayerTitle'))).toBeNull();
    expect(screen.queryByPlaceholderText(t('fr', 'authNamePlaceholder'))).toBeNull();
  });

  it('offers to resend the confirmation email after a successful sign-up', async () => {
    const { container } = render(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: t('fr', 'authSignUp') }));
    fireEvent.change(screen.getByPlaceholderText(t('fr', 'authEmail')), { target: { value: 'new@user.com' } });
    fireEvent.change(screen.getByPlaceholderText(t('fr', 'authPassword')), { target: { value: 'secret1' } });
    submitForm(container);
    await screen.findByText(t('fr', 'authConfirmSent'));
    const resend = screen.getByText(t('fr', 'authResend'));
    fireEvent.click(resend);
    await waitFor(() => expect(useAuthStore.getState().resendConfirmation).toHaveBeenCalledWith('new@user.com'));
  });
});
