import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Layout from './components/Layout';
import PrayerForm from './components/PrayerForm';
import Toaster from './components/shared/Toaster';
import ConfirmHost from './components/shared/ConfirmHost';
import OfflineBanner from './components/shared/OfflineBanner';
import SyncIndicator from './components/shared/SyncIndicator';
import Onboarding from './components/Onboarding';
import FirstPrayerFlow from './components/FirstPrayerFlow';
import RecoveryPromptBanner from './components/RecoveryPromptBanner';
import ErrorBoundary from './components/ErrorBoundary';
import { toast } from './store/toastStore';
import useAuthStore from './store/authStore';

// Route components are code-split so each page loads as its own chunk.
const HomeTab = lazy(() => import('./pages/HomeTab'));
const PrayersTab = lazy(() => import('./pages/PrayersTab'));
const MoreTab = lazy(() => import('./pages/MoreTab'));
const PlanTab = lazy(() => import('./pages/PlanTab'));
const GrowTab = lazy(() => import('./pages/GrowTab'));
const SettingsTab = lazy(() => import('./pages/SettingsTab'));
const CommunityTab = lazy(() => import('./pages/CommunityTab'));
const PrayerDetail = lazy(() => import('./pages/PrayerDetail'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
import usePrayerStore from './store/prayerStore';
import useTranslationStore from './store/translationStore';
import useCommunityStore from './store/communityStore';
import useNotificationStore from './store/notificationStore';
import useVaultStore from './store/vaultStore';
import VaultLockScreen from './components/VaultLockScreen';
import AccountKeyRecoveryScreen from './components/AccountKeyRecoveryScreen';
import { pullVaultRecord } from './lib/vaultSync';
import { ensureAccountCryptoReady, rememberAccountKey, CRYPTO_STATUS } from './lib/crypto/accountKey';
import { hasAiConsent } from './lib/aiConsent';
import { getContentLang, ensureContentLang } from './lib/contentLang';
import { initQueue, onMutationDropped } from './lib/mutationQueue';
import { isInvitePath, savePendingInvite, takePendingInvite } from './lib/pendingInvite';
import { hasPendingGuestDraftSync, clearGuestDraft } from './lib/guestPrayerDraft';
import { importGuestPrayerOnce } from './lib/guestPrayerImport';
import './lib/mutationExecutors'; // self-registers queued-mutation executors
import { t, loadLocale, isLocaleLoaded, dirFor } from './i18n';
import { Loader2 } from 'lucide-react';

// Fallback shown while a lazily-loaded route chunk is fetched.
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24" style={{ background: 'var(--bg)' }}>
      <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent)' }} />
    </div>
  );
}

// Joins a group from a shared invite link (/community/join/:code), then routes
// into the group. Shows the loader while the join resolves.
function JoinGroupPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const settings = usePrayerStore((s) => s.settings);
  const joinGroup = useCommunityStore(s => s.joinGroup);
  const lang = settings.language || 'fr';

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const res = await joinGroup(code, user.id);
      if (cancelled) return;
      if (res.group) {
        toast.success(t(lang, 'joinedGroup'));
        navigate(`/community/group/${res.group.id}`, { replace: true });
      } else {
        toast.error(t(lang, res.error === 'alreadyMember' ? 'alreadyMember' : 'groupNotFound'));
        navigate('/community', { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, code]);

  return <PageLoader />;
}

// Sends a friend request from a shared friend link (/community/add-friend/:id),
// then routes into the community with feedback.
function AddFriendPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const settings = usePrayerStore((s) => s.settings);
  const sendFriendRequestToId = useCommunityStore(s => s.sendFriendRequestToId);
  const lang = settings.language || 'fr';

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const res = await sendFriendRequestToId(id, user.id);
      if (cancelled) return;
      const msgKey = !res.error ? 'requestSent'
        : res.error === 'alreadyFriends' ? 'alreadyFriends'
        : res.error === 'self' ? 'cannotAddSelf'
        : 'requestExists';
      (res.error ? toast.error : toast.success)(t(lang, msgKey));
      navigate('/community', { replace: true });
    })();
    return () => { cancelled = true; };
  }, [user?.id, id]);

  return <PageLoader />;
}

