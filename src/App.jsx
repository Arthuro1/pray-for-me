import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Layout from './components/Layout';
import PrayerForm from './components/PrayerForm';
import Toaster from './components/Toaster';
import OfflineBanner from './components/OfflineBanner';
import Onboarding from './components/Onboarding';
import { toast } from './store/toastStore';
import useAuthStore from './store/authStore';

// Route components are code-split so each page loads as its own chunk.
const HomeTab = lazy(() => import('./pages/HomeTab'));
const PrayersTab = lazy(() => import('./pages/PrayersTab'));
const AnsweredTab = lazy(() => import('./pages/AnsweredTab'));
const PlanTab = lazy(() => import('./pages/PlanTab'));
const SettingsTab = lazy(() => import('./pages/SettingsTab'));
const CommunityTab = lazy(() => import('./pages/CommunityTab'));
const PrayerDetail = lazy(() => import('./pages/PrayerDetail'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
import usePrayerStore from './store/prayerStore';
import useTranslationStore from './store/translationStore';
import useCommunityStore from './store/communityStore';
import { scheduleNotifications } from './notifications';
import { t, loadLocale, isLocaleLoaded } from './i18n';
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
  const { settings } = usePrayerStore();
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

// Personal prayer detail at /prayers/:id — resolves the prayer from the store.
function PersonalPrayerPage({ onEdit }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { prayers, settings } = usePrayerStore();
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
  const { settings, prayers, categories, loadData } = usePrayerStore();
  const { loadTranslations, translateContent } = useTranslationStore();
  const { fetchPendingCount, subscribePending } = useCommunityStore();

  const lang = settings.language || 'fr';
  const [localeReady, setLocaleReady] = useState(isLocaleLoaded(lang));

  const openAdd = () => { setEditPrayer(null); setShowForm(true); };
  const openEdit = (p) => { setEditPrayer(p); setShowForm(true); };

  // Load the active language's strings (French is always bundled as fallback).
  useEffect(() => {
    if (isLocaleLoaded(lang)) { setLocaleReady(true); return; }
    setLocaleReady(false);
    loadLocale(lang).then(() => setLocaleReady(true));
  }, [lang]);

  useEffect(() => {
    init();
    const saved = localStorage.getItem('pfm_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadData(user.id);
      loadTranslations(user.id);
      fetchPendingCount(user.id);
      if (!localStorage.getItem('pfm_onboarded')) setShowOnboarding(true);
    }
  }, [user?.id]);

  const finishOnboarding = () => {
    localStorage.setItem('pfm_onboarded', '1');
    setShowOnboarding(false);
  };

  // Keep the community nav badge live (incoming friend requests / invitations).
  useEffect(() => {
    if (!user?.id) return;
    return subscribePending(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (user) scheduleNotifications(settings, prayers, categories);
  }, [settings, prayers, categories]);

  // Translate content whenever language, prayers, or categories change
  useEffect(() => {
    if (user?.id && (prayers.length > 0 || categories.length > 0)) {
      translateContent(prayers, categories, settings.language, user.id);
    }
  }, [settings.language, prayers, categories, user?.id]);

  if (authLoading || !localeReady) {
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

  return (
    <>
      <Layout onAddPrayer={openAdd}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomeTab onAdd={openAdd} />} />
            <Route path="/prayers" element={<PrayersTab />} />
            <Route path="/prayers/:id" element={<PersonalPrayerPage onEdit={openEdit} />} />
            <Route path="/answered" element={<AnsweredTab />} />
            <Route path="/community" element={<CommunityTab />} />
            <Route path="/community/join/:code" element={<JoinGroupPage />} />
            <Route path="/community/group/:groupId" element={<CommunityTab />} />
            <Route path="/community/group/:groupId/prayer/:prayerId" element={<CommunityTab />} />
            <Route path="/plan" element={<PlanTab />} />
            <Route path="/settings" element={<SettingsTab />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
      {showForm && (
        <PrayerForm onClose={() => { setShowForm(false); setEditPrayer(null); }} editPrayer={editPrayer} />
      )}
      {showOnboarding && (
        <Onboarding lang={lang} onFinish={finishOnboarding} onAddPrayer={openAdd} />
      )}
      <OfflineBanner />
      <Toaster />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
