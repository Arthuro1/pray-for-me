import { useState } from 'react';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import useTranslationStore from '../store/translationStore';
import { Bell, Clock, Calendar, Phone, CheckCircle, LogOut, User, Mail, Shield, Globe, Sun, Moon, MessageSquare, Heart, Download } from 'lucide-react';
import { t, LANGUAGES } from '../i18n';
import { toast } from '../store/toastStore';
import { enablePush, updatePushPrefs, disablePush, pushSupported } from '../push';
import { buildExport } from '../utils/export';
import FeedbackModal from '../components/FeedbackModal';
import DonateModal from '../components/DonateModal';

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
    <div style={{ borderBottom: '0.5px solid var(--border-soft)', paddingBottom: '14px', marginBottom: '14px' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={15} style={{ color: 'var(--text-3)' }} />}
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{label}</p>
            {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</p>}
          </div>
        </div>
        {onToggle !== undefined && <Toggle enabled={enabled} onToggle={onToggle} />}
      </div>
      {children}
    </div>
  );
}

export default function SettingsTab() {
  const { settings, updateSettings, prayers, categories } = usePrayerStore();
  const { user, signOut } = useAuthStore();
  const { tr } = useTranslationStore();
  const [showFeedback, setShowFeedback] = useState(false);
  const [showDonate, setShowDonate] = useState(false);

  const lang = settings.language || 'fr';

  const handleToggleNotifications = async () => {
    if (!settings.dailyReminderEnabled) {
      if (!pushSupported()) { toast.error(t(lang, 'pushUnsupported')); return; }
      const { error } = await enablePush(user?.id, { reminderTime: settings.dailyReminderTime, lang });
      if (error) { toast.error(t(lang, error === 'denied' ? 'pushDenied' : 'errorGeneric')); return; }
      updateSettings({ dailyReminderEnabled: true, notificationsGranted: true });
      toast.success(t(lang, 'remindersOn'));
    } else {
      await disablePush(user?.id);
      updateSettings({ dailyReminderEnabled: false });
    }
  };

  const handleReminderTimeChange = (time) => {
    updateSettings({ dailyReminderTime: time });
    if (settings.dailyReminderEnabled) updatePushPrefs(user?.id, { reminderTime: time });
  };

  const handleExport = () => {
    const data = buildExport(prayers, categories);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pray4me-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t(lang, 'exportDone'));
  };
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
      <div className="px-4 md:px-8 pt-8 pb-5" style={{ background: 'var(--header)' }}>
        {/* Profile */}
        <div className="flex items-center gap-3 mb-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-14 h-14 rounded-full object-cover" style={{ border: '2px solid rgba(255,255,255,0.3)' }} />
          ) : (
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
              <User size={24} color="rgba(255,255,255,0.9)" />
            </div>
          )}
          <div>
            <p className="font-semibold text-white">{displayName}</p>
            {memberSince && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{t(lang, 'memberSince')} {memberSince}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.18)' }}>
            <p className="text-2xl font-semibold text-white">{activePrayers.length}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{t(lang, 'activePrayers')}</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.18)' }}>
            <p className="text-2xl font-semibold text-white">{answeredPrayers.length}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{t(lang, 'answeredPrayers')} 🙌</p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-4 pb-6">
        <div className="md:grid md:grid-cols-2 md:gap-4 md:items-start">
        {/* Account info */}
        <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'account')}</p>
          <div className="space-y-2.5 mb-4">
            <div className="flex items-center gap-2.5">
              <Mail size={14} style={{ color: 'var(--text-3)' }} />
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>{user?.email}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Shield size={14} style={{ color: 'var(--text-3)' }} />
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>{t(lang, 'via')} <span style={{ fontWeight: 500 }}>{providerLabel}</span></span>
            </div>
          </div>
          <button
            onClick={signOut}
            title={t(lang, 'tipSignOut')}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
            style={{ border: '0.5px solid #f5c8c8', color: '#c04040', background: '#fdf8f8' }}
          >
            <LogOut size={14} />
            {t(lang, 'signOut')}
          </button>
        </div>

        {/* Theme */}
        <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            {settings.theme === 'dark' ? <Moon size={16} style={{ color: 'var(--accent)' }} /> : <Sun size={16} style={{ color: 'var(--accent)' }} />}
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'appearance')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[{ value: 'light', icon: Sun, labelKey: 'themeLight' }, { value: 'dark', icon: Moon, labelKey: 'themeDark' }].map(({ value, icon: Icon, labelKey }) => (
              <button
                key={value}
                onClick={() => updateSettings({ theme: value })}
                className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition-all"
                style={settings.theme === value
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
              >
                <Icon size={15} />
                {t(lang, labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={16} style={{ color: 'var(--accent)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'language')}</h3>
            </div>
            <select
              value={lang}
              onChange={(e) => { updateSettings({ language: e.target.value }); if (settings.dailyReminderEnabled) updatePushPrefs(user?.id, { lang: e.target.value }); }}
              className="text-sm rounded-xl px-3 py-2 focus:outline-none"
              style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)', maxWidth: '180px' }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} style={{ color: '#7c5cfc' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'notifications')}</h3>
          </div>

          <Row label={t(lang, 'dailyReminder')} sub={t(lang, 'dailyReminderSub')} icon={Bell} enabled={settings.dailyReminderEnabled} onToggle={handleToggleNotifications}>
            {settings.dailyReminderEnabled && (
              <div className="mt-3 flex items-center gap-2">
                <Clock size={13} style={{ color: 'var(--text-3)' }} />
                <input
                  type="time"
                  value={settings.dailyReminderTime}
                  onChange={(e) => handleReminderTimeChange(e.target.value)}
                  className="text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                  style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
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
                  style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
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
              onClick={() => new Notification('Pray4Me 🙏', { body: 'Voici vos prières du jour. Prenez un moment pour prier!', icon: '/favicon.ico' })}
              title={t(lang, 'tipTestNotif')}
              className="w-full mt-3 text-sm py-2 rounded-xl font-medium"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
            >
              {t(lang, 'testNotif')}
            </button>
          )}
        </div>

        {/* Answered prayers */}
        {answeredPrayers.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} style={{ color: '#2a7a4e' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'answeredGallery')}</h3>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>
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

        </div>{/* end md:grid */}

        {/* Feedback */}
        <div className="rounded-2xl p-4 mb-3 mt-1" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={16} style={{ color: 'var(--accent)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'feedbackTitle')}</h3>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'feedbackSub')}</p>
          <button
            onClick={() => setShowFeedback(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
          >
            <MessageSquare size={14} />
            {t(lang, 'feedbackBtn')}
          </button>
        </div>

        {/* Data export */}
        <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Download size={16} style={{ color: 'var(--accent)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'dataTitle')}</h3>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'exportDataSub')}</p>
          <button
            onClick={handleExport}
            disabled={prayers.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium disabled:opacity-40"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
          >
            <Download size={14} />
            {t(lang, 'exportData')}
          </button>
        </div>

        {/* Donate */}
        <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Heart size={16} style={{ color: '#e11d48' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'donateTitle')}</h3>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'donateSub')}</p>
          <button
            onClick={() => setShowDonate(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
            style={{ background: '#fff1f2', color: '#e11d48', border: '0.5px solid #fecdd3' }}
          >
            <Heart size={14} />
            {t(lang, 'donateBtn')}
          </button>
        </div>

        <div className="rounded-2xl px-6 py-5 mt-2 text-center" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
          <p className="text-sm font-medium italic mb-2 leading-relaxed" style={{ color: 'var(--accent)' }}>{t(lang, 'motto')}</p>
          <p className="text-xs font-medium" style={{ color: 'var(--accent)', opacity: 0.6 }}>James 5:16</p>
        </div>
        <p className="text-center text-xs mt-3" style={{ color: 'var(--text-3)' }}>Pray4Me v1.0</p>
      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}
    </div>
  );
}
