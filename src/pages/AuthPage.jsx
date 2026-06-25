import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { youVersionEnabled, startYouVersionLogin } from '../lib/youversion';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    if (mode === 'login') {
      const { error } = await signInWithEmail(form.email, form.password);
      if (error) setError(error.message);
    } else {
      const { error } = await signUpWithEmail(form.email, form.password, form.fullName);
      if (error) setError(error.message);
      else setSuccess('Vérifiez votre email pour confirmer votre compte.');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div
      className="min-h-screen flex items-end md:items-center justify-center p-0 md:p-8"
      style={{
        background: 'var(--bg)',
      }}
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

      {/* Logo */}
      <div className="fixed top-0 left-0 right-0 flex flex-col items-center pt-16 pb-6 pointer-events-none">
        <img src="/logo.svg" alt="Pray4Me" className="w-16 h-16 mb-3 rounded-2xl" />
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-1)' }}>Pray4Me</h1>
        <p className="text-xs mt-1 italic" style={{ color: 'var(--text-3)' }}>
          "Priez sans cesse" — 1 Thess 5:17
        </p>
      </div>

      {/* Bottom sheet */}
      <div
        className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl px-6 pt-6 pb-8 md:shadow-2xl"
        style={{ background: 'var(--surface)' }}
      >
        {/* Tabs */}
        <div className="flex rounded-xl p-1 mb-5" style={{ background: 'var(--input-bg)' }}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null); }}
              className="flex-1 text-sm py-2 rounded-lg font-medium transition-colors"
              style={mode === m ? { background: '#fff', color: '#7c5cfc', boxShadow: '0 1px 4px rgba(124,92,252,0.12)' } : { color: '#b0a4c0' }}
            >
              {m === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium mb-4 transition-colors disabled:opacity-50"
          style={{ border: '0.5px solid var(--border)', color: 'var(--text-2)', background: 'var(--surface-2)' }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Continuer avec Google
        </button>

        {youVersionEnabled && (
          <button
            onClick={startYouVersionLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium mb-4 transition-colors disabled:opacity-50 text-white"
            style={{ background: '#ff3d4e' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21s-7.5-4.35-10-9.28C.42 8.4 1.84 5 5.2 5c1.97 0 3.4 1.1 4.3 2.4C10.4 6.1 11.83 5 13.8 5c3.36 0 4.78 3.4 3.2 6.72C19.5 16.65 12 21 12 21z" opacity=".25"/>
              <path d="M7 3h2.4v5.2H14V3h2.4v13.5c0 2.5-1.5 4.5-4.7 4.5-3.2 0-4.7-2-4.7-4.5V3z"/>
            </svg>
            Continuer avec YouVersion
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs" style={{ color: '#c5bdd4' }}>ou</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#c5bdd4' }} />
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Prénom et nom"
                className="w-full rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none"
                style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
              />
            </div>
          )}

          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#c5bdd4' }} />
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="w-full rounded-xl pl-9 pr-3 py-3 text-sm focus:outline-none"
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
            />
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#c5bdd4' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mot de passe"
              className="w-full rounded-xl pl-9 pr-10 py-3 text-sm focus:outline-none"
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: '#c5bdd4' }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {error && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ color: '#c04040', background: '#fdf0f0' }}>{error}</p>
          )}
          {success && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ color: '#2a7a4e', background: '#e8f5ed' }}>{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #a78bfa, #7c5cfc)' }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <p className="text-center text-xs mt-4" style={{ color: '#d4c8e4' }}>
          Vos prières sont privées et sécurisées 🔒
        </p>
      </div>
    </div>
  );
}
