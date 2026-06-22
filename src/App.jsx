import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import PrayerForm from './components/PrayerForm';
import HomeTab from './pages/HomeTab';
import PrayersTab from './pages/PrayersTab';
import PlanTab from './pages/PlanTab';
import SettingsTab from './pages/SettingsTab';
import AuthPage from './pages/AuthPage';
import useAuthStore from './store/authStore';
import usePrayerStore from './store/prayerStore';
import { scheduleNotifications } from './notifications';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [showForm, setShowForm] = useState(false);
  const [editPrayer, setEditPrayer] = useState(null);

  const { user, loading: authLoading, init } = useAuthStore();
  const { settings, prayers, categories, loadData, loading: dataLoading } = usePrayerStore();

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (user?.id) loadData(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (user) scheduleNotifications(settings, prayers, categories);
  }, [settings, prayers, categories]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-indigo-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-5xl mb-4">🙏</div>
          <Loader2 className="animate-spin mx-auto" size={24} />
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🙏</div>
          <Loader2 className="animate-spin mx-auto text-indigo-600" size={22} />
          <p className="text-sm text-slate-400 mt-2">Chargement de vos prières...</p>
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (currentTab) {
      case 'home': return <HomeTab onEdit={(p) => { setEditPrayer(p); setShowForm(true); }} />;
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
