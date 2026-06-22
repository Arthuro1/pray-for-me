import { useState } from 'react';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useTranslationStore from '../store/translationStore';
import { Bell, Clock, Calendar, Phone, CheckCircle, LogOut, User, Mail, Shield, Globe } from 'lucide-react';
import { t, LANGUAGES } from '../i18n';

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

function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
      style={{ background: enabled ? '#7c5cfc' : '#e0d8f0' }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: enabled ? 'translateX(24px)' : 'translateX(4px)' }}
      />
    </button>
  );
}

function Row({ label, sub, icon: Icon, enabled, onToggle, children }) {
  return (
    <div style={{ borderBottom: '0.5px solid #f0ebfa', paddingBottom: '14px', marginBottom: '14px' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={15} style={{ color: '#b0a4c0' }} />}
          <div>
            <p className="text-sm font-medium" style={{ color: '#1a0f2e' }}>{label}</p>
            {sub && <p className="text-xs mt-0.5" style={{ color: '#b0a4c0' }}>{sub}</p>}
          </div>
        </div>
        {onToggle !== undefined && <Toggle enabled={enabled} onToggle={onToggle} />}
      </div>
      {children}
    </div>
  );
}

export default function SettingsTab() {
  const { settings, updateSettings, prayers } = usePrayerStore();
  const { user, signOut } = useAuthStore();
  const { tr } = useTranslationStore();

  const handleToggleNotifications = () => {
    if (!settings.dailyReminderEnabled) {
      requestNotificationPermission(() => {
        updateSettings({ dailyReminderEnabled: true, notificationsGranted: true });
      });
    } else {
      updateSettings({ dailyReminderEnabled: false });
    }
  };

  const lang = settings.language || 'fr';
  const answeredPrayers = prayers.filter((p) => p.status === 'answered');
  const activePrayers = prayers.filter((p) => p.status === 'active');

  const provider = user?.app_metadata?.provider;
  const providerLabel = provider === 'google' ? 'Google' : 'Email / Mot de passe';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0];
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div>
      {/* Header */}
      <div
        className="px-4 pt-8 pb-5"
        style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b5e 100%)' }}
      >
        {/* Profile */}
        <div className="flex items-center gap-3 mb-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-14 h-14 rounded-full object-cover" style={{ border: '2px solid rgba(255,255,255,0.2)' }} />
          ) : (
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <User size={24} color="rgba(255,255,255,0.8)" />
            </div>
          )}
          <div>
            <p className="font-semibold text-white">{displayName}</p>
            {memberSince && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{t(lang, 'memberSince')} {memberSince}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.12)' }}>
            <p className="text-2xl font-semibold text-white">{activePrayers.length}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{t(lang, 'activePrayers')}</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.12)' }}>
            <p className="text-2xl font-semibold" style={{ color: '#6ee7a8' }}>{answeredPrayers.length}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{t(lang, 'answeredPrayers')} 🙌</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-6">
        {/* Account info */}
        <div className="rounded-2xl p-4 mb-3" style={{ background: '#fff', border: '0.5px solid #ede8f5' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#b0a4c0' }}>{t(lang, 'account')}</p>
          <div className="space-y-2.5 mb-4">
            <div className="flex items-center gap-2.5">
              <Mail size={14} style={{ color: '#b0a4c0' }} />
              <span className="text-sm" style={{ color: '#3a2a5e' }}>{user?.email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Shield size={14} style={{ color: '#b0a4c0' }} />
              <span className="text-sm" style={{ color: '#3a2a5e' }}>{t(lang, 'via')} <span style={{ fontWeight: 500 }}>{providerLabel}</span></span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
            style={{ border: '0.5px solid #f5c8c8', color: '#c04040', background: '#fdf8f8' }}
          >
            <LogOut size={14} />
            {t(lang, 'signOut')}
          </button>
        </div>

        {/* Language */}
        <div className="rounded-2xl p-4 mb-3" style={{ background: '#fff', border: '0.5px solid #ede8f5' }}>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} style={{ color: '#7c5cfc' }} />
            <h3 className="font-semibold text-sm" style={{ color: '#1a0f2e' }}>{t(lang, 'language')}</h3>
          </div>
          <p className="text-xs mb-3" style={{ color: '#b0a4c0' }}>{t(lang, 'languageSub')}</p>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => updateSettings({ language: l.code })}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={
                  lang === l.code
                    ? { background: '#7c5cfc', color: '#fff' }
                    : { background: '#f3eff9', color: '#3a2a5e', border: '0.5px solid #e0d8f0' }
                }
              >
                <span className="text-base">{l.flag}</span>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl p-4 mb-3" style={{ background: '#fff', border: '0.5px solid #ede8f5' }}>
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} style={{ color: '#7c5cfc' }} />
            <h3 className="font-semibold text-sm" style={{ color: '#1a0f2e' }}>{t(lang, 'notifications')}</h3>
          </div>

          <Row label={t(lang, 'dailyReminder')} sub={t(lang, 'dailyReminderSub')} icon={Bell} enabled={settings.dailyReminderEnabled} onToggle={handleToggleNotifications}>
            {settings.dailyReminderEnabled && (
              <div className="mt-3 flex items-center gap-2">
                <Clock size={13} style={{ color: '#b0a4c0' }} />
                <input
                  type="time"
                  value={settings.dailyReminderTime}
                  onChange={(e) => updateSettings({ dailyReminderTime: e.target.value })}
                  className="text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                  style={{ background: '#f3eff9', border: '0.5px solid #e0d8f0', color: '#3a2a5e' }}
                />
              </div>
            )}
          </Row>

          <Row label={t(lang, 'followUp')} sub={t(lang, 'followUpSub')} icon={Calendar} enabled={settings.followUpEnabled} onToggle={() => updateSettings({ followUpEnabled: !settings.followUpEnabled })}>
            {settings.followUpEnabled && (
              <div className="mt-3">
                <select
                  value={settings.followUpDays}
                  onChange={(e) => updateSettings({ followUpDays: parseInt(e.target.value) })}
                  className="text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                  style={{ background: '#f3eff9', border: '0.5px solid #e0d8f0', color: '#3a2a5e' }}
                >
                  <option value={3}>{t(lang, 'every3days')}</option>
                  <option value={7}>{t(lang, 'everyWeek')}</option>
                  <option value={14}>{t(lang, 'every2weeks')}</option>
                  <option value={30}>{t(lang, 'everyMonth')}</option>
                </select>
              </div>
            )}
          </Row>

          <div style={{ paddingBottom: 0, marginBottom: 0, borderBottom: 'none' }}>
            <Row label={t(lang, 'callReminder')} sub={t(lang, 'callReminderSub')} icon={Phone} enabled={settings.callReminderEnabled} onToggle={() => updateSettings({ callReminderEnabled: !settings.callReminderEnabled })} />
          </div>

          {settings.notificationsGranted && (
            <button
              onClick={() => new Notification('Pray For Me 🙏', { body: 'Voici vos prières du jour. Prenez un moment pour prier!', icon: '/favicon.ico' })}
              className="w-full mt-3 text-sm py-2 rounded-xl font-medium"
              style={{ background: '#f3eff9', color: '#7c5cfc', border: '0.5px solid #e0d8f0' }}
            >
              {t(lang, 'testNotif')}
            </button>
          )}
        </div>

        {/* Answered prayers */}
        {answeredPrayers.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: '#fff', border: '0.5px solid #ede8f5' }}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} style={{ color: '#2a7a4e' }} />
              <h3 className="font-semibold text-sm" style={{ color: '#1a0f2e' }}>{t(lang, 'answeredGallery')}</h3>
            </div>
            <p className="text-xs mb-3" style={{ color: '#b0a4c0' }}>
              {t(lang, 'answeredGlory', { n: answeredPrayers.length, s: answeredPrayers.length > 1 ? 's' : '' })}
            </p>
            <div className="space-y-2">
              {answeredPrayers.map((p) => (
                <div key={p.id} className="rounded-xl p-3" style={{ background: '#e8f5ed', border: '0.5px solid #b8dfc8' }}>
                  <p className="text-sm font-medium" style={{ color: '#1a4a2e', textDecoration: 'line-through', opacity: 0.7 }}>{tr(p.title, lang)}</p>
                  {p.testimony && <p className="text-xs mt-1 italic" style={{ color: '#2a6040' }}>"{tr(p.testimony, lang)}"</p>}
                  {p.answered_at && <p className="text-xs mt-1" style={{ color: '#6aac88' }}>{new Date(p.answered_at).toLocaleDateString('fr-FR')}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-xs" style={{ color: '#d4c8e4' }}>Pray For Me v1.0</p>
          <p className="text-xs mt-0.5" style={{ color: '#e8e0f4', fontStyle: 'italic' }}>{t(lang, 'motto')}</p>
        </div>
      </div>
    </div>
  );
}
