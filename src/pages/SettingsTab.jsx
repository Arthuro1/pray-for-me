import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import { Bell, BellRing, BookOpen, CalendarClock, CalendarDays, ChevronDown, ChevronRight, ClipboardCheck, Download, Flag, Heart, KeyRound, Lock, LogOut, MessageCircleHeart, MessageSquare, MessageSquareText, Moon, Pencil, RefreshCw, Shield, ShieldCheck, Sun, SunMoon, Sunrise, Trash2, Unlock, WifiOff } from 'lucide-react';
import { t, LANGUAGES } from '../i18n';
import { toast } from '../store/toastStore';
import { confirm } from '../store/confirmStore';
import { dailyReminderStartDay, enablePush, updatePushPrefs, getFollowUpLastSent } from '../push';
import { buildExport } from '../utils/export';
import { nextReminder, nextFollowUp } from '../utils/reminder';
import { normalizeTheme } from '../utils/theme';
import { track, EVENTS } from '../lib/analytics';
import FeedbackModal from '../components/FeedbackModal';
import { canReviewWording } from '../lib/wordingReports';
const WordingReportModal = lazy(() => import('../components/WordingReportModal'));
const WordingReviewModal = lazy(() => import('../components/WordingReviewModal'));
import DonateModal from '../components/DonateModal';
import PrivacyCenter from '../components/PrivacyCenter';
import VaultModal from '../components/VaultModal';
import OriginMigrationGuide from '../components/OriginMigrationGuide';
import { isOriginalAppOrigin } from '../lib/originMigration';
import { originMigrationCopy } from '../lib/originMigrationCopy';
import VaultMigrationStatus from '../components/VaultMigrationStatus';
import AiDisclaimer from '../components/shared/AiDisclaimer';
import NotificationPreferences from '../components/NotificationPreferences';
import Switch from '../components/shared/Switch';
import SettingsRow from '../components/shared/SettingsRow';
import { hasAiConsent, revokeAiConsent } from '../lib/aiConsent';
import useVaultStore from '../store/vaultStore';
import { Input, PageHeader, QuietButton, SecondaryButton, SegmentedControl, StatusLabel } from '../components/shared/Primitives';
import RadioRow from '../components/shared/RadioRow';
import RiseMark from '../components/shared/RiseMark';
import VerseAccordion from '../components/VerseAccordion';
import { localizeRef } from '../content/teaching';
import Avatar from '../components/shared/Avatar';
import AvatarEditor from '../components/shared/AvatarEditor';
import { fetchMyAvatar, saveMyAvatar } from '../lib/profileAvatars';
import { identityPhotoUrlFrom, withIdentityPhoto } from '../lib/identityPhoto';
import { APP_NAME, FILE_PREFIX } from '../lib/brand';

// Version comes from package.json via Vite's `define` (see vite.config.js), so
// the About line never drifts. Fallback keeps it defined outside a Vite build.
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
// The verse the app was named under ("the prayer of a righteous person").
const MOTTO_REF = 'James 5:16';

// When a reminder comes next, said beside the field that sets it.
function NextReminder({ lang, when }) {
  return (
    <span className="settings-next">
      <CalendarClock size={14} aria-hidden="true" /> {t(lang, 'nextReminder')} · {when}
    </span>
  );
}

