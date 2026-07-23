import { lazy, Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  isLocaleLoaded,
  loadLocale,
  resolveLanguage,
} from './i18n';
import { shouldLoadAuthenticatedShell } from './lib/authSessionHint';
import { pwaShortcutAction } from './lib/pwaInstall';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const GuestPrayerFlow = lazy(() => import('./components/GuestPrayerFlow'));
const AuthenticatedApp = lazy(() => import('./AuthenticatedApp'));

function AppLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-indigo-700">
      <div className="text-center text-white">
        <img src="/logo.svg" alt="Pray4Me" className="mx-auto mb-4 h-16 w-16 rounded-2xl" />
        <Loader2 className="mx-auto animate-spin" size={24} aria-hidden="true" />
      </div>
    </div>
  );
}

function anonymousLanguage() {
  return resolveLanguage(
    localStorage.getItem('pfm_language'),
    navigator.language || navigator.userLanguage,
  );
}

// Lightweight bootstrap shell. A first-time visitor gets only the landing and
// selected marketing locale; Supabase, authenticated stores, E2EE account setup,
// community sync, and offline mutation replay load only after an auth/session
// signal or an explicit "Sign in / Save" action.
export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState(() => {
    if (shouldLoadAuthenticatedShell({
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    })) return 'authenticated';
    return pwaShortcutAction(location.search) ? 'guest-prayer' : 'landing';
  });
  const [authEntry, setAuthEntry] = useState({
    guestView: 'landing',
    authIntent: 'sign-in',
  });
  const [guestLang, setGuestLang] = useState(anonymousLanguage);
  const [guestLocaleReady, setGuestLocaleReady] = useState(() => isLocaleLoaded(anonymousLanguage()));

  useEffect(() => {
    if (mode !== 'guest-prayer') return undefined;
    if (isLocaleLoaded(guestLang)) {
      setGuestLocaleReady(true);
      return undefined;
    }
    let current = true;
    setGuestLocaleReady(false);
    loadLocale(guestLang).then(() => {
      if (current) setGuestLocaleReady(true);
    });
    return () => { current = false; };
  }, [mode, guestLang]);

  // Browser back/forward into an invite, reset link, or OAuth callback must cross
  // the same lazy boundary even if the shell first mounted on the public landing.
  useEffect(() => {
    if (
      mode !== 'authenticated'
      && shouldLoadAuthenticatedShell({
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      })
    ) {
      setMode('authenticated');
    }
  }, [location.pathname, location.search, location.hash, mode]);

  // A signed-out "Add prayer" manifest shortcut enters the private guest flow.
  // Consume it once so a later auth/import round-trip cannot replay the action.
  useEffect(() => {
    if (mode !== 'guest-prayer' || !pwaShortcutAction(location.search)) return;
    navigate('/', { replace: true });
  }, [mode, location.search, navigate]);

  const beginGuestPrayer = () => {
    const nextLang = anonymousLanguage();
    setGuestLang(nextLang);
    setGuestLocaleReady(isLocaleLoaded(nextLang));
    setMode('guest-prayer');
  };

  const openAuth = (intent) => {
    setAuthEntry({ guestView: 'auth', authIntent: intent });
    setMode('authenticated');
  };

  const finishGuestPrayer = async () => {
    const { clearGuestDraft } = await import('./lib/guestPrayerDraft');
    await clearGuestDraft();
    setMode('landing');
  };

  if (mode === 'authenticated') {
    return (
      <Suspense fallback={<AppLoader />}>
        <AuthenticatedApp
          initialGuestView={authEntry.guestView}
          initialAuthIntent={authEntry.authIntent}
        />
      </Suspense>
    );
  }

  if (mode === 'guest-prayer') {
    if (!guestLocaleReady) return <AppLoader />;
    return (
      <Suspense fallback={<AppLoader />}>
        <GuestPrayerFlow
          lang={guestLang}
          onRequestSave={() => openAuth('save-prayer')}
          onFinish={finishGuestPrayer}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<AppLoader />}>
      <LandingPage
        onBeginPrayer={beginGuestPrayer}
        onSignIn={() => openAuth('sign-in')}
      />
    </Suspense>
  );
}
