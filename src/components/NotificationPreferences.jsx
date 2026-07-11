import { useEffect, useState, useCallback } from 'react';
import { BellRing, Moon, Loader2 } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import { fetchNotificationPrefs, savePref, currentTimezone, NOTIF_TYPES, defaultMode } from '../lib/notificationPrefs';
import { subscribeDeviceForPush } from '../push';
import { toast } from '../store/toastStore';
import { t } from '../i18n';

const TYPE_LABEL = {
  friend_request: 'notifFriendRequest',
  group_invitation: 'notifGroupInvitation',
  community_update: 'notifCommunityUpdate',
  answered: 'notifAnswered',
  reaction_bucket: 'notifReaction',
  group_prayer_added: 'notifGroupPrayerAdded',
  testimony: 'notifTestimony',
};

function Toggle({ enabled, onToggle, label, sub }) {
  return (
    <button onClick={onToggle} className="flex items-start justify-between gap-3 w-full py-2.5 text-left">
      <span className="min-w-0">
        <span className="block text-sm" style={{ color: 'var(--text-1)' }}>{label}</span>
        {sub && <span className="block text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</span>}
      </span>
      <span className="shrink-0 w-10 h-6 rounded-full p-0.5 transition-colors mt-0.5" style={{ background: enabled ? 'var(--accent)' : 'var(--input-border)' }}>
        <span className="block w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: enabled ? 'translateX(16px)' : 'translateX(0)' }} />
      </span>
    </button>
  );
}

// Account-level notification preferences: master in-app / push toggles, quiet
// hours (in the device's IANA timezone), and a per-type delivery mode.
export default function NotificationPreferences() {
  const lang = usePrayerStore((s) => s.settings.language || 'fr');
  const { user } = useAuthStore();
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const tz = currentTimezone();

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setPrefs(await fetchNotificationPrefs(user.id));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  // Local, optimistic pref lookup with sensible defaults.
  const acct = prefs._account || {};
  const inAppOn = acct.in_app_enabled !== false;
  const pushOn = acct.push_enabled !== false;

  const persist = async (type, patch, optimistic) => {
    setPrefs((p) => ({ ...p, [type]: { ...(p[type] || {}), ...optimistic } }));
    const { error } = await savePref(user.id, type, patch);
    if (error) { toast.error(t(lang, 'errorGeneric')); load(); }
  };

  const modeFor = (type) => prefs[type]?.delivery_mode || defaultMode(type);

  // The push master switch does two things: persist the account-level preference
  // AND make sure this device actually holds a Web Push subscription. Writing the
  // preference alone (the old behaviour) left users with no push endpoint, so
  // notifications only ever appeared in-app — never as a system notification.
  const togglePush = async () => {
    const next = !pushOn;
    persist('_account', { push_enabled: next }, { push_enabled: next });
    if (!next) return; // turning off: keep the subscription; the pref gates delivery
    const res = await subscribeDeviceForPush(user.id, { lang });
    if (res?.error === 'denied') {
      // Browser blocked notifications — revert the switch so it reflects reality.
      persist('_account', { push_enabled: false }, { push_enabled: false });
      toast.error(t(lang, 'pushDenied'));
    } else if (res?.error) {
      // Can't subscribe on this device (e.g. dev server with no service worker);
      // the preference still stands so another device can deliver.
      toast.info(t(lang, 'pushUnavailable'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-3)' }} />
      </div>
    );
  }

  return (
    <div>
      <Toggle
        enabled={inAppOn}
        onToggle={() => persist('_account', { in_app_enabled: !inAppOn }, { in_app_enabled: !inAppOn })}
        label={t(lang, 'notifInApp')}
        sub={t(lang, 'notifInAppSub')}
      />
      <Toggle
        enabled={pushOn}
        onToggle={togglePush}
        label={t(lang, 'notifPush')}
        sub={t(lang, 'notifPushSub')}
      />

      {/* Quiet hours */}
      <div className="py-3 border-t mt-1" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Moon size={14} style={{ color: 'var(--text-3)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{t(lang, 'quietHours')}</span>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'quietHoursSub')}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'quietFrom')}</label>
          <input
            type="time"
            value={acct.quiet_hours_start || ''}
            onChange={(e) => persist('_account', { quiet_hours_start: e.target.value || null, timezone: tz }, { quiet_hours_start: e.target.value })}
            className="text-sm rounded-lg px-3 py-1.5 focus:outline-none"
            style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
          />
          <label className="text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'quietTo')}</label>
          <input
            type="time"
            value={acct.quiet_hours_end || ''}
            onChange={(e) => persist('_account', { quiet_hours_end: e.target.value || null, timezone: tz }, { quiet_hours_end: e.target.value })}
            className="text-sm rounded-lg px-3 py-1.5 focus:outline-none"
            style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
          />
        </div>
        {tz && <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'timezone')}: {tz}</p>}
      </div>

      {/* Per-type delivery mode */}
      <div className="py-2 border-t mt-1" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-2 mt-1">
          <BellRing size={14} style={{ color: 'var(--text-3)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{t(lang, 'notifByType')}</span>
        </div>
        <div className="space-y-1.5">
          {NOTIF_TYPES.map((type) => (
            <div key={type} className="flex items-center justify-between gap-3 py-1.5">
              <span className="text-sm min-w-0 truncate" style={{ color: 'var(--text-2)' }}>{t(lang, TYPE_LABEL[type])}</span>
              <select
                value={modeFor(type)}
                onChange={(e) => persist(type, { delivery_mode: e.target.value }, { delivery_mode: e.target.value })}
                aria-label={t(lang, TYPE_LABEL[type])}
                className="text-xs rounded-lg px-2 py-1.5 focus:outline-none shrink-0"
                style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)', color: 'var(--text-1)' }}
              >
                <option value="immediate">{t(lang, 'modeImmediate')}</option>
                <option value="digest">{t(lang, 'modeDigest')}</option>
                <option value="off">{t(lang, 'modeOff')}</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