// One compact row inside Privacy & Security: label + chevron, expanding to the
// full content on demand. Proper disclosure semantics (aria-expanded /
// aria-controls) and a ≥44px row — the section reads as a short list instead
// of a long card stack.
function PrivacyRow({ id, icon: Icon, label, open, onToggle, children }) {
  return (
    <div className="settings-disclosure">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-body`}
        className="settings-disclosure__trigger"
      >
        <Icon size={18} strokeWidth={1.85} aria-hidden="true" />
        <span>{label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <div id={`${id}-body`} hidden={!open} className="settings-disclosure__body">
        {children}
      </div>
    </div>
  );
}

// A setting and its control on one line: the label at the start, the control
// at the end — the control moving under the label where the line is too short.
function InlineRow({ label, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row__main settings-row__main--wrap">
        <p className="settings-row__label">{label}</p>
        {children}
      </div>
    </div>
  );
}

// One destination in a short list (Support): an icon tile, a title, an
// optional line of what it is, and a chevron — the More page's row.
function LinkRow({ icon: Icon, tone, title, description, onClick }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="menu-row menu-row--compact">
        <span className={`icon-tile tone-${tone}`} aria-hidden="true"><Icon size={18} strokeWidth={1.85} /></span>
        <span className="menu-row__body">
          <span className="menu-row__title">{title}</span>
          {description && <span className="menu-row__description">{description}</span>}
        </span>
        <ChevronRight className="rtl-mirror" size={16} aria-hidden="true" />
      </button>
    </li>
  );
}

// A labelled group of settings inside a section, set off by a hairline.
function Group({ title, sub, tone, children }) {
  return (
    <div className="settings-group">
      {title && <h3 className={`settings-group__title ${tone === 'danger' ? 'settings-group__title--danger' : ''}`}>{title}</h3>}
      {sub && <p className="settings-group__sub">{sub}</p>}
      {children}
    </div>
  );
}

// A collapsible, labelled group of settings. Progressive disclosure: the
// heading stays visible so nothing is hidden from discovery, and the panel is
// `hidden` when collapsed so its controls drop out of the tab order too. The
// `id` doubles as the deep-link anchor (e.g. /settings#notifications). Each
// section's icon sits on a tile of its own hue, so the list scans by colour.
function SettingsSection({ id, title, icon: Icon, tone, open, onToggle, children }) {
  return (
    <section id={id} className="settings-section">
      <h2 className="settings-section__heading">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          className="settings-section__trigger"
        >
          <span className={`icon-tile tone-${tone}`} aria-hidden="true"><Icon size={19} strokeWidth={1.85} /></span>
          <span className="settings-section__title">{title}</span>
          <ChevronDown size={18} aria-hidden="true" />
        </button>
      </h2>
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
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="language-picker">
        <span>{active?.flag}</span>
        <span>{active?.label}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="q-menu language-picker__menu">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => { onChange(l.code); setOpen(false); }}
              aria-current={l.code === lang ? 'true' : undefined}
              className="q-menu__item"
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
  const [wordingMode, setWordingMode] = useState(null);
  const [showDonate, setShowDonate] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [vaultMode, setVaultMode] = useState(null); // 'setup' | 'unlock' | 'change' | null
  const [followUpLastSent, setFollowUpLastSent] = useState(null);
  // The user's own avatar preset. Read through the same relationship-scoped RPC
  // as everyone else's (the caller is always allowed to see their own).
  const [myAvatar, setMyAvatar] = useState(null);
  const [editingAvatar, setEditingAvatar] = useState(false);
  // Settings reads as a short list of destinations: every section starts
  // collapsed and opens on demand. A deep-link (below) force-opens its target.
  // Privacy & Security is ONE consolidated section (visibility, vault,
  // notification previews, AI consent, export, deletion) — reachable from More.
  const [openSections, setOpenSections] = useState({
    privacy: false, notifications: false, appearance: false, support: false,
  });
  const toggleSection = (key) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  // Privacy & Security's internal rows start compact too — each expands alone.
  const [openPrivacyRows, setOpenPrivacyRows] = useState({});
  const togglePrivacyRow = (key) => setOpenPrivacyRows((s) => ({ ...s, [key]: !s[key] }));

  const lang = settings.language || 'fr';
  // Derived from synced settings so consent granted/revoked anywhere (another
  // tab, another browser) is reflected here without a remount.
  const aiOn = hasAiConsent('prayer') || hasAiConsent('home');

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

  const handleLockVault = async () => {
    await lockVault(user?.id);
    toast.success(t(lang, 'vaultLockedToast'));
  };

  const handleToggleNotifications = async () => {
    if (!settings.dailyReminderEnabled) {
      // Flip the preference immediately so the switch responds, then enable push
      // as best-effort. Only an explicit permission denial reverts it.
      updateSettings({ dailyReminderEnabled: true });
      track(EVENTS.REMINDER_SET, { method: 'daily' });
      const lastDailySentOn = dailyReminderStartDay(settings.dailyReminderTime);
      let res;
      try { res = await enablePush(user?.id, { reminderTime: settings.dailyReminderTime, lang, enabled: true, lastDailySentOn }); }
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
        try { await updatePushPrefs(user?.id, { reminderTime: settings.dailyReminderTime, lang, enabled: true, lastDailySentOn }); } catch { /* best-effort */ }
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
    a.download = `${FILE_PREFIX}-export-${new Date().toISOString().slice(0, 10)}.json`;
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
  const signedInLabel = user?.app_metadata?.provider === 'google'
    ? t(lang, 'signedInWith', { provider: 'Google' })
    : t(lang, 'signedInByEmail');
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0];
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(lang, { month: 'long', year: 'numeric' })
    : null;
  const nextDaily = nextReminder(settings.dailyReminderTime);
  const dailyNextLabel = `${t(lang, nextDaily.tomorrow ? 'tomorrow' : 'today')} ${nextDaily.time}`;
  const nextFollow = nextFollowUp(followUpLastSent, settings.followUpDays, settings.followUpTime);
  const followUpDay = nextFollow.daysAhead === 0
    ? t(lang, 'today')
    : nextFollow.daysAhead === 1
      ? t(lang, 'tomorrow')
      : nextFollow.date.toLocaleDateString(lang, { month: 'short', day: 'numeric' });
  const followUpNextLabel = `${followUpDay} ${nextFollow.time}`;

  return (
    <div className="phase-page">
      <div className="phase-page__shell">
        <PageHeader
          title={t(lang, 'settings')}
          backTo="/more"
          backLabel={t(lang, 'moreTab')}
          backAriaLabel={`${t(lang, 'backBtn')}: ${t(lang, 'moreTab')}`}
        />
      </div>

      <div className="phase-content max-w-3xl">
        {/* Who you are, once: the image, the name, the email — and, in the
            card's footer, how you signed in and the way out. The image's three
            controls stay folded behind Edit — deliberately not a profile screen. */}
        {/* `account` keeps old /settings#account deep-links landing here. */}
        <div id="account" className="settings-profile">
          <div className="settings-profile__main">
            <span className="settings-profile__avatar">
              <Avatar name={displayName || ''} avatar={myAvatar} size={60} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="settings-profile__name">{displayName}</p>
              <p className="q-meta truncate">{user?.email}</p>
              {memberSince && (
                <p className="settings-profile__since">
                  <CalendarDays size={12} aria-hidden="true" /> {t(lang, 'memberSince')} {memberSince}
                </p>
              )}
            </div>
            <QuietButton
              icon={Pencil}
              iconSize={15}
              onClick={() => setEditingAvatar((v) => !v)}
              aria-expanded={editingAvatar}
              aria-controls="settings-avatar"
              aria-label={`${t(lang, 'edit')} — ${t(lang, 'profileAvatar')}`}
              className="settings-profile__edit shrink-0"
            >
              {t(lang, 'edit')}
            </QuietButton>
          </div>
          <div className="settings-profile__account">
            <p className="settings-profile__provider">
              <KeyRound size={15} aria-hidden="true" />
              <span>{signedInLabel}</span>
            </p>
            <SecondaryButton icon={LogOut} iconSize={16} onClick={signOut} title={t(lang, 'tipSignOut')} className="settings-profile__signout">
              {t(lang, 'signOut')}
            </SecondaryButton>
          </div>
        </div>
        {editingAvatar && (
          <div id="settings-avatar" className="settings-avatar">
            <p className="settings-group__sub">{t(lang, 'profileAvatarHint')}</p>
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
        )}

        <div className="settings-sections">
          {/* ── Privacy & Security — the ONE consolidated destination. Inside, a
              compact list of disclosure ROWS instead of a long card stack; only
              Delete account stays apart, at the bottom. ── */}
          <SettingsSection id="privacy" title={t(lang, 'privacySecurity')} icon={ShieldCheck} tone="teal" open={openSections.privacy} onToggle={() => toggleSection('privacy')}>
            <div className="settings-disclosures">
              {/* Privacy Center — plain-language explanation of storage & sharing.
                  Basic privacy is free for everyone; this is never gated. */}
              <PrivacyRow id="privacy-overview" icon={ShieldCheck} label={t(lang, 'privacyRowOverview')} open={!!openPrivacyRows.overview} onToggle={() => togglePrivacyRow('overview')}>
                <p className="settings-group__sub">{t(lang, 'privacyCenterSub')}</p>
                <SecondaryButton icon={ShieldCheck} iconSize={16} onClick={() => setShowPrivacy(true)}>{t(lang, 'privacyCenterBtn')}</SecondaryButton>
                {isOriginalAppOrigin() && (
                  <div lang={originMigrationCopy(lang).lang} dir="ltr" className="mt-3">
                    <SecondaryButton onClick={() => setShowMigration(true)}>{originMigrationCopy(lang).copy.open}</SecondaryButton>
                  </div>
                )}
              </PrivacyRow>

              {/* Prayer Vault */}
              <PrivacyRow id="privacy-vault" icon={vaultInitialized && !vaultUnlocked ? Lock : Shield} label={t(lang, 'privacyRowVault')} open={!!openPrivacyRows.vault} onToggle={() => togglePrivacyRow('vault')}>
                <p className="settings-group__sub">
                  {t(lang, 'vaultManageSub')}
                  {vaultInitialized && (
                    <StatusLabel tone="royal" className="ms-2">{t(lang, vaultUnlocked ? 'vaultStatusUnlocked' : 'vaultStatusLocked')}</StatusLabel>
                  )}
                </p>

                {!vaultInitialized && (
                  <SecondaryButton icon={Shield} iconSize={16} onClick={() => setVaultMode('setup')}>
                    {t(lang, vaultUnlocked ? 'backupKeyCta' : 'vaultSetup')}
                  </SecondaryButton>
                )}

                {vaultInitialized && !vaultUnlocked && (
                  <SecondaryButton icon={Unlock} iconSize={16} onClick={() => setVaultMode('unlock')}>{t(lang, 'vaultUnlock')}</SecondaryButton>
                )}

                {vaultInitialized && vaultUnlocked && (
                  <>
                    <div className="settings-actions">
                      <SecondaryButton icon={Lock} iconSize={16} onClick={handleLockVault}>{t(lang, 'vaultLockNow')}</SecondaryButton>
                      <SecondaryButton icon={KeyRound} iconSize={16} onClick={() => setVaultMode('change')}>{t(lang, 'vaultChangePass')}</SecondaryButton>
                      <SecondaryButton icon={RefreshCw} iconSize={16} onClick={() => setVaultMode('rotate')}>{t(lang, 'vaultRotateCode')}</SecondaryButton>
                    </div>
                    <VaultMigrationStatus lang={lang} />
                  </>
                )}
              </PrivacyRow>

              {/* Notification privacy — what a push may reveal. Native radios; the
                  choice syncs account-wide and every scheduler honours it. Generic
                  previews stay the safest default. */}
              <PrivacyRow id="privacy-notif" icon={Bell} label={t(lang, 'privacyRowNotif')} open={!!openPrivacyRows.notif} onToggle={() => togglePrivacyRow('notif')}>
                <p className="settings-group__sub">{t(lang, 'notifPreviewSub')}</p>
                <div role="radiogroup" aria-label={t(lang, 'notifPreviewTitle')} className="grid gap-2">
                  {[
                    { value: 'generic', labelKey: 'notifPreviewGeneric' },
                    { value: 'count', labelKey: 'notifPreviewCount' },
                  ].map(({ value, labelKey }) => (
                    <RadioRow
                      key={value}
                      id={`notification-detail-${value}`}
                      name="notification-detail"
                      label={t(lang, labelKey)}
                      checked={(settings.notificationDetail || 'generic') === value}
                      onChange={() => {
                        updateSettings({ notificationDetail: value });
                        updatePushPrefs(user?.id, { notificationDetail: value }).catch(() => { /* best-effort */ });
                      }}
                    />
                  ))}
                </div>
              </PrivacyRow>

              {/* Low data mode — device-local; defers nonessential fetches only. */}
              <PrivacyRow id="privacy-lowdata" icon={WifiOff} label={t(lang, 'privacyRowLowData')} open={!!openPrivacyRows.lowdata} onToggle={() => togglePrivacyRow('lowdata')}>
                <div className="settings-row__main">
                  <p className="settings-row__sub">{t(lang, 'lowDataSub')}</p>
                  <Switch
                    checked={!!settings.lowDataMode}
                    onChange={() => updateSettings({ lowDataMode: !settings.lowDataMode })}
                    label={t(lang, 'lowDataTitle')}
                  />
                </div>
              </PrivacyRow>

              {/* AI assistance — data use and consent. */}
              <PrivacyRow id="privacy-ai" icon={MessageSquareText} label={t(lang, 'privacyRowAi')} open={!!openPrivacyRows.ai} onToggle={() => togglePrivacyRow('ai')}>
                <AiDisclaimer lang={lang} variant="full" className="mb-4" />

                {/* Outgoing-data preferences (mirrored from the per-request preview).
                    The title is always sent; description is opt-in. */}
                <SettingsRow label={t(lang, 'aiDataPrefsTitle')} sub={t(lang, 'aiDataPrefsSub')} />
                <SettingsRow
                  label={t(lang, 'aiPreviewIncludeDescription')}
                  enabled={settings.aiSendDescription}
                  onToggle={() => updateSettings({ aiSendDescription: !settings.aiSendDescription })}
                />

                {aiOn ? (
                  <SecondaryButton onClick={handleRevokeAi} className="mt-4">{t(lang, 'aiRevoke')}</SecondaryButton>
                ) : (
                  <p className="q-meta mt-4">{t(lang, 'aiCurrentlyOff')}</p>
                )}
              </PrivacyRow>

              {/* Data export — your prayers belong to you. The ONE export surface
                  (More links here; no duplicate row elsewhere). */}
              <PrivacyRow id="privacy-export" icon={Download} label={t(lang, 'privacyRowExport')} open={!!openPrivacyRows.export} onToggle={() => togglePrivacyRow('export')}>
                <p className="settings-group__sub">{t(lang, 'exportDataSub')}</p>
                <SecondaryButton icon={Download} iconSize={16} onClick={handleExport} disabled={prayers.length === 0}>{t(lang, 'exportData')}</SecondaryButton>
              </PrivacyRow>
            </div>

            {/* Danger zone — irreversible account deletion (right to erasure),
                kept APART at the bottom of the section and gated by ConfirmDialog. */}
            <Group title={t(lang, 'dangerZone')} sub={t(lang, 'deleteAccountSub')} tone="danger">
              <SecondaryButton icon={Trash2} iconSize={16} danger onClick={handleDeleteAccount}>{t(lang, 'deleteAccount')}</SecondaryButton>
            </Group>
          </SettingsSection>

          {/* ── Prayer reminders (deep-link id stays `notifications`) ── */}
          <SettingsSection id="notifications" title={t(lang, 'prayerReminders')} icon={Bell} tone="amber" open={openSections.notifications} onToggle={() => toggleSection('notifications')}>
            {/* Daily + follow-up reminders: one card, each reminder a row with
                its switch, and — once on — its time beside when it comes next. */}
            <Group title={t(lang, 'remindersTitle')}>
              <div className="settings-card">
                <SettingsRow icon={Sunrise} tone="amber" label={t(lang, 'dailyReminder')} sub={t(lang, 'dailyReminderSub')} enabled={settings.dailyReminderEnabled} onToggle={handleToggleNotifications}>
                  {settings.dailyReminderEnabled && (
                    <div className="settings-row__extra settings-inline-fields">
                      <Input
                        type="time"
                        aria-label={t(lang, 'dailyReminder')}
                        value={settings.dailyReminderTime}
                        onChange={(e) => handleReminderTimeChange(e.target.value)}
                        className="w-auto"
                      />
                      <NextReminder lang={lang} when={dailyNextLabel} />
                    </div>
                  )}
                </SettingsRow>

                <SettingsRow icon={MessageCircleHeart} tone="teal" label={t(lang, 'followUp')} sub={t(lang, 'followUpSub')} enabled={settings.followUpEnabled} onToggle={handleToggleFollowUp}>
                  {settings.followUpEnabled && (
                    <div className="settings-row__extra settings-inline-fields">
                      <select
                        aria-label={t(lang, 'followUp')}
                        value={settings.followUpDays}
                        onChange={(e) => handleFollowUpDaysChange(parseInt(e.target.value))}
                        className="q-input w-auto"
                      >
                        <option value={3}>{t(lang, 'every3days')}</option>
                        <option value={7}>{t(lang, 'everyWeek')}</option>
                        <option value={14}>{t(lang, 'every2weeks')}</option>
                        <option value={30}>{t(lang, 'everyMonth')}</option>
                      </select>
                      <Input
                        type="time"
                        aria-label={t(lang, 'followUp')}
                        value={settings.followUpTime || '07:00'}
                        onChange={(e) => handleFollowUpTimeChange(e.target.value)}
                        className="w-auto"
                      />
                      <NextReminder lang={lang} when={followUpNextLabel} />
                    </div>
                  )}
                </SettingsRow>
              </div>

              {settings.notificationsGranted && (
                <QuietButton
                  icon={BellRing}
                  iconSize={15}
                  onClick={() => new Notification(APP_NAME, { body: t(lang, 'testNotifBody'), icon: '/favicon.ico' })}
                  title={t(lang, 'tipTestNotif')}
                  className="-ms-3 mt-2"
                >
                  {t(lang, 'testNotif')}
                </QuietButton>
              )}
            </Group>

            {/* Community notification preferences (in-app inbox, push, quiet hours) */}
            <Group title={t(lang, 'notifPrefsTitle')} sub={t(lang, 'notifPrefsSub')}>
              <NotificationPreferences />
            </Group>
          </SettingsSection>

          {/* ── Appearance & language ── */}
          <SettingsSection id="appearance" title={t(lang, 'settingsSecAppearance')} icon={Sun} tone="sky" open={openSections.appearance} onToggle={() => toggleSection('appearance')}>
            <InlineRow label={t(lang, 'appearance')}>
              <SegmentedControl
                label={t(lang, 'appearance')}
                value={normalizeTheme(settings.theme)}
                onChange={(value) => updateSettings({ theme: value })}
                options={[
                  { value: 'light', label: t(lang, 'themeLight'), icon: Sun },
                  { value: 'dark', label: t(lang, 'themeDark'), icon: Moon },
                  { value: 'system', label: t(lang, 'themeSystem'), icon: SunMoon },
                ]}
              />
            </InlineRow>

            <InlineRow label={t(lang, 'language')}>
              <LanguageDropdown
                lang={lang}
                onChange={(code) => { updateSettings({ language: code }); updatePushPrefs(user?.id, { lang: code }); }}
              />
            </InlineRow>
          </SettingsSection>

          {/* ── Support & feedback — a short list of places to go. The donation
              is a true, optional one-time gift: it never unlocks features and
              the whole app works without it. ── */}
          <SettingsSection id="support" title={t(lang, 'settingsSecSupport')} icon={Heart} tone="rose" open={openSections.support} onToggle={() => toggleSection('support')}>
            <ul className="menu-list">
              {user?.id && !user.is_anonymous && (
                <LinkRow icon={Flag} tone="indigo" title={t(lang, 'wordingReport')} onClick={() => setWordingMode('report')} />
              )}
              {user?.id && !user.is_anonymous && canReviewWording(user) && (
                <LinkRow icon={ClipboardCheck} tone="plum" title={t(lang, 'wordingReview')} onClick={() => setWordingMode('review')} />
              )}
              <LinkRow icon={MessageSquare} tone="teal" title={t(lang, 'feedbackTitle')} description={t(lang, 'feedbackSub')} onClick={() => setShowFeedback(true)} />
              <LinkRow icon={Heart} tone="rose" title={t(lang, 'donateTitle')} description={t(lang, 'donateSub')} onClick={() => setShowDonate(true)} />
            </ul>
          </SettingsSection>
        </div>

        {/* The verse behind the app, by reference: its words come from the
            reader's own Bible through the verse pipeline, never from our copy. */}
        <footer className="settings-footer">
          <RiseMark animate={false} size={24} />
          <VerseAccordion reference={localizeRef(MOTTO_REF, lang)} lang={lang} className="settings-footer__verse">
            {({ toggle, expanded }) => (
              <button type="button" onClick={toggle} aria-expanded={expanded} className="scripture-ref">
                <BookOpen size={13} aria-hidden="true" /> {localizeRef(MOTTO_REF, lang)}
              </button>
            )}
          </VerseAccordion>
          <p className="q-meta">{APP_NAME} v{APP_VERSION}</p>
        </footer>
      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {wordingMode && <Suspense fallback={<p role="status">{t(lang, 'wordingLoading')}</p>}>
        {wordingMode === 'report' ? <WordingReportModal key={lang} lang={lang} onClose={() => setWordingMode(null)} /> : <WordingReviewModal lang={lang} onClose={() => setWordingMode(null)} />}
      </Suspense>}
      {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}
      {showPrivacy && <PrivacyCenter lang={lang} onClose={() => setShowPrivacy(false)} />}
      {showMigration && <OriginMigrationGuide lang={lang} onClose={() => setShowMigration(false)} />}
      {vaultMode && (
        <VaultModal lang={lang} initialMode={vaultMode} userId={user?.id} onClose={() => setVaultMode(null)} />
      )}
    </div>
  );
}
