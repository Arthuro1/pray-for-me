import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import PrayerForm from './components/PrayerForm';
import HomeTab from './pages/HomeTab';
import PrayersTab from './pages/PrayersTab';
import PlanTab from './pages/PlanTab';
import SettingsTab from './pages/SettingsTab';
import usePrayerStore from './store/prayerStore';
import { scheduleNotifications } from './notifications';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [showForm, setShowForm] = useState(false);
  const [editPrayer, setEditPrayer] = useState(null);

  const { settings, prayers, categories } = usePrayerStore();

  useEffect(() => {
    scheduleNotifications(settings, prayers, categories);
  }, [settings, prayers, categories]);

  const handleAddPrayer = () => {
    setEditPrayer(null);
    setShowForm(true);
  };

  const handleEditPrayer = (prayer) => {
    setEditPrayer(prayer);
    setShowForm(true);
  };

  const renderTab = () => {
    switch (currentTab) {
      case 'home': return <HomeTab onEdit={handleEditPrayer} />;
      case 'prayers': return <PrayersTab onEdit={handleEditPrayer} />;
      case 'plan': return <PlanTab />;
      case 'settings': return <SettingsTab />;
      default: return <HomeTab onEdit={handleEditPrayer} />;
    }
  };

  return (
    <>
      <Layout
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onAddPrayer={handleAddPrayer}
      >
        {renderTab()}
      </Layout>

      {showForm && (
        <PrayerForm
          onClose={() => { setShowForm(false); setEditPrayer(null); }}
          editPrayer={editPrayer}
        />
      )}
    </>
  );
}
