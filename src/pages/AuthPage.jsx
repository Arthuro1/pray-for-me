import { useEffect, useRef, useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';
import { APP_NAME } from '../lib/brand';

import { BrandMark, Wordmark } from '../components/shared/Brand';
import { Input, PrimaryButton, QuietButton, SecondaryButton, SegmentedControl } from '../components/shared/Primitives';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Map a raw Supabase auth error to a friendly, localized, actionable message.
// Falls back to a generic message so we never surface raw English internals.
// Returns { key, canResend } so the caller can also offer "resend confirmation".
function friendlyAuthError(error) {
  const msg = (error?.message || '').toLowerCase();
  const status = error?.status;
  if (status === 429 || msg.includes('rate limit') || msg.includes('for security purposes') || msg.includes('too many')) {
    return { key: 'authErrRate' };
  }
  if (msg.includes('not confirmed') || msg.includes('confirm your email') || msg.includes('email not confirmed')) {
    return { key: 'authErrUnconfirmed', canResend: true, field: 'email' };
  }
  if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
    return { key: 'authErrInvalid', field: 'password' };
  }
  if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('already been registered')) {
    return { key: 'authErrInUse', field: 'email' };
  }
  if (msg.includes('password') && (msg.includes('6 characters') || msg.includes('at least') || msg.includes('weak') || msg.includes('should be'))) {
    return { key: 'authErrWeakPass', field: 'password' };
  }
  if (msg.includes('unable to validate email') || msg.includes('invalid format') || msg.includes('invalid email')) {
    return { key: 'authErrEmail', field: 'email' };
  }
  return { key: 'errorGeneric' };
}

// A labelled field with a leading icon, and an optional control at its end.
function AuthField({ id, label, icon: Icon, inputRef, end = null, hint = null, ...input }) {
  return (
    <div className="q-field">
      <label htmlFor={id} className="q-field__label">{label}</label>
      <div className="q-input-wrap">
        <Icon size={16} className="q-input-wrap__icon" aria-hidden="true" />
        <Input ref={inputRef} id={id} className={end ? 'q-input--with-icon q-input--with-action' : 'q-input--with-icon'} {...input} />
        {end}
      </div>
      {hint && <p id={hint.id} className="q-field__hint">{hint.text}</p>}
    </div>
  );
}