// Personal prayer detail at /prayers/:id — resolves the prayer from the store.
function PersonalPrayerPage({ onEdit }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { prayers, settings } = usePrayerStore(
    useShallow((s) => ({ prayers: s.prayers, settings: s.settings }))
  );
  const lang = settings.language || 'fr';
  const prayer = prayers.find((p) => p.id === id);
  if (!prayer) return <Navigate to="/prayers" replace />;
  return <PrayerDetail prayer={prayer} lang={lang} onBack={() => navigate(-1)} onEdit={onEdit} />;
}

export default function App() {
  const [showForm, setShowForm] = useState(false);
  const [editPrayer, setEditPrayer] = useState(null);
  const [formPrefill, setFormPrefill] = useState(null);
  const [formOptions, setFormOptions] = useState(null);
  // The unauthenticated experience: 'landing' → 'prayer' (pray-first guest flow) →
  // 'auth'. `authIntent` distinguishes a direct sign-in from the save-your-prayer
  // path so AuthPage can present the right (warm, contextual) copy.
  const [guestView, setGuestView] = useState('landing');
  const [authIntent, setAuthIntent] = useState('sign-in');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { user, loading: authLoading, init } = useAuthStore();
  const { settings, prayers, categories, loadData } = usePrayerStore(
    useShallow((s) => ({ settings: s.settings, prayers: s.prayers, categories: s.categories, loadData: s.loadData }))
  );
  const { loadTranslations, translateContent } = useTranslationStore();
  const fetchPendingCount = useCommunityStore((s) => s.fetchPendingCount);
  const subscribePending = useCommunityStore((s) => s.subscribePending);
  const { fetchNotifications, subscribeNotifications, resetNotifications } = useNotificationStore(
    useShallow((s) => ({ fetchNotifications: s.fetchNotifications, subscribeNotifications: s.subscribeNotifications, resetNotifications: s.reset }))
  );
  const { initialized: vaultInitialized, unlocked: vaultUnlocked } = useVaultStore();

  const lang = settings.language || 'fr';
  const location = useLocation();
  const navigate = useNavigate();
  const [localeReady, setLocaleReady] = useState(isLocaleLoaded(lang));
  const [vaultChecked, setVaultChecked] = useState(false);
  const [cryptoStatus, setCryptoStatus] = useState(null);

  const openAdd = () => {
    setEditPrayer(null);
    setFormPrefill(null);
    setFormOptions(null);
    setShowForm(true);
  };
  const openEdit = (p, options = null) => {
    setEditPrayer(p);
    setFormPrefill(null);
    setFormOptions(options);
    setShowForm(true);
  };
  // Open the existing prayer-creation flow seeded with an optional, fully-editable
  // prefill (used by the gospel journey's "Create a private prayer" next step).
  // Personal prayers are private by default, so no extra visibility handling is
  // needed — this just reuses the same form/store/validation.
  const openCreatePrayer = (prefill) => {
    setEditPrayer(null);
    setFormPrefill(prefill || null);
    setFormOptions(null);
    setShowForm(true);
  };

  // Load the active language's strings (French is always bundled as fallback).
  useEffect(() => {
    if (isLocaleLoaded(lang)) { setLocaleReady(true); return; }
    setLocaleReady(false);
    loadLocale(lang).then(() => setLocaleReady(true));
  }, [lang]);

  // Reflect the active language on <html> so screen readers pronounce content
  // correctly and Arabic/Persian render right-to-left instead of left-to-right.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirFor(lang);
  }, [lang]);

  useEffect(() => {
    init();
    const saved = localStorage.getItem('pfm_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    // Replay any writes queued offline. If a mutation fails permanently, tell
    // the user and reconcile local state back to server truth (rolls back the
    // optimistic change instead of leaving an un-saved "ghost").
    onMutationDropped((item, err) => {
      toast.error(err?.message ? `${item.kind}: ${err.message}` : t(lang, 'errorGeneric'));
      const uid = useAuthStore.getState().user?.id;
      if (uid) usePrayerStore.getState().loadData(uid);
    });
    initQueue();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadData(user.id);
      loadTranslations(user.id);
      fetchPendingCount(user.id);
      // Default the user's writing language to the current display language, so a
      // monolingual user is never billed to "translate" content into its own
      // language. Refreshed to the real authoring language on the next prayer.
      ensureContentLang(lang);
      // Don't show the standard first-run onboarding while a guest-prayer import
      // is pending — that visitor already prayed and is about to have their prayer
      // imported (see the import effect below). The sync marker avoids a flash.
      if (!localStorage.getItem('pfm_onboarded') && !hasPendingGuestDraftSync()) setShowOnboarding(true);
    }
  }, [user?.id]);

  // An anonymous visitor opening an invite link only ever sees the auth screen
  // (the router below is gated on `user`), so remember the intended path. After
  // sign-in — even a round-trip through email confirmation or OAuth — replay it
  // so the join they clicked actually completes.
  useEffect(() => {
    if (!user && isInvitePath(location.pathname)) savePendingInvite(location.pathname);
  }, [user, location.pathname]);

  useEffect(() => {
    if (!user?.id) return;
    const pending = takePendingInvite();
    if (pending) navigate(pending, { replace: true });
  }, [user?.id]);

  // Pull any (wrapped) recovery record synced from another device, then make the
  // account key ready: this auto-provisions encryption transparently on first
  // use, restores the device-local key on later boots, or leaves it locked when
  // a recovery-protected key exists elsewhere (new device → VaultLockScreen).
  // Gates the splash until the crypto state is known.
  useEffect(() => {
    if (!user?.id) { setVaultChecked(false); setCryptoStatus(null); return undefined; }
    let cancelled = false;
    (async () => {
      await pullVaultRecord();
      const status = await ensureAccountCryptoReady(user.id);
      if (cancelled) return;
      setCryptoStatus(status);
      useVaultStore.getState().refresh();
      setVaultChecked(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Re-decrypt by reloading once the key becomes available (the first load may
  // have run before auto-init/unlock, leaving encrypted rows as placeholders).
  // Also remember the key for transparent access on this device from now on.
  useEffect(() => {
    if (user?.id && vaultUnlocked) { rememberAccountKey(user.id); loadData(user.id); }
  }, [vaultUnlocked]);

  // Pray-first import: a visitor who prayed as a guest and chose "Save in my
  // private journal" authenticates, and here — once the account key is READY and
  // the vault is unlocked (never a plaintext write) — their one prayer is imported
  // through the normal encrypted path, exactly once. The draft is device-local
  // (IndexedDB), so it survives an OAuth / email-confirmation round-trip.
  useEffect(() => {
    if (!user?.id || !vaultChecked || !vaultUnlocked) return undefined;
    if (!hasPendingGuestDraftSync()) return undefined;
    let cancelled = false;
    (async () => {
      const res = await importGuestPrayerOnce();
      if (cancelled || !res?.imported) return;
      loadData(user.id);
      toast.success(t(lang, 'savedPrivately'));
    })();
    return () => { cancelled = true; };
  }, [user?.id, vaultChecked, vaultUnlocked]);

  const finishOnboarding = () => {
    localStorage.setItem('pfm_onboarded', '1');
    setShowOnboarding(false);
  };

  // Let the user replay the welcome intro on demand (e.g. from Settings). Decoupled
  // via a window event so Settings needn't reach into App's onboarding state.
  useEffect(() => {
    const replay = () => setShowOnboarding(true);
    window.addEventListener('pfm:replay-onboarding', replay);
    return () => window.removeEventListener('pfm:replay-onboarding', replay);
  }, []);

  // Keep the community nav badge live (incoming friend requests / invitations).
  useEffect(() => {
    if (!user?.id) return;
    return subscribePending(user.id);
  }, [user?.id]);

  // Notification inbox: load the latest + unread count and subscribe to live
  // inserts so the bell badge stays accurate. Reset first so one account's inbox
  // never leaks into another's on logout / account change.
  useEffect(() => {
    resetNotifications();
    if (!user?.id) return undefined;
    fetchNotifications(user.id);
    return subscribeNotifications(user.id);
  }, [user?.id]);

  // Translate personal content only when the user is actually reading in a
  // language other than the one they write in, and has opted into AI. This avoids
  // paying to "translate" content into the language it's already written in (the
  // common monolingual case), and never sends private prayer content — including
  // decrypted E2EE testimonies — to the AI translator without explicit consent.
  useEffect(() => {
    if (!user?.id) return;
    const target = settings.language;
    const contentLang = getContentLang() || target;
    if (target === contentLang) return;
    if (!hasAiConsent('prayer')) return;
    if (prayers.length > 0 || categories.length > 0) {
      translateContent(prayers, categories, target, user.id);
    }
  }, [settings.language, prayers, categories, user?.id]);

  if (authLoading || !localeReady || (user && !vaultChecked)) {
    return (
      <div className="min-h-screen bg-indigo-700 flex items-center justify-center">
        <div className="text-center text-white">
          <img src="/logo.svg" alt="Pray4Me" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
          <Loader2 className="animate-spin mx-auto" size={24} />
        </div>
      </div>
    );
  }

  if (!user) {
    // Pray-first guest flow. "Begin with a prayer" opens a real prayer moment
    // (no account, no server writes); only "Save in my private journal" leads to
    // authentication. Existing users keep a direct "Sign in" path, and invite
    // links still fall through the landing → auth → pending-invite flow unchanged.
    if (guestView === 'prayer') {
      return (
        <FirstPrayerFlow
          mode="guest"
          lang={lang}
          onRequestSave={() => { setAuthIntent('save-prayer'); setGuestView('auth'); }}
          onFinish={async () => { await clearGuestDraft(); setGuestView('landing'); }}
        />
      );
    }
    return (
      <Suspense fallback={<PageLoader />}>
        {guestView === 'auth'
          ? <AuthPage intent={authIntent} onBack={() => setGuestView(authIntent === 'save-prayer' ? 'prayer' : 'landing')} />
          : <LandingPage
              onBeginPrayer={() => setGuestView('prayer')}
              onSignIn={() => { setAuthIntent('sign-in'); setGuestView('auth'); }}
            />}
      </Suspense>
    );
  }

  // Hard gate: a vault exists but is locked → block the app until it's unlocked,
  // so encrypted content is never rendered (or re-cached) without the key.
  // Unlocking flips vaultUnlocked → the reload-on-unlock effect re-decrypts.
  if (vaultInitialized && !vaultUnlocked) {
    return <VaultLockScreen lang={lang} />;
  }

  // Hard gate: the server holds encrypted data but this device has no key and no
  // recovery record. We refused to silently mint a new key (which would orphan
  // that data); let the user recover on their original device or start fresh.
  if (cryptoStatus === CRYPTO_STATUS.ORPHANED) {
    // startFreshEncryption unlocks the key, which flips vaultUnlocked → the
    // reload-on-unlock effect re-decrypts; here we just drop the gate.
    return <AccountKeyRecoveryScreen lang={lang} onResolved={() => setCryptoStatus(CRYPTO_STATUS.READY)} />;
  }

  return (
    <>
      <Layout onAddPrayer={openAdd}>
        <RecoveryPromptBanner lang={lang} />
        <ErrorBoundary lang={lang} resetKey={location.pathname}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomeTab onAdd={openAdd} onEdit={openEdit} />} />
              <Route path="/prayers" element={<PrayersTab onAdd={openAdd} />} />
              <Route path="/prayers/:id" element={<PersonalPrayerPage onEdit={openEdit} />} />
              {/* The answered gallery is the Journal's second segment now; the
                  old standalone page redirects there so saved links keep working. */}
              <Route path="/answered" element={<Navigate to="/prayers" state={{ filter: 'answered' }} replace />} />
              <Route path="/more" element={<MoreTab />} />
              <Route path="/community" element={<CommunityTab />} />
              <Route path="/community/join/:code" element={<JoinGroupPage />} />
              <Route path="/community/add-friend/:id" element={<AddFriendPage />} />
              <Route path="/community/group/:groupId" element={<CommunityTab />} />
              <Route path="/community/group/:groupId/prayer/:prayerId" element={<CommunityTab />} />
              <Route path="/plan" element={<PlanTab />} />
              <Route path="/grow" element={<GrowTab onCreatePrayer={openCreatePrayer} />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsTab />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Layout>
      {showForm && (
        <PrayerForm
          onClose={() => {
            setShowForm(false);
            setEditPrayer(null);
            setFormPrefill(null);
            setFormOptions(null);
          }}
          editPrayer={editPrayer}
          prefill={formPrefill}
          initialOrganizeOpen={!!formOptions?.openOrganize}
        />
      )}
      {showOnboarding && (
        <Onboarding lang={lang} onFinish={finishOnboarding} />
      )}
      <OfflineBanner />
      <SyncIndicator />
      <Toaster />
      <ConfirmHost />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
