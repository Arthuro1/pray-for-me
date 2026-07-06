import { useState, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import { Bell, Clock, Calendar, LogOut, User, Mail, Shield, ShieldCheck, Globe, Sun, Moon, MessageSquare, Heart, Download, Lock, Unlock, KeyRound, RefreshCw, Trash2, Sparkles, ChevronDown } from 'lucide-react';
import { t, LANGUAGES } from '../i18n';
import { toast } from '../store/toastStore';
import { confirm } from '../store/confirmStore';
import { enablePush, updatePushPrefs, getFollowUpLastSent } from '../push';
import { buildExport } from '../utils/export';
import { nextReminder, nextFollowUp } from '../utils/reminder';
import { track, EVENTS } from '../lib/analytics';
import FeedbackModal from '../components/FeedbackModal';
import DonateModal from '../components/DonateModal';
import PrivacyCenter from '../components/PrivacyCenter';
import VaultModal from '../components/VaultModal';
import VaultMigrationStatus from '../components/VaultMigrationStatus';
import AiDisclaimer from '../components/AiDisclaimer';
import { revokeAiConsent } from '../lib/aiConsent';
import useVaultStore from '../store/vaultStore';

// Version comes from package.json via Vite's `define` (see vite.config.js), so
// the About line never drifts. Fallback keeps it defined outside a Vite build.
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

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

// Native <select>/<option> can't render color flag emoji on Windows (the OS
// combobox popup uses its own text rendering, not the browser's), so this
// uses a custom button + list instead.
function LanguageDropdown({ lang, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = LANGUAGES.find((l) => l.code === lang);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm rounded-xl px-3 py-2 focus:outline-none"
        style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
      >
        <span>{active?.flag}</span>
        <span>{active?.label}</span>
        <ChevronDown size={14} style={{ opacity: 0.6 }} />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 rounded-xl overflow-hidden overflow-y-auto z-50"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', minWidth: '160px', maxHeight: '260px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => { onChange(l.code); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors"
              style={l.code === lang
                ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
                : { color: 'var(--text-2)' }}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsTab() {
  const { settings, updateSettings, prayers, categories } = usePrayerStore(
    useShallow((s) => ({ settings: s.settings, updateSettings: s.updateSettings, prayers: s.prayers, categories: s.categories }))
  );
  const { user, signOut, deleteAccount } = useAuthStore();
  const { initialized: vaultInitialized, unlocked: vaultUnlocked, lock: lockVault } = useVaultStore();
  const [showFeedback, setShowFeedback] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [vaultMode, setVaultMode] = useState(null); // 'setup' | 'unlock' | 'change' | null
  const [followUpLastSent, setFollowUpLastSent] = useState(null);

  const lang = settings.language || 'fr';
  // Derived from synced settings so consent granted/revoked anywhere (another
  // tab, another browser) is reflected here without a remount.
  const aiOn = !!(settings.aiConsentPrayer || settings.aiConsentHome);

  // Server sets last_follow_up_sent_at each time it actually pushes one; pull
  // it in whenever the toggle is on so "next follow-up" reflects reality.
  useEffect(() => {
    if (!settings.followUpEnabled || !user?.id) return;
    let cancelled = false;
    getFollowUpLastSent(user.id).then((val) => { if (!cancelled) setFollowUpLastSent(val); });
    return () => { cancelled = true; };
  }, [settings.followUpEnabled, user?.id]);

  const handleLockVault = () => {
    lockVault();
    toast.success(t(lang, 'vaultLockedToast'));
  };

  const handleToggleNotifications = async () => {
    if (!settings.dailyReminderEnabled) {
      // Flip the preference immediately so the switch responds, then enable push
      // as best-effort. Only an explicit permission denial reverts it.
      updateSettings({ dailyReminderEnabled: true });
      track(EVENTS.REMINDER_SET, { method: 'daily' });
      let res;
      try { res = await enablePush(user?.id, { reminderTime: settings.dailyReminderTime, lang, enabled: true }); }
      catch { res = { error: 'failed' }; }
      if (res?.error === 'denied') {
        updateSettings({ dailyReminderEnabled: false });
        toast.error(t(lang, 'pushDenied'));
      } else {
        if (res?.error) {
          // Reminder saved, but this device/browser can't deliver push (e.g. dev
          // server with no service worker). In-app reminders still show while open.
          toast.info(t(lang, 'pushUnavailable'));
        } else {
          updateSettings({ notificationsGranted: true });
          toast.success(t(lang, 'remindersOn'));
        }
        // The toggle is account-level: align every other signed-in device's
        // subscription row too (enablePush only wrote this one's).
        try { await updatePushPrefs(user?.id, { reminderTime: settings.dailyReminderTime, lang, enabled: true }); } catch { /* best-effort */ }
      }
    } else {
      updateSettings({ dailyReminderEnabled: false });
      // Subscription rows stay (the scheduler skips enabled=false) so
      // re-enabling later doesn't need a new permission prompt anywhere.
      try { await updatePushPrefs(user?.id, { enabled: false }); } catch { /* best-effort */ }
    }
  };

  const handleReminderTimeChange = (time) => {
    updateSettings({ dailyReminderTime: time });
    updatePushPrefs(user?.id, { reminderTime: time });
  };

  // Follow-up reminders fire on the same schedule engine as the daily one
  // (server-side, at their own local follow-up time) but only every N days,
  // so they share a push subscription row with independent on/off flags.
  const handleToggleFollowUp = async () => {
    if (!settings.followUpEnabled) {
      updateSettings({ followUpEnabled: true });
      track(EVENTS.REMINDER_SET, { method: 'followUp' });
      // Enabling (re)starts the cadence: stamp the anchor so the first
      // follow-up arrives a full followUpDays from now, not at the next window.
      const anchor = new Date().toISOString();
      let res;
      try {
        res = await enablePush(user?.id, {
          reminderTime: settings.dailyReminderTime,
          lang,
          enabled: settings.dailyReminderEnabled,
          followUpEnabled: true,
          followUpDays: settings.followUpDays,
          followUpTime: settings.followUpTime,
        });
      } catch { res = { error: 'failed' }; }
      if (res?.error === 'denied') {
        updateSettings({ followUpEnabled: false });
        toast.error(t(lang, 'pushDenied'));
      } else {
        if (res?.error) {
          toast.info(t(lang, 'pushUnavailable'));
        } else {
          updateSettings({ notificationsGranted: true });
          toast.success(t(lang, 'remindersOn'));
        }
        // Account-level toggle — align the other devices' rows as well.
        try {
          await updatePushPrefs(user?.id, {
            followUpEnabled: true,
            followUpDays: settings.followUpDays,
            followUpTime: settings.followUpTime,
            followUpLastSentAt: anchor,
          });
        } catch { /* best-effort */ }
        setFollowUpLastSent(anchor);
      }
    } else {
      updateSettings({ followUpEnabled: false });
      try { await updatePushPrefs(user?.id, { followUpEnabled: false }); } catch { /* best-effort */ }
    }
  };

  const handleFollowUpDaysChange = (days) => {
    updateSettings({ followUpDays: days });
    updatePushPrefs(user?.id, { followUpDays: days });
  };

  const handleFollowUpTimeChange = (time) => {
    updateSettings({ followUpTime: time });
    updatePushPrefs(user?.id, { followUpTime: time });
  };

  const handleRevokeAi = () => {
    revokeAiConsent();
    toast.success(t(lang, 'aiRevoked'));
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
    track(EVENTS.DATA_EXPORTED);
    toast.success(t(lang, 'exportDone'));
  };

  const handleDeleteAccount = () => {
    track(EVENTS.ACCOUNT_DELETED_STARTED);
    confirm({
      title: t(lang, 'deleteAccount'),
      message: t(lang, 'deleteAccountWarning'),
      confirmLabel: t(lang, 'deleteAccountConfirm'),
      cancelLabel: t(lang, 'cancel'),
      danger: true,
      onConfirm: async () => {
        const { error } = await deleteAccount();
        if (error) toast.error(t(lang, 'deleteAccountError'));
        else toast.success(t(lang, 'deleteAccountDone'));
      },
    });
  };
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

        {/* Prayer Vault */}
        <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            {vaultInitialized && !vaultUnlocked ? <Lock size={16} style={{ color: 'var(--accent)' }} /> : <Shield size={16} style={{ color: 'var(--accent)' }} />}
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'vaultTitle')}</h3>
            {vaultInitialized && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                {t(lang, vaultUnlocked ? 'vaultStatusUnlocked' : 'vaultStatusLocked')}
              </span>
            )}
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'vaultManageSub')}</p>

          {!vaultInitialized && (
            <button
              onClick={() => setVaultMode('setup')}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
            >
              <Shield size={14} />
              {t(lang, 'vaultSetup')}
            </button>
          )}

          {vaultInitialized && !vaultUnlocked && (
            <button
              onClick={() => setVaultMode('unlock')}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
            >
              <Unlock size={14} />
              {t(lang, 'vaultUnlock')}
            </button>
          )}

          {vaultInitialized && vaultUnlocked && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleLockVault}
                  className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                >
                  <Lock size={14} />
                  {t(lang, 'vaultLockNow')}
                </button>
                <button
                  onClick={() => setVaultMode('change')}
                  className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                >
                  <KeyRound size={14} />
                  {t(lang, 'vaultChangePass')}
                </button>
                <button
                  onClick={() => setVaultMode('rotate')}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                >
                  <RefreshCw size={14} />
                  {t(lang, 'vaultRotateCode')}
                </button>
              </div>
              <VaultMigrationStatus lang={lang} />
            </>
          )}
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
            <LanguageDropdown
              lang={lang}
              onChange={(code) => { updateSettings({ language: code }); updatePushPrefs(user?.id, { lang: code }); }}
            />
          </div>
        </div>

        {/* AI assistance */}
        <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'aiAboutTitle')}</h3>
          </div>
          <AiDisclaimer lang={lang} variant="full" className="my-3" />
          {aiOn ? (
            <button
              onClick={handleRevokeAi}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
              style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
            >
              <Sparkles size={14} />
              {t(lang, 'aiRevoke')}
            </button>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'aiCurrentlyOff')}</p>
          )}
        </div>

        {/* Notifications */}
        <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} style={{ color: '#7c5cfc' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'notifications')}</h3>
          </div>

          <Row label={t(lang, 'dailyReminder')} sub={t(lang, 'dailyReminderSub')} icon={Bell} enabled={settings.dailyReminderEnabled} onToggle={handleToggleNotifications}>
            {settings.dailyReminderEnabled && (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <Clock size={13} style={{ color: 'var(--text-3)' }} />
                  <input
                    type="time"
                    value={settings.dailyReminderTime}
                    onChange={(e) => handleReminderTimeChange(e.target.value)}
                    className="text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                    style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                  />
                </div>
                {(() => {
                  const r = nextReminder(settings.dailyReminderTime);
                  return (
                    <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
                      {t(lang, 'nextReminder')} · {r.tomorrow ? t(lang, 'tomorrow') : t(lang, 'today')} {r.time}
                    </p>
                  );
                })()}
              </div>
            )}
          </Row>

          <div style={{ paddingBottom: 0, marginBottom: 0, borderBottom: 'none' }}>
            <Row label={t(lang, 'followUp')} sub={t(lang, 'followUpSub')} icon={Calendar} enabled={settings.followUpEnabled} onToggle={handleToggleFollowUp}>
              {settings.followUpEnabled && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={settings.followUpDays}
                      onChange={(e) => handleFollowUpDaysChange(parseInt(e.target.value))}
                      className="text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                      style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                    >
                      <option value={3}>{t(lang, 'every3days')}</option>
                      <option value={7}>{t(lang, 'everyWeek')}</option>
                      <option value={14}>{t(lang, 'every2weeks')}</option>
                      <option value={30}>{t(lang, 'everyMonth')}</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <Clock size={13} style={{ color: 'var(--text-3)' }} />
                      <input
                        type="time"
                        value={settings.followUpTime || '07:00'}
                        onChange={(e) => handleFollowUpTimeChange(e.target.value)}
                        className="text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                        style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
                      />
                    </div>
                  </div>
                  {(() => {
                    const nf = nextFollowUp(followUpLastSent, settings.followUpDays, settings.followUpTime);
                    const dayLabel = nf.daysAhead === 0
                      ? t(lang, 'today')
                      : nf.daysAhead === 1
                        ? t(lang, 'tomorrow')
                        : nf.date.toLocaleDateString(lang, { month: 'short', day: 'numeric' });
                    return (
                      <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
                        {t(lang, 'nextReminder')} · {dayLabel} {nf.time}
                      </p>
                    );
                  })()}
                </div>
              )}
            </Row>
          </div>

          {settings.notificationsGranted && (
            <button
              onClick={() => new Notification('Pray4Me 🙏', { body: t(lang, 'testNotifBody'), icon: '/favicon.ico' })}
              title={t(lang, 'tipTestNotif')}
              className="w-full mt-3 text-sm py-2 rounded-xl font-medium"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
            >
              {t(lang, 'testNotif')}
            </button>
          )}
        </div>

        </div>{/* end md:grid */}

        {/* Privacy Center — plain-language explanation of storage & sharing.
            Basic privacy is free for everyone; this is never gated. */}
        <div className="rounded-2xl p-4 mb-3 mt-1" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={16} style={{ color: 'var(--accent)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'privacyCenterTitle')}</h3>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'privacyCenterSub')}</p>
          <button
            onClick={() => setShowPrivacy(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
          >
            <ShieldCheck size={14} />
            {t(lang, 'privacyCenterBtn')}
          </button>
        </div>

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

          {/* Danger zone — irreversible account deletion (right to erasure) */}
          <div className="mt-4 pt-4" style={{ borderTop: '0.5px solid var(--border-soft)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#c04040' }}>{t(lang, 'dangerZone')}</p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'deleteAccountSub')}</p>
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
              style={{ border: '0.5px solid #f5c8c8', color: '#c04040', background: '#fdf8f8' }}
            >
              <Trash2 size={14} />
              {t(lang, 'deleteAccount')}
            </button>
          </div>
        </div>

        {/* Donate — a true, optional one-time gift. Purely voluntary: a donation
            never unlocks features and the whole app works without it. */}
        <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Heart size={16} style={{ color: '#16a34a' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'donateTitle')}</h3>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'donateSub')}</p>
          <button
            onClick={() => setShowDonate(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
            style={{ background: '#f0fdf4', color: '#16a34a', border: '0.5px solid #bbf7d0' }}
          >
            <Heart size={14} />
            {t(lang, 'donateBtn')}
          </button>
        </div>

        <div className="rounded-2xl px-6 py-5 mt-2 text-center" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
          <p className="text-sm font-medium italic mb-2 leading-relaxed" style={{ color: 'var(--accent)' }}>{t(lang, 'motto')}</p>
          <p className="text-xs font-medium" style={{ color: 'var(--accent)', opacity: 0.6 }}>James 5:16</p>
        </div>
        <p className="text-center text-xs mt-3" style={{ color: 'var(--text-3)' }}>Pray4Me v{APP_VERSION}</p>
      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}
      {showPrivacy && <PrivacyCenter lang={lang} onClose={() => setShowPrivacy(false)} />}
      {vaultMode && (
        <VaultModal lang={lang} initialMode={vaultMode} onClose={() => setVaultMode(null)} />
      )}
    </div>
  );
}
