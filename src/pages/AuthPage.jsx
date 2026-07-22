import { useState } from 'react';
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
    return { key: 'authErrUnconfirmed', canResend: true };
  }
  if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
    return { key: 'authErrInvalid' };
  }
  if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('already been registered')) {
    return { key: 'authErrInUse' };
  }
  if (msg.includes('password') && (msg.includes('6 characters') || msg.includes('at least') || msg.includes('weak') || msg.includes('should be'))) {
    return { key: 'authErrWeakPass' };
  }
  if (msg.includes('unable to validate email') || msg.includes('invalid format') || msg.includes('invalid email')) {
    return { key: 'authErrEmail' };
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
  const [success, setSuccess] = useState(null);    // localized string
  const [canResend, setCanResend] = useState(false);

  const lang = usePrayerStore((s) => s.settings.language) || 'en';
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword, resendConfirmation } = useAuthStore();

  const patch = (updates) => setForm((f) => ({ ...f, ...updates }));

  const resetFeedback = () => { setError(null); setSuccess(null); setCanResend(false); };
  const switchMode = (m) => { setMode(m); resetFeedback(); };

  const showError = (error) => {
    const { key, canResend: resend } = friendlyAuthError(error);
    setError(t(lang, key));
    if (resend) setCanResend(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetFeedback();
    const email = form.email.trim();

    // Friendly, specific client-side validation before we hit the network.
    if (!email || !EMAIL_RE.test(email)) { setError(t(lang, 'authErrEmail')); return; }
    if (!form.password) { setError(t(lang, 'authErrInvalid')); return; }
    if (mode === 'register' && form.password.length < 6) { setError(t(lang, 'authErrWeakPass')); return; }

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
    if (!email || !EMAIL_RE.test(email)) { setError(t(lang, 'authErrEmail')); return; }
    setLoading(true);
    const { error } = await resetPassword(email);
    // Don't reveal whether the address has an account — always confirm generically.
    if (error && error.status === 429) showError(error);
    else setSuccess(t(lang, 'authResetSent'));
    setLoading(false);
  };

  const handleResend = async () => {
    const email = form.email.trim();
    if (!email || !EMAIL_RE.test(email)) { setError(t(lang, 'authErrEmail')); return; }
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
    <div
      className="min-h-screen flex items-end md:items-center justify-center p-0 md:p-8"
      style={{ background: 'var(--bg)' }}
    >
      {/* Background image */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=50')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.07,
        }}
      />

      {/* Back to landing page */}
      {onBack && (
        <button
          onClick={onBack}
          aria-label={t(lang, 'authBackHome')}
          className="fixed top-4 left-4 z-10 flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-2)' }}
        >
          <ArrowLeft size={16} /> <span className="hidden sm:inline">{t(lang, 'authBackHome')}</span>
        </button>
      )}

      {/* Logo */}
      <div className="fixed top-0 left-0 right-0 flex flex-col items-center pt-16 pb-6 pointer-events-none">
        <img src="/logo.svg" alt="Pray4Me" className="w-16 h-16 mb-3 rounded-2xl" />
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>Pray4Me</h1>
        <p className="text-xs mt-1 italic" style={{ color: 'var(--text-3)' }}>{t(lang, 'authTagline')}</p>
      </div>

      {/* Bottom sheet */}
      <div
        className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl px-6 pt-6 pb-8 md:shadow-2xl"
        style={{ background: 'var(--surface)' }}
      >
        {mode === 'forgot' ? (
          <form onSubmit={handleForgot} noValidate className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'authResetTitle')}</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'authResetIntro')}</p>
            </div>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
              <input
                type="email"
                autoFocus
                aria-label={t(lang, 'authEmail')}
                value={form.email}
                onChange={(e) => patch({ email: e.target.value })}
                placeholder={t(lang, 'authEmail')}
                className="w-full rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            {error && <p role="alert" className="text-xs rounded-lg px-3 py-2" style={{ color: '#c04040', background: '#fdf0f0' }}>{error}</p>}
            {success && <p role="status" className="text-xs rounded-lg px-3 py-2" style={{ color: '#2a7a4e', background: '#e8f5ed' }}>{success}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)' }}
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
            <div className="flex rounded-xl p-1 mb-5" style={{ background: 'var(--input-bg)' }}>
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  aria-pressed={mode === m}
                  className="flex-1 text-sm py-2 rounded-lg font-medium transition-colors"
                  style={mode === m
                    ? { background: 'var(--surface)', color: 'var(--accent)', boxShadow: '0 1px 4px rgba(124,92,252,0.12)' }
                    : { color: 'var(--text-3)' }}
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
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              {t(lang, 'authContinueGoogle')}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'authOr')}</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              {mode === 'register' && (
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                  <input
                    type="text"
                    aria-label={t(lang, 'authNamePlaceholder')}
                    value={form.fullName}
                    onChange={(e) => patch({ fullName: e.target.value })}
                    placeholder={t(lang, 'authNamePlaceholder')}
                    className="w-full rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
              )}

              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                <input
                  type="email"
                  aria-label={t(lang, 'authEmail')}
                  value={form.email}
                  onChange={(e) => patch({ email: e.target.value })}
                  placeholder={t(lang, 'authEmail')}
                  className="w-full rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>

              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  aria-label={t(lang, 'authPassword')}
                  value={form.password}
                  onChange={(e) => patch({ password: e.target.value })}
                  placeholder={t(lang, 'authPassword')}
                  className="w-full rounded-xl pl-9 pr-10 py-3 text-sm focus:outline-none"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={t(lang, 'authPassword')}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-3)' }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
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

              {error && <p role="alert" className="text-xs rounded-lg px-3 py-2" style={{ color: '#c04040', background: '#fdf0f0' }}>{error}</p>}
              {success && <p role="status" className="text-xs rounded-lg px-3 py-2" style={{ color: '#2a7a4e', background: '#e8f5ed' }}>{success}</p>}

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
                className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)' }}
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
