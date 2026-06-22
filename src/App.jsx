import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import PrayerForm from './components/PrayerForm';
import HomeTab from './pages/HomeTab';
import PrayersTab from './pages/PrayersTab';
import PlanTab from './pages/PlanTab';
import SettingsTab from './pages/SettingsTab';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import useAuthStore from './store/authStore';
import usePrayerStore from './store/prayerStore';
import useTranslationStore from './store/translationStore';
import { scheduleNotifications } from './notifications';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [showForm, setShowForm] = useState(false);
  const [editPrayer, setEditPrayer] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  const { user, loading: authLoading, init } = useAuthStore();
  const { settings, prayers, categories, loadData, loading: dataLoading } = usePrayerStore();
  const { loadTranslations, translateContent } = useTranslationStore();

  useEffect(() => {
    init();
    const saved = localStorage.getItem('pfm_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadData(user.id);
      loadTranslations(user.id);
    }
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-indigo-700 flex items-center justify-center">
        <div className="text-center text-white">
          <img src="/logo.svg" alt="Pray For Me" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
          <Loader2 className="animate-spin mx-auto" size={24} />
        </div>
      </div>
    );
  }

  if (!user) {
    if (showAuth) return <AuthPage />;
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <img src="/logo.svg" alt="Pray For Me" className="w-14 h-14 rounded-2xl mx-auto mb-3" />
          <Loader2 className="animate-spin mx-auto text-indigo-600" size={22} />
          <p className="text-sm text-slate-400 mt-2">Chargement de vos prières...</p>
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (currentTab) {
      case 'home': return <HomeTab onEdit={(p) => { setEditPrayer(p); setShowForm(true); }} onAdd={() => { setEditPrayer(null); setShowForm(true); }} />;
      case 'prayers': return <PrayersTab onEdit={(p) => { setEditPrayer(p); setShowForm(true); }} />;
      case 'plan': return <PlanTab />;
      case 'settings': return <SettingsTab />;
      default: return <HomeTab />;
    }
  };

  return (
    <>
      <Layout currentTab={currentTab} onTabChange={setCurrentTab} onAddPrayer={() => { setEditPrayer(null); setShowForm(true); }}>
        {renderTab()}
      </Layout>
      {showForm && (
        <PrayerForm onClose={() => { setShowForm(false); setEditPrayer(null); }} editPrayer={editPrayer} />
      )}
    </>
  );
}