export default function AuthPage({ onBack, intent }) {
  // `intent === 'save-prayer'` is the contextual auth that follows the pray-first
  // guest flow. The visitor is not here to register for an app — they are here to
  // keep the prayer they just prayed, and the screen says so: the heading is
  // about the prayer, the account is explained as what makes keeping it possible,
  // and the fastest ways through (Google, or a one-time email link) lead. No
  // password to invent, no display name to think up: a name is asked for later,
  // in a place where it means something. "I already have an account" stays one
  // tap away throughout.
  const savePrayerIntent = intent === 'save-prayer';
  // `join-plan` follows "Join this plan" on a shared plan link. Most people who
  // arrive that way are new, so it opens on Sign up and says what happens next:
  // the plan they chose begins as soon as they are in.
  const joinPlanIntent = intent === 'join-plan';
  // 'login' is the default view; 'register' is the secondary option; 'link' is the
  // passwordless email path (the save-a-prayer default); 'forgot' is the
  // password-reset sub-view. The selected app language (carried over from the
  // landing page via the shared settings store) drives every string here.
  const [mode, setMode] = useState(savePrayerIntent ? 'link' : joinPlanIntent ? 'register' : 'login');
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);       // localized string, already resolved
  const [errorField, setErrorField] = useState(null);
  const [success, setSuccess] = useState(null);    // localized string
  const [canResend, setCanResend] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const pendingRequest = useRef(false);
  const mounted = useRef(true);

  const lang = usePrayerStore((s) => s.settings.language) || 'en';
  const {
    signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithEmailLink,
    resetPassword, resendConfirmation,
  } = useAuthStore();

  useEffect(() => {
    mounted.current = true;
    document.documentElement.classList.add('auth-root');
    return () => {
      mounted.current = false;
      document.documentElement.classList.remove('auth-root');
    };
  }, []);

  useEffect(() => {
    if (!loading && errorField) {
      (errorField === 'password' ? passwordRef : emailRef).current?.focus();
    }
  }, [errorField, loading]);

  const patch = (updates) => setForm((f) => ({ ...f, ...updates }));
  const patchField = (field, value) => {
    patch({ [field]: value });
    if (errorField === field) {
      setError(null);
      setErrorField(null);
      setCanResend(false);
    }
  };

  const resetFeedback = () => {
    setError(null);
    setErrorField(null);
    setSuccess(null);
    setCanResend(false);
  };
  const switchMode = (m) => {
    if (pendingRequest.current) return;
    setMode(m);
    setShowPassword(false);
    resetFeedback();
  };

  const focusField = (field) => {
    const target = field === 'password' ? passwordRef : emailRef;
    target.current?.focus();
  };

  const showFieldError = (field, key) => {
    setError(t(lang, key));
    setErrorField(field);
    focusField(field);
  };

  const showError = (error) => {
    const { key, canResend: resend, field } = friendlyAuthError(error);
    setError(t(lang, key));
    setErrorField(field || null);
    if (field) focusField(field);
    if (resend) setCanResend(true);
  };

  // Every auth path releases the form after a transport failure. The ref also
  // prevents a second submit before React has rendered the disabled controls.
  const runAuthRequest = async (action, onResult) => {
    if (pendingRequest.current) return;
    pendingRequest.current = true;
    setLoading(true);
    try {
      const result = await action();
      if (mounted.current) onResult(result || {});
    } catch (caught) {
      if (mounted.current) showError(caught);
    } finally {
      pendingRequest.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pendingRequest.current) return;
    resetFeedback();
    const email = form.email.trim();

    // Friendly, specific client-side validation before we hit the network.
    if (!email || !EMAIL_RE.test(email)) { showFieldError('email', 'authErrEmail'); return; }
    if (!form.password) { showFieldError('password', 'authErrInvalid'); return; }
    if (mode === 'register' && form.password.length < 6) { showFieldError('password', 'authErrWeakPass'); return; }

    if (mode === 'login') {
      await runAuthRequest(() => signInWithEmail(email, form.password), ({ error }) => {
        if (error) showError(error);
      });
    } else {
      await runAuthRequest(() => signUpWithEmail(email, form.password, form.fullName.trim()), ({ error }) => {
        if (error) showError(error);
        else { setSuccess(t(lang, 'authConfirmSent')); setCanResend(true); }
      });
    }
  };

  // Passwordless: one email that both creates the account and signs in. The
  // prayer waits, encrypted, on this device until the link is followed back here.
  const handleEmailLink = async (e) => {
    e.preventDefault();
    if (pendingRequest.current) return;
    resetFeedback();
    const email = form.email.trim();
    if (!email || !EMAIL_RE.test(email)) { showFieldError('email', 'authErrEmail'); return; }
    await runAuthRequest(() => signInWithEmailLink(email), ({ error }) => {
      if (error) showError(error);
      else setSuccess(t(lang, 'authEmailLinkSent'));
    });
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (pendingRequest.current) return;
    resetFeedback();
    const email = form.email.trim();
    if (!email || !EMAIL_RE.test(email)) { showFieldError('email', 'authErrEmail'); return; }
    await runAuthRequest(() => resetPassword(email), ({ error }) => {
      // Supabase deliberately returns success for unknown accounts. Keep that
      // generic confirmation, but do not claim an email was sent on failure.
      if (error) showError(error);
      else setSuccess(t(lang, 'authResetSent'));
    });
  };

  const handleResend = async () => {
    if (pendingRequest.current) return;
    const email = form.email.trim();
    if (!email || !EMAIL_RE.test(email)) { showFieldError('email', 'authErrEmail'); return; }
    resetFeedback();
    await runAuthRequest(() => resendConfirmation(email), ({ error }) => {
      if (error) showError(error);
      else setSuccess(t(lang, 'authResendDone'));
    });
    if (mounted.current) setCanResend(true);
  };

  const handleGoogle = async () => {
    if (pendingRequest.current) return;
    resetFeedback();
    await runAuthRequest(() => signInWithGoogle(), ({ error }) => {
      if (error) showError(error);
    });
  };

  const formLabel = t(lang, {
    login: 'authLogIn',
    register: 'authSignUp',
    link: 'authKeepPrayerTitle',
    forgot: 'authResetTitle',
  }[mode]);

  const notices = (
    <>
      {error && <p id="auth-form-error" role="alert" className="q-notice q-notice--error">{error}</p>}
      {success && <p role="status" className="q-notice q-notice--success">{success}</p>}
    </>
  );

  const submitLabel = (label) => (
    <>
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      {label}
    </>
  );

  const emailField = (id, extra = {}) => (
    <AuthField
      id={id}
      label={t(lang, 'authEmail')}
      icon={Mail}
      inputRef={emailRef}
      type="email"
      autoComplete="email"
      inputMode="email"
      autoCapitalize="none"
      spellCheck={false}
      value={form.email}
      onChange={(e) => patchField('email', e.target.value)}
      placeholder={t(lang, 'authEmail')}
      aria-invalid={errorField === 'email'}
      aria-describedby={errorField === 'email' ? 'auth-form-error' : undefined}
      {...extra}
    />
  );

  return (
    <div className="auth-experience">
      {/* Back to landing page */}
      {onBack && (
        <QuietButton icon={ArrowLeft} iconSize={16} onClick={onBack} aria-label={t(lang, 'authBackHome')} className="auth-back">
          <span className="hidden sm:inline">{t(lang, 'authBackHome')}</span>
        </QuietButton>
      )}

      <header className="auth-brand">
        <div className="auth-brand__lockup">
          <BrandMark size={56} />
          <h1 className="m-0"><Wordmark height={32} title={APP_NAME} /></h1>
        </div>
        <p className="auth-brand__line">{t(lang, 'authTagline')}</p>
      </header>

      <fieldset className="auth-sheet" disabled={loading} aria-busy={loading} aria-label={formLabel}>
        {mode === 'forgot' ? (
          <form onSubmit={handleForgot} noValidate className="auth-form">
            <div>
              <h2 className="auth-sheet__title">{t(lang, 'authResetTitle')}</h2>
              <p className="auth-sheet__intro">{t(lang, 'authResetIntro')}</p>
            </div>
            {emailField('auth-reset-email', { autoFocus: true })}
            {notices}
            <PrimaryButton type="submit" disabled={loading} className="w-full">{submitLabel(t(lang, 'authResetSend'))}</PrimaryButton>
            <QuietButton onClick={() => switchMode('login')} className="w-full">{t(lang, 'authBackToLogin')}</QuietButton>
          </form>
        ) : (
          <>
            {/* Pray-first contextual header: the task is still "keep this prayer",
                and the account is explained as what makes that possible. */}
            {savePrayerIntent && (
              <div className="auth-intent">
                <h2 className="auth-sheet__title">{t(lang, 'authKeepPrayerTitle')}</h2>
                <p className="auth-sheet__intro">{t(lang, 'authKeepPrayerBody')}</p>
              </div>
            )}

            {joinPlanIntent && (
              <div className="auth-intent">
                <h2 className="auth-sheet__title">{t(lang, 'authJoinPlanTitle')}</h2>
                <p className="auth-sheet__intro">{t(lang, 'authJoinPlanBody')}</p>
              </div>
            )}

            {/* Tabs — login first (default), register secondary. Deliberately
                absent when the visitor is saving a prayer: a Log in / Sign up
                switch is the moment the screen stops being about their prayer
                and starts being about an app. That path is still one tap away,
                as a plain sentence under the form. */}
            {!savePrayerIntent && (
              <SegmentedControl
                className="auth-mode-switch segmented-control--fill"
                label={`${t(lang, 'authLogIn')} / ${t(lang, 'authSignUp')}`}
                value={mode === 'register' ? 'register' : 'login'}
                onChange={switchMode}
                options={[
                  { value: 'login', label: t(lang, 'authLogIn') },
                  { value: 'register', label: t(lang, 'authSignUp') },
                ]}
              />
            )}

            {/* Google */}
            <SecondaryButton onClick={handleGoogle} disabled={loading} className="auth-google">
              <img src="/assets/google-g.png" alt="" className="h-[18px] w-[18px]" aria-hidden="true" />
              {t(lang, 'authContinueGoogle')}
            </SecondaryButton>

            <p className="auth-or">{t(lang, 'authOr')}</p>

            {mode === 'link' ? (
              <form onSubmit={handleEmailLink} noValidate className="auth-form">
                {emailField('auth-link-email', { autoComplete: 'email' })}
                {notices}
                <PrimaryButton type="submit" disabled={loading} className="w-full">{submitLabel(t(lang, 'authEmailLinkCta'))}</PrimaryButton>
                {/* Both escape hatches, plainly worded — no tab bar needed. */}
                <QuietButton onClick={() => switchMode('register')} className="w-full">{t(lang, 'authUsePasswordInstead')}</QuietButton>
              </form>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="auth-form">
                {/* A display name is never needed to keep a prayer. It is asked for
                    later, where it means something (sharing with a group). */}
                {mode === 'register' && !savePrayerIntent && (
                  <AuthField
                    id="auth-name"
                    label={t(lang, 'authNamePlaceholder')}
                    icon={User}
                    type="text"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(e) => patchField('fullName', e.target.value)}
                    placeholder={t(lang, 'authNamePlaceholder')}
                  />
                )}

                {emailField('auth-email')}

                <AuthField
                  id="auth-password"
                  label={t(lang, 'authPassword')}
                  icon={Lock}
                  inputRef={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={form.password}
                  onChange={(e) => patchField('password', e.target.value)}
                  placeholder={t(lang, 'authPassword')}
                  aria-invalid={errorField === 'password'}
                  aria-describedby={[
                    mode === 'register' ? 'auth-password-hint' : null,
                    errorField === 'password' ? 'auth-form-error' : null,
                  ].filter(Boolean).join(' ') || undefined}
                  hint={mode === 'register' ? { id: 'auth-password-hint', text: t(lang, 'authErrWeakPass') } : null}
                  end={(
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={t(lang, 'authPassword')}
                      aria-pressed={showPassword}
                      className="icon-button q-input-wrap__action"
                    >
                      {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    </button>
                  )}
                />

                {mode === 'login' && (
                  <QuietButton onClick={() => switchMode('forgot')} className="auth-forgot">{t(lang, 'authForgotPassword')}</QuietButton>
                )}

                {notices}

                {canResend && (
                  <QuietButton onClick={handleResend} disabled={loading} className="w-full">{t(lang, 'authResend')}</QuietButton>
                )}

                <PrimaryButton type="submit" disabled={loading} className="w-full">
                  {submitLabel(mode === 'login'
                    ? t(lang, 'authLogIn')
                    : t(lang, savePrayerIntent ? 'authSavePrayerCta' : 'authCreateAccount'))}
                </PrimaryButton>

                {savePrayerIntent && (
                  <QuietButton onClick={() => switchMode('link')} className="w-full">{t(lang, 'authUseLinkInstead')}</QuietButton>
                )}
              </form>
            )}

            {/* Always one tap away, in every save-prayer sub-view — the prayer
                is waiting on this device either way. */}
            {savePrayerIntent && mode !== 'login' && (
              <QuietButton onClick={() => switchMode('login')} className="mt-3 w-full">{t(lang, 'authHaveAccount')}</QuietButton>
            )}
          </>
        )}

      </fieldset>
      <p className="auth-privacy"><Lock size={14} aria-hidden="true" />{t(lang, 'authPrivacyNote')}</p>
    </div>
  );
}
