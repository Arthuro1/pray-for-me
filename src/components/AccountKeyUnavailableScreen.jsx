import { ShieldAlert } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { t } from '../i18n';

// Safe availability gate used when the app cannot verify whether encrypted
// server state already exists. Retrying is the only in-app recovery action: no
// key is generated or replaced while the answer is unknown.
export default function AccountKeyUnavailableScreen({ lang = 'fr', onRetry }) {
  const { user, signOut } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm flex flex-col items-center">
        <img src="/logo-constellation.svg" alt="Praystead" className="w-12 h-12 rounded-2xl mb-6" />

        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--accent-soft)' }}>
          <ShieldAlert size={24} style={{ color: 'var(--accent)' }} />
        </div>

        <h1 className="text-xl font-semibold text-center mb-2" style={{ color: 'var(--text-1)' }}>
          {t(lang, 'errorBoundaryTitle')}
        </h1>
        <p className="text-sm text-center leading-relaxed mb-6" style={{ color: 'var(--text-2)' }}>
          {t(lang, 'errorBoundaryBody')}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'var(--accent)' }}
        >
          {t(lang, 'retry')}
        </button>

        <div className="mt-6 text-center">
          {user?.email && (
            <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>
              {t(lang, 'vaultLockedSignedInAs', { email: user.email })}
            </p>
          )}
          <button type="button" onClick={signOut} className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
            {t(lang, 'signOut')}
          </button>
        </div>
      </div>
    </div>
  );
}
