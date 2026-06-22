import { useState } from 'react';
import usePrayerStore from '../store/prayerStore';
import { Bell, Clock, Calendar, Phone, CheckCircle } from 'lucide-react';

function requestNotificationPermission(onGranted) {
  if (!('Notification' in window)) {
    alert("Votre navigateur ne supporte pas les notifications.");
    return;
  }
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      onGranted();
      new Notification('Pray For Me 🙏', {
        body: 'Les notifications sont activées! Dieu vous entend.',
        icon: '/favicon.ico',
      });
    } else {
      alert("Les notifications ont été refusées. Veuillez les activer dans les paramètres de votre navigateur.");
    }
  });
}

export default function SettingsTab() {
  const { settings, updateSettings, prayers } = usePrayerStore();
  const [saved, setSaved] = useState(false);

  const handleToggleNotifications = () => {
    if (!settings.dailyReminderEnabled) {
      requestNotificationPermission(() => {
        updateSettings({ dailyReminderEnabled: true, notificationsGranted: true });
      });
    } else {
      updateSettings({ dailyReminderEnabled: false });
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const answeredPrayers = prayers.filter((p) => p.status === 'answered');
  const activePrayers = prayers.filter((p) => p.status === 'active');

  return (
    <div className="p-4">
      <h2 className="font-bold text-slate-800 text-lg mb-4">Paramètres</h2>

      {/* Stats card */}
      <div className="bg-indigo-700 text-white rounded-2xl p-4 mb-4">
        <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wide mb-3">Votre vie de prière</p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold">{activePrayers.length}</p>
            <p className="text-xs text-indigo-200">Prières actives</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-300">{answeredPrayers.length}</p>
            <p className="text-xs text-indigo-200">Exaucées 🙌</p>
          </div>
        </div>
      </div>

      {/* Notifications section */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={18} className="text-indigo-600" />
          <h3 className="font-semibold text-slate-700">Notifications</h3>
        </div>

        {/* Daily reminder */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700">Rappel quotidien</p>
            <p className="text-xs text-slate-400">Rappel pour prier chaque jour</p>
          </div>
          <button
            onClick={handleToggleNotifications}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.dailyReminderEnabled ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                settings.dailyReminderEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.dailyReminderEnabled && (
          <div className="mb-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-slate-400" />
              <label className="text-sm text-slate-600">Heure du rappel</label>
            </div>
            <input
              type="time"
              value={settings.dailyReminderTime}
              onChange={(e) => updateSettings({ dailyReminderTime: e.target.value })}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        )}

        {/* Follow-up reminder */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700">Suivi des prières</p>
            <p className="text-xs text-slate-400">Demander l'évolution des prières</p>
          </div>
          <button
            onClick={() => updateSettings({ followUpEnabled: !settings.followUpEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.followUpEnabled ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                settings.followUpEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.followUpEnabled && (
          <div className="mb-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-slate-400" />
              <label className="text-sm text-slate-600">Fréquence du suivi</label>
            </div>
            <select
              value={settings.followUpDays}
              onChange={(e) => updateSettings({ followUpDays: parseInt(e.target.value) })}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value={3}>Tous les 3 jours</option>
              <option value={7}>Chaque semaine</option>
              <option value={14}>Toutes les 2 semaines</option>
              <option value={30}>Chaque mois</option>
            </select>
          </div>
        )}

        {/* Call reminder for others */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-700">Rappel d'appel</p>
              <p className="text-xs text-slate-400">Rappel pour appeler les personnes</p>
            </div>
          </div>
          <button
            onClick={() => updateSettings({ callReminderEnabled: !settings.callReminderEnabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.callReminderEnabled ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                settings.callReminderEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Test notification button */}
      {settings.notificationsGranted && (
        <button
          onClick={() => {
            new Notification('Pray For Me 🙏', {
              body: 'Voici vos prières du jour. Prenez un moment pour prier!',
              icon: '/favicon.ico',
            });
          }}
          className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-100 transition-colors mb-3"
        >
          Tester une notification
        </button>
      )}

      {/* Answered prayers gallery */}
      {answeredPrayers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} className="text-green-500" />
            <h3 className="font-semibold text-slate-700">Prières exaucées 🎉</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Dieu a exaucé {answeredPrayers.length} de vos prières. Gloire à Lui!
          </p>
          <div className="space-y-2">
            {answeredPrayers.map((p) => (
              <div key={p.id} className="bg-green-50 border border-green-100 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <span className="text-green-500">✅</span>
                  <div>
                    <p className="text-sm font-medium text-slate-700 line-through text-slate-400">{p.title}</p>
                    {p.testimony && (
                      <p className="text-xs text-green-600 mt-0.5 italic">"{p.testimony}"</p>
                    )}
                    {p.answeredAt && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(p.answeredAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-6 pb-2">
        <p className="text-xs text-slate-400">Pray For Me v1.0</p>
        <p className="text-xs text-slate-300 mt-0.5">"La prière est le souffle de l'âme"</p>
      </div>
    </div>
  );
}
