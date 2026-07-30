import { useEffect, useRef, useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';

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

const inputStyle = { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' };

export default function AuthPage({ onBack, intent }) {
  // `intent === 'save-prayer'` is the contextual auth that follows the pray-first
  // guest flow: the visitor already prayed and chose to keep it, so registration
  // leads (with "I already have an account" always one tap away via the tabs) and
  // the copy is warm and specific about what they're doing — saving that prayer.
  const savePrayerIntent = intent === 'save-prayer';
  // 'login' is the default view; 'register' is the secondary option; 'forgot' is
  // the password-reset sub-view. The selected app language (carried over from the
  // landing page via the shared settings store) drives every string here.
  const [mode, setMode] = useState(savePrayerIntent ? 'register' : 'login');
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);       // localized string, already resolved
  const [errorField, setErrorField] = useState(null);
  const [success, setSuccess] = useState(null);    // localized string
  const [canResend, setCanResend] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const lang = usePrayerStore((s) => s.settings.language) || 'en';
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword, resendConfirmation } = useAuthStore();

  useEffect(() => {
    document.documentElement.classList.add('constellation-auth-root');
    return () => document.documentElement.classList.remove('constellation-auth-root');
  }, []);

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
  const switchMode = (m) => { setMode(m); resetFeedback(); };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetFeedback();
    const email = form.email.trim();

    // Friendly, specific client-side validation before we hit the network.
    if (!email || !EMAIL_RE.test(email)) { showFieldError('email', 'authErrEmail'); return; }
    if (!form.password) { showFieldError('password', 'authErrInvalid'); return; }
    if (mode === 'register' && form.password.length < 6) { showFieldError('password', 'authErrWeakPass'); return; }

    setLoading(true);
    if (mode === 'login') {
      const { error } = await signInWithEmail(email, form.password);
      if (error) showError(error);
    } else {
      const { error } = await signUpWithEmail(email, form.password, form.fullName.trim());
      if (error) showError(error);
      else { setSuccess(t(lang, 'authConfirmSent')); setCanResend(true); }
    }
    setLoading(false);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    resetFeedback();
    const email = form.email.trim();
    if (!email || !EMAIL_RE.test(email)) { showFieldError('email', 'authErrEmail'); return; }
    setLoading(true);
    const { error } = await resetPassword(email);
    // Don't reveal whether the address has an account — always confirm generically.
    if (error && error.status === 429) showError(error);
    else setSuccess(t(lang, 'authResetSent'));
    setLoading(false);
  };

  const handleResend = async () => {
    const email = form.email.trim();
    if (!email || !EMAIL_RE.test(email)) { showFieldError('email', 'authErrEmail'); return; }
    resetFeedback();
    setLoading(true);
    const { error } = await resendConfirmation(email);
    if (error) showError(error);
    else setSuccess(t(lang, 'authResendDone'));
    setLoading(false);
  };

  const handleGoogle = async () => {
    resetFeedback();
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) { showError(error); setLoading(false); }
  };

  return (
    <div className="auth-experience constellation-auth">
      <div className="constellation-auth__sky" aria-hidden="true">
        <img src="/assets/constellation/detail-sky-light-transparent.png" alt="" className="constellation-auth__sky-image constellation-auth__sky-image--light" />
        <img src="/assets/constellation/detail-sky-dark-transparent.png" alt="" className="constellation-auth__sky-image constellation-auth__sky-image--dark" />
      </div>

      {/* Back to landing page */}
      {onBack && (
        <button
          onClick={onBack}
          aria-label={t(lang, 'authBackHome')}
          className="phase-icon-button fixed top-4 z-10 flex items-center gap-1.5 text-sm font-medium px-3"
          style={{ insetInlineStart: '1rem', width: 'auto' }}
        >
          <ArrowLeft size={16} /> <span className="hidden sm:inline">{t(lang, 'authBackHome')}</span>
        </button>
      )}

      {/* Logo */}
      <div className="auth-brand">
        <img src="/logo-constellation.svg" alt="Pray4Me" className="w-12 h-12 mb-3 rounded-xl" />
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>Pray4Me</h1>
        <p className="text-xs mt-1 italic" style={{ color: 'var(--text-3)' }}>{t(lang, 'authTagline')}</p>
      </div>

      {/* Bottom sheet */}
      <div className="auth-sheet">
        {mode === 'forgot' ? (
          <form onSubmit={handleForgot} noValidate className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'authResetTitle')}</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'authResetIntro')}</p>
            </div>
            <div>
              <label htmlFor="auth-reset-email" className="auth-field-label">{t(lang, 'authEmail')}</label>
              <div className="relative">
                <Mail size={15} className="auth-field-icon" style={{ color: 'var(--text-3)' }} />
                <input
                  ref={emailRef}
                  id="auth-reset-email"
                  type="email"
                  autoFocus
                  value={form.email}
                  onChange={(e) => patchField('email', e.target.value)}
                  placeholder={t(lang, 'authEmail')}
                  aria-invalid={errorField === 'email'}
                  aria-describedby={errorField === 'email' ? 'auth-form-error' : undefined}
                  className="auth-field w-full rounded-xl text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
            {error && <p id="auth-form-error" role="alert" className="text-xs rounded-lg px-3 py-2" style={{ color: 'var(--danger)', background: 'var(--danger-bg)' }}>{error}</p>}
            {success && <p role="status" className="text-xs rounded-lg px-3 py-2" style={{ color: 'var(--success)', background: 'var(--success-bg)' }}>{success}</p>}
            <button
              type="submit"
              disabled={loading}
              className="auth-primary w-full rounded-xl px-5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {t(lang, 'authResetSend')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full text-center text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              {t(lang, 'authBackToLogin')}
            </button>
          </form>
        ) : (
          <>
            {/* Pray-first contextual header: warm, specific about saving the prayer
                the visitor just prayed. Purely additive — the tabs below still
                offer "I already have an account". */}
            {savePrayerIntent && (
              <div className="mb-5 text-center">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'authSavePrayerTitle')}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'authSavePrayerBody')}</p>
              </div>
            )}

            {/* Tabs — login first (default), register secondary */}
            <div
              className="auth-mode-switch mb-5"
              aria-label={`${t(lang, 'authLogIn')} / ${t(lang, 'authSignUp')}`}
            >
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  aria-pressed={mode === m}
                  className="auth-mode-switch__option"
                >
                  {m === 'login' ? t(lang, 'authLogIn') : t(lang, 'authSignUp')}
                </button>
              ))}
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium mb-4 transition-colors disabled:opacity-50"
              style={{ border: '0.5px solid var(--border)', color: 'var(--text-2)', background: 'var(--surface-2)' }}
            >
              <img src="/assets/google-g.png" alt="" className="h-[18px] w-[18px]" aria-hidden="true" />
              {t(lang, 'authContinueGoogle')}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'authOr')}</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label htmlFor="auth-name" className="auth-field-label">{t(lang, 'authNamePlaceholder')}</label>
                  <div className="relative">
                    <User size={15} className="auth-field-icon" style={{ color: 'var(--text-3)' }} />
                    <input
                      id="auth-name"
                      type="text"
                      value={form.fullName}
                      onChange={(e) => patchField('fullName', e.target.value)}
                      placeholder={t(lang, 'authNamePlaceholder')}
                      className="auth-field w-full rounded-xl text-sm focus:outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="auth-field-label">{t(lang, 'authEmail')}</label>
                <div className="relative">
                  <Mail size={15} className="auth-field-icon" style={{ color: 'var(--text-3)' }} />
                  <input
                    ref={emailRef}
                    id="auth-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => patchField('email', e.target.value)}
                    placeholder={t(lang, 'authEmail')}
                    aria-invalid={errorField === 'email'}
                    aria-describedby={errorField === 'email' ? 'auth-form-error' : undefined}
                    className="auth-field w-full rounded-xl text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-password" className="auth-field-label">{t(lang, 'authPassword')}</label>
                <div className="relative">
                  <Lock size={15} className="auth-field-icon" style={{ color: 'var(--text-3)' }} />
                  <input
                    ref={passwordRef}
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => patchField('password', e.target.value)}
                    placeholder={t(lang, 'authPassword')}
                    aria-invalid={errorField === 'password'}
                    aria-describedby={[
                      mode === 'register' ? 'auth-password-hint' : null,
                      errorField === 'password' ? 'auth-form-error' : null,
                    ].filter(Boolean).join(' ') || undefined}
                    className="auth-field w-full rounded-xl text-sm focus:outline-none"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={t(lang, 'authPassword')}
                    aria-pressed={showPassword}
                    className="auth-password-toggle"
                    style={{ color: 'var(--text-3)' }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {mode === 'register' && (
                  <p id="auth-password-hint" className="auth-field-hint">{t(lang, 'authErrWeakPass')}</p>
                )}
              </div>

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs font-medium"
                    style={{ color: 'var(--accent)' }}
                  >
                    {t(lang, 'authForgotPassword')}
                  </button>
                </div>
              )}

              {error && <p id="auth-form-error" role="alert" className="text-xs rounded-lg px-3 py-2" style={{ color: 'var(--danger)', background: 'var(--danger-bg)' }}>{error}</p>}
              {success && <p role="status" className="text-xs rounded-lg px-3 py-2" style={{ color: 'var(--success)', background: 'var(--success-bg)' }}>{success}</p>}

              {canResend && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="w-full text-center text-xs font-medium disabled:opacity-60"
                  style={{ color: 'var(--accent)' }}
                >
                  {t(lang, 'authResend')}
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="auth-primary w-full rounded-xl px-5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {mode === 'login'
                  ? t(lang, 'authLogIn')
                  : t(lang, savePrayerIntent ? 'authSavePrayerCta' : 'authCreateAccount')}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-3)' }}>
          {t(lang, 'authPrivacyNote')}
        </p>
      </div>
    </div>
  );
}
