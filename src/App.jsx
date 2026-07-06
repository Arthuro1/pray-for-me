import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Layout from './components/Layout';
import PrayerForm from './components/PrayerForm';
import Toaster from './components/Toaster';
import ConfirmHost from './components/ConfirmHost';
import OfflineBanner from './components/OfflineBanner';
import SyncIndicator from './components/SyncIndicator';
import Onboarding from './components/Onboarding';
import ErrorBoundary from './components/ErrorBoundary';
import { toast } from './store/toastStore';
import useAuthStore from './store/authStore';

// Route components are code-split so each page loads as its own chunk.
const HomeTab = lazy(() => import('./pages/HomeTab'));
const PrayersTab = lazy(() => import('./pages/PrayersTab'));
const AnsweredTab = lazy(() => import('./pages/AnsweredTab'));
const PlanTab = lazy(() => import('./pages/PlanTab'));
const GrowTab = lazy(() => import('./pages/GrowTab'));
const SettingsTab = lazy(() => import('./pages/SettingsTab'));
const CommunityTab = lazy(() => import('./pages/CommunityTab'));
const PrayerDetail = lazy(() => import('./pages/PrayerDetail'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
import usePrayerStore from './store/prayerStore';
import useTranslationStore from './store/translationStore';
import useCommunityStore from './store/communityStore';
import useVaultStore from './store/vaultStore';
import VaultLockScreen from './components/VaultLockScreen';
import { pullVaultRecord } from './lib/vaultSync';
import { hasAiConsent } from './lib/aiConsent';
import { getContentLang, ensureContentLang } from './lib/contentLang';
import { initQueue, onMutationDropped } from './lib/mutationQueue';
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
  const [showAuth, setShowAuth] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { user, loading: authLoading, init } = useAuthStore();
  const { settings, prayers, categories, loadData } = usePrayerStore(
    useShallow((s) => ({ settings: s.settings, prayers: s.prayers, categories: s.categories, loadData: s.loadData }))
  );
  const { loadTranslations, translateContent } = useTranslationStore();
  const fetchPendingCount = useCommunityStore((s) => s.fetchPendingCount);
  const subscribePending = useCommunityStore((s) => s.subscribePending);
  const { initialized: vaultInitialized, unlocked: vaultUnlocked } = useVaultStore();

  const lang = settings.language || 'fr';
  const location = useLocation();
  const [localeReady, setLocaleReady] = useState(isLocaleLoaded(lang));
  const [vaultChecked, setVaultChecked] = useState(false);

  const openAdd = () => { setEditPrayer(null); setShowForm(true); };
  const openEdit = (p) => { setEditPrayer(p); setShowForm(true); };

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
      if (!localStorage.getItem('pfm_onboarded')) setShowOnboarding(true);
    }
  }, [user?.id]);

  // Pull the (wrapped) vault record so the lock gate reflects vaults created on
  // another device. Gates the splash until we know whether a vault exists.
  useEffect(() => {
    if (!user?.id) { setVaultChecked(false); return undefined; }
    let cancelled = false;
    (async () => {
      await pullVaultRecord();
      if (cancelled) return;
      useVaultStore.getState().refresh();
      setVaultChecked(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Re-decrypt by reloading once the vault is unlocked (the first load may have
  // run while locked, leaving encrypted rows as locked placeholders).
  useEffect(() => {
    if (user?.id && vaultUnlocked) loadData(user.id);
  }, [vaultUnlocked]);

  const finishOnboarding = () => {
    localStorage.setItem('pfm_onboarded', '1');
    setShowOnboarding(false);
  };

  // Keep the community nav badge live (incoming friend requests / invitations).
  useEffect(() => {
    if (!user?.id) return;
    return subscribePending(user.id);
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
    return (
      <Suspense fallback={<PageLoader />}>
        {showAuth ? <AuthPage /> : <LandingPage onGetStarted={() => setShowAuth(true)} />}
      </Suspense>
    );
  }

  // Hard gate: a vault exists but is locked → block the app until it's unlocked,
  // so encrypted content is never rendered (or re-cached) without the key.
  // Unlocking flips vaultUnlocked → the reload-on-unlock effect re-decrypts.
  if (vaultInitialized && !vaultUnlocked) {
    return <VaultLockScreen lang={lang} />;
  }

  return (
    <>
      <Layout onAddPrayer={openAdd}>
        <ErrorBoundary lang={lang} resetKey={location.pathname}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomeTab onAdd={openAdd} />} />
              <Route path="/prayers" element={<PrayersTab onAdd={openAdd} />} />
              <Route path="/prayers/:id" element={<PersonalPrayerPage onEdit={openEdit} />} />
              <Route path="/answered" element={<AnsweredTab />} />
              <Route path="/community" element={<CommunityTab />} />
              <Route path="/community/join/:code" element={<JoinGroupPage />} />
              <Route path="/community/add-friend/:id" element={<AddFriendPage />} />
              <Route path="/community/group/:groupId" element={<CommunityTab />} />
              <Route path="/community/group/:groupId/prayer/:prayerId" element={<CommunityTab />} />
              <Route path="/plan" element={<PlanTab />} />
              <Route path="/grow" element={<GrowTab />} />
              <Route path="/settings" element={<SettingsTab />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Layout>
      {showForm && (
        <PrayerForm onClose={() => { setShowForm(false); setEditPrayer(null); }} editPrayer={editPrayer} />
      )}
      {showOnboarding && (
        <Onboarding lang={lang} onFinish={finishOnboarding} onAddPrayer={openAdd} />
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
