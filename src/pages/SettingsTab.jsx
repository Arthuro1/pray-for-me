import { useState, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import { Bell, Clock, Calendar, LogOut, Mail, Shield, ShieldCheck, Globe, Sun, Moon, MessageSquare, Heart, Download, Lock, Unlock, KeyRound, RefreshCw, Trash2, Sparkles, ChevronDown, WifiOff } from 'lucide-react';
import { t, LANGUAGES } from '../i18n';
import ResourceLanguagePref from '../components/ResourceLanguagePref';
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
import AiDisclaimer from '../components/shared/AiDisclaimer';
import NotificationPreferences from '../components/NotificationPreferences';
import Switch from '../components/shared/Switch';
import { revokeAiConsent } from '../lib/aiConsent';
import useVaultStore from '../store/vaultStore';
import { PageHeader } from '../components/shared/Primitives';
import Avatar from '../components/shared/Avatar';
import AvatarEditor from '../components/shared/AvatarEditor';
import { fetchMyAvatar, saveMyAvatar } from '../lib/profileAvatars';
import { identityPhotoUrlFrom, withIdentityPhoto } from '../lib/identityPhoto';

// Version comes from package.json via Vite's `define` (see vite.config.js), so
// the About line never drifts. Fallback keeps it defined outside a Vite build.
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

function Row({ label, sub, icon: Icon, enabled, onToggle, children }) {
  return (
    <div className="settings-row" style={{ borderBottom: '0.5px solid var(--border-soft)', paddingBottom: '14px', marginBottom: '14px' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && <Icon size={15} className="shrink-0" style={{ color: 'var(--text-3)' }} />}
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{label}</p>
            {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</p>}
          </div>
        </div>
        {onToggle !== undefined && (
          <span className="shrink-0"><Switch checked={!!enabled} onChange={onToggle} label={label} /></span>
        )}
      </div>
      {children}
    </div>
  );
}

// One compact row inside Privacy & Security: label + chevron, expanding to the
// full card content on demand. Proper disclosure semantics (aria-expanded /
// aria-controls) and a ≥44px row — the section reads as a short list instead
// of a long card stack.
function PrivacyRow({ id, icon: Icon, label, open, onToggle, children }) {
  return (
    <div style={{ borderBottom: '0.5px solid var(--border-soft)' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-body`}
        className="w-full min-h-[48px] flex items-center gap-2.5 px-1 py-2 text-start"
      >
        <Icon size={15} className="shrink-0" style={{ color: 'var(--accent)' }} aria-hidden="true" />
        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-1)' }}>{label}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          style={{ color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>
      <div id={`${id}-body`} hidden={!open} className="px-1 pb-3">
        {children}
      </div>
    </div>
  );
}

// The "a few per day" options: off, or a small cap on how many prayers Today
// asks for. Off is first because it is the default — nothing is hidden unless
// the reader asks for it.
const CAP_OPTIONS = [null, 3, 5, 10];

// A collapsible, labelled group of settings cards. Progressive disclosure: the
// header stays visible so nothing is hidden from discovery, and the panel is
// `hidden` when collapsed so its controls drop out of the tab order too. The
// `id` doubles as the deep-link anchor (e.g. /settings#notifications).
function SettingsSection({ id, title, icon: Icon, open, onToggle, children }) {
  return (
    <section id={id} className="settings-section">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="settings-section__trigger flex items-center gap-2.5"
      >
        <Icon size={16} style={{ color: 'var(--accent)' }} />
        <h2 className="text-sm font-bold flex-1 text-left" style={{ color: 'var(--text-1)' }}>{title}</h2>
        <ChevronDown
          size={16}
          style={{ color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>
      <div id={`${id}-panel`} hidden={!open} className="settings-section__panel">
        {children}
      </div>
    </section>
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
  // The user's own avatar preset. Read through the same relationship-scoped RPC
  // as everyone else's (the caller is always allowed to see their own).
  const [myAvatar, setMyAvatar] = useState(null);
  // Settings reads as a short list of destinations: every section starts
  // collapsed and opens on demand. A deep-link (below) force-opens its target.
  // Privacy & Security is ONE consolidated section (visibility, vault,
  // notification previews, AI consent, export, deletion) — reachable from More.
  const [openSections, setOpenSections] = useState({
    account: false, privacy: false, notifications: false, appearance: false, support: false,
  });
  const toggleSection = (key) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  // Privacy & Security's internal rows start compact too — each expands alone.
  const [openPrivacyRows, setOpenPrivacyRows] = useState({});
  const togglePrivacyRow = (key) => setOpenPrivacyRows((s) => ({ ...s, [key]: !s[key] }));

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

  useEffect(() => {
    if (!user?.id) return undefined;
    let cancelled = false;
    fetchMyAvatar(user.id).then((cfg) => { if (!cancelled) setMyAvatar(cfg); });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Persist the chosen avatar, then reflect it locally so the header tile and
  // the editor preview agree immediately without a refetch. The editor owns the
  // toast, so this only reports whether the write landed. The account picture is
  // re-attached because it is never stored: clearing an explicit choice is
  // exactly what makes it the default again.
  const handleSaveAvatar = async (config) => {
    const { error } = await saveMyAvatar(user?.id, config);
    if (error) return { error };
    setMyAvatar(withIdentityPhoto(user?.id, config));
    return {};
  };

  // Deep-link into a section (e.g. /settings#notifications from the inbox):
  // expand the matching section first, then scroll it into view next frame.
  useEffect(() => {
    const hash = window.location.hash?.slice(1);
    if (!hash) return;
    // The old Data & advanced section merged into Privacy & Security — keep
    // saved #data deep-links working.
    const target = hash === 'data' ? 'privacy' : hash;
    setOpenSections((s) => (target in s ? { ...s, [target]: true } : s));
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

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
    a.download = `praystead-export-${new Date().toISOString().slice(0, 10)}.json`;
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
  const providerLabel = provider === 'google' ? 'Google' : t(lang, 'providerEmail');
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0];
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(lang, { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="phase-page constellation-settings">
      {/* Header */}
      <div className="phase-page__shell">
        <PageHeader
          eyebrow={t(lang, 'settingsSecAccount')}
          title={t(lang, 'settings')}
          subtitle={memberSince ? `${t(lang, 'memberSince')} ${memberSince}` : undefined}
          aside={<Avatar name={displayName || ''} avatar={myAvatar} size={56} />}
        />
        <div className="settings-profile phase-card phase-card--quiet px-4 py-3 mb-5">
          <div className="min-w-0">
            <p className="font-semibold truncate" style={{ color: 'var(--text-1)' }}>{displayName}</p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-3)' }}>{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="phase-content max-w-3xl">

        {/* ── Account & privacy ── */}
        <SettingsSection id="account" title={t(lang, 'settingsSecAccount')} icon={Shield} open={openSections.account} onToggle={() => toggleSection('account')}>
          {/* Avatar — three controls, deliberately not a profile screen. */}
          <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'profileAvatar')}</p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'profileAvatarHint')}</p>
            <AvatarEditor
              lang={lang}
              kind="user"
              name={displayName || ''}
              avatar={myAvatar}
              ownerId={user?.id}
              identityPhotoUrl={identityPhotoUrlFrom(user)}
              onSave={handleSaveAvatar}
            />
          </div>

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
              style={{ border: '1px solid color-mix(in srgb, var(--danger) 28%, var(--border))', color: 'var(--danger)', background: 'var(--danger-bg)' }}
            >
              <LogOut size={14} />
              {t(lang, 'signOut')}
            </button>
          </div>
        </SettingsSection>

        {/* ── Privacy & Security — the ONE consolidated destination. Inside, a
            compact list of disclosure ROWS instead of a long card stack; only
            Delete account stays apart, at the bottom. ── */}
        <SettingsSection id="privacy" title={t(lang, 'privacySecurity')} icon={ShieldCheck} open={openSections.privacy} onToggle={() => toggleSection('privacy')}>
          <div className="rounded-2xl px-3 py-1 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            {/* Privacy Center — plain-language explanation of storage & sharing.
                Basic privacy is free for everyone; this is never gated. */}
            <PrivacyRow id="privacy-overview" icon={ShieldCheck} label={t(lang, 'privacyRowOverview')} open={!!openPrivacyRows.overview} onToggle={() => togglePrivacyRow('overview')}>
              <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'privacyCenterSub')}</p>
              <button
                onClick={() => setShowPrivacy(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 min-h-[44px] text-sm font-medium"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
              >
                <ShieldCheck size={14} />
                {t(lang, 'privacyCenterBtn')}
              </button>
            </PrivacyRow>

            {/* Prayer Vault */}
            <PrivacyRow id="privacy-vault" icon={vaultInitialized && !vaultUnlocked ? Lock : Shield} label={t(lang, 'privacyRowVault')} open={!!openPrivacyRows.vault} onToggle={() => togglePrivacyRow('vault')}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs flex-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'vaultManageSub')}</p>
                {vaultInitialized && (
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    {t(lang, vaultUnlocked ? 'vaultStatusUnlocked' : 'vaultStatusLocked')}
                  </span>
                )}
              </div>

              {!vaultInitialized && (
                <button
                  onClick={() => setVaultMode('setup')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 min-h-[44px] text-sm font-medium"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
                >
                  <Shield size={14} />
                  {t(lang, vaultUnlocked ? 'backupKeyCta' : 'vaultSetup')}
                </button>
              )}

              {vaultInitialized && !vaultUnlocked && (
                <button
                  onClick={() => setVaultMode('unlock')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 min-h-[44px] text-sm font-medium"
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
                      className="flex items-center justify-center gap-2 rounded-xl py-2.5 min-h-[44px] text-sm font-medium"
                      style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                    >
                      <Lock size={14} />
                      {t(lang, 'vaultLockNow')}
                    </button>
                    <button
                      onClick={() => setVaultMode('change')}
                      className="flex items-center justify-center gap-2 rounded-xl py-2.5 min-h-[44px] text-sm font-medium"
                      style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                    >
                      <KeyRound size={14} />
                      {t(lang, 'vaultChangePass')}
                    </button>
                    <button
                      onClick={() => setVaultMode('rotate')}
                      className="col-span-2 flex items-center justify-center gap-2 rounded-xl py-2.5 min-h-[44px] text-sm font-medium"
                      style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                    >
                      <RefreshCw size={14} />
                      {t(lang, 'vaultRotateCode')}
                    </button>
                  </div>
                  <VaultMigrationStatus lang={lang} />
                </>
              )}
            </PrivacyRow>

            {/* Notification privacy — what a push may reveal. Native radios; the
                choice syncs account-wide and every scheduler honours it. Generic
                previews stay the safest default. */}
            <PrivacyRow id="privacy-notif" icon={Bell} label={t(lang, 'privacyRowNotif')} open={!!openPrivacyRows.notif} onToggle={() => togglePrivacyRow('notif')}>
              <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'notifPreviewSub')}</p>
              <div role="radiogroup" aria-label={t(lang, 'notifPreviewTitle')} className="space-y-1.5">
                {[
                  { value: 'generic', labelKey: 'notifPreviewGeneric' },
                  { value: 'count', labelKey: 'notifPreviewCount' },
                ].map(({ value, labelKey }) => (
                  <label key={value} className="flex items-center gap-2.5 min-h-[44px] px-2 rounded-xl cursor-pointer" style={{ background: 'var(--input-bg)' }}>
                    <input
                      type="radio"
                      name="notification-detail"
                      value={value}
                      checked={(settings.notificationDetail || 'generic') === value}
                      onChange={() => {
                        updateSettings({ notificationDetail: value });
                        updatePushPrefs(user?.id, { notificationDetail: value }).catch(() => { /* best-effort */ });
                      }}
                    />
                    <span className="text-sm" style={{ color: 'var(--text-2)' }}>{t(lang, labelKey)}</span>
                  </label>
                ))}
              </div>
            </PrivacyRow>

            {/* Low data mode — device-local; defers nonessential fetches only. */}
            <PrivacyRow id="privacy-lowdata" icon={WifiOff} label={t(lang, 'privacyRowLowData')} open={!!openPrivacyRows.lowdata} onToggle={() => togglePrivacyRow('lowdata')}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs flex-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'lowDataSub')}</p>
                <Switch
                  checked={!!settings.lowDataMode}
                  onChange={() => updateSettings({ lowDataMode: !settings.lowDataMode })}
                  label={t(lang, 'lowDataTitle')}
                />
              </div>
            </PrivacyRow>

            {/* AI assistance — data use and consent. */}
            <PrivacyRow id="privacy-ai" icon={Sparkles} label={t(lang, 'privacyRowAi')} open={!!openPrivacyRows.ai} onToggle={() => togglePrivacyRow('ai')}>
              <AiDisclaimer lang={lang} variant="full" className="mb-3" />
              {aiOn ? (
                <button
                  onClick={handleRevokeAi}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 min-h-[44px] text-sm font-medium"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                >
                  <Sparkles size={14} />
                  {t(lang, 'aiRevoke')}
                </button>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'aiCurrentlyOff')}</p>
              )}
            </PrivacyRow>

            {/* Data export — your prayers belong to you. The ONE export surface
                (More links here; no duplicate row elsewhere). */}
            <PrivacyRow id="privacy-export" icon={Download} label={t(lang, 'privacyRowExport')} open={!!openPrivacyRows.export} onToggle={() => togglePrivacyRow('export')}>
              <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'exportDataSub')}</p>
              <button
                onClick={handleExport}
                disabled={prayers.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 min-h-[44px] text-sm font-medium disabled:opacity-40"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
              >
                <Download size={14} />
                {t(lang, 'exportData')}
              </button>
            </PrivacyRow>
          </div>

          {/* Danger zone — irreversible account deletion (right to erasure),
              kept APART at the bottom of the section and gated by ConfirmDialog. */}
          <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '1px solid color-mix(in srgb, var(--danger) 28%, var(--border))' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--danger)' }}>{t(lang, 'dangerZone')}</p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'deleteAccountSub')}</p>
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 min-h-[44px] text-sm font-medium"
              style={{ border: '1px solid color-mix(in srgb, var(--danger) 28%, var(--border))', color: 'var(--danger)', background: 'var(--danger-bg)' }}
            >
              <Trash2 size={14} />
              {t(lang, 'deleteAccount')}
            </button>
          </div>
        </SettingsSection>

        {/* ── Prayer reminders (deep-link id stays `notifications`) ── */}
        <SettingsSection id="notifications" title={t(lang, 'prayerReminders')} icon={Bell} open={openSections.notifications} onToggle={() => toggleSection('notifications')}>
          {/* A few per day — one calm global cap on how many prayers Today asks
              for, so a long list stays coverable. Off = show everything. It used
              to sit on the Plan tab between the day agenda and the plan
              catalogue, which is a content surface, not a place for a standing
              preference. */}
          <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'perDayTitle')}</p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'perDaySub')}</p>
            <div className="flex gap-2 flex-wrap" role="group" aria-label={t(lang, 'perDayTitle')}>
              {CAP_OPTIONS.map((n) => {
                const active = (settings.maxPerDay || null) === n;
                return (
                  <button
                    key={n ?? 'off'}
                    onClick={() => updateSettings({ maxPerDay: n })}
                    aria-pressed={active}
                    className="min-h-[44px] px-4 rounded-xl text-sm font-medium transition-colors"
                    style={active
                      ? { background: 'var(--accent)', color: '#fff', border: '1.5px solid var(--accent)' }
                      : { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
                  >
                    {n ?? t(lang, 'perDayOff')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily + follow-up reminders */}
          <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Bell size={16} style={{ color: 'var(--accent)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'remindersTitle')}</h3>
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
                onClick={() => new Notification('Praystead 🙏', { body: t(lang, 'testNotifBody'), icon: '/favicon.ico' })}
                title={t(lang, 'tipTestNotif')}
                className="w-full mt-3 text-sm py-2 rounded-xl font-medium"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
              >
                {t(lang, 'testNotif')}
              </button>
            )}
          </div>

          {/* Community notification preferences (in-app inbox + push per type) */}
          <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Bell size={16} style={{ color: 'var(--accent)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'notifPrefsTitle')}</h3>
            </div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'notifPrefsSub')}</p>
            <NotificationPreferences />
          </div>
        </SettingsSection>

        {/* ── Appearance & language ── */}
        <SettingsSection id="appearance" title={t(lang, 'settingsSecAppearance')} icon={Sun} open={openSections.appearance} onToggle={() => toggleSection('appearance')}>
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

          {/* Which languages recommended resources may be offered in. The app
              language is always included, so this needs no setup to work. */}
          <ResourceLanguagePref lang={lang} />
        </SettingsSection>

        {/* ── Support & feedback ── */}
        <SettingsSection id="support" title={t(lang, 'settingsSecSupport')} icon={Heart} open={openSections.support} onToggle={() => toggleSection('support')}>
          {/* Feedback */}
          <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
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

          {/* Donate — a true, optional one-time gift. Purely voluntary: a donation
              never unlocks features and the whole app works without it. */}
          <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Heart size={16} style={{ color: 'var(--success)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{t(lang, 'donateTitle')}</h3>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'donateSub')}</p>
            <button
              onClick={() => setShowDonate(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium"
              style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' }}
            >
              <Heart size={14} />
              {t(lang, 'donateBtn')}
            </button>
          </div>
        </SettingsSection>

        <div className="rounded-2xl px-6 py-5 mt-2 text-center" style={{ background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }}>
          <p className="text-sm font-medium italic mb-2 leading-relaxed" style={{ color: 'var(--accent)' }}>{t(lang, 'motto')}</p>
          <p className="text-xs font-medium" style={{ color: 'var(--accent)', opacity: 0.6 }}>James 5:16</p>
        </div>
        <p className="text-center text-xs mt-3" style={{ color: 'var(--text-3)' }}>Praystead v{APP_VERSION}</p>
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
