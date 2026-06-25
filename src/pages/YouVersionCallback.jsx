import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { completeYouVersionLogin } from '../lib/youversion';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';

// Handles the redirect back from YouVersion: completes the token exchange + sign-in,
// then sends the user into the app. Rendered before the auth gate (no session yet).
export default function YouVersionCallback() {
  const navigate = useNavigate();
  const lang = usePrayerStore.getState().settings.language || 'en';
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    completeYouVersionLogin()
      .then(() => { if (!cancelled) navigate('/', { replace: true }); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <img src="/logo.svg" alt="Pray4Me" className="w-14 h-14 rounded-2xl mx-auto mb-4" />
        {error ? (
          <>
            <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>{t(lang, 'errorGeneric')}</p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="text-sm font-medium px-4 py-2.5 rounded-xl text-white"
              style={{ background: 'var(--accent)' }}
            >
              {t(lang, 'backToLogin')}
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2" style={{ color: 'var(--text-3)' }}>
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">{t(lang, 'signingIn')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
