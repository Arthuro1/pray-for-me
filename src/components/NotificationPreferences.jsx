import { useEffect, useState, useCallback } from 'react';
import { Inbox, Loader2, MoonStar, Smartphone } from 'lucide-react';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import { fetchNotificationPrefs, savePref, currentTimezone } from '../lib/notificationPrefs';
import { subscribeDeviceForPush } from '../push';
import { toast } from '../store/toastStore';
import { t } from '../i18n';
import { Input } from './shared/Primitives';
import SettingsRow from './shared/SettingsRow';

// Account-level notification preferences: master in-app / push toggles and
// quiet hours (in the device's IANA timezone). Per-type delivery choices are
// no longer offered here; any a user saved earlier still apply on the server.
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
      <div className="q-loading">
        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="settings-card">
      <SettingsRow
        icon={Inbox}
        tone="plum"
        enabled={inAppOn}
        onToggle={() => persist('_account', { in_app_enabled: !inAppOn }, { in_app_enabled: !inAppOn })}
        label={t(lang, 'notifInApp')}
        sub={t(lang, 'notifInAppSub')}
      />
      <SettingsRow
        icon={Smartphone}
        tone="indigo"
        enabled={pushOn}
        onToggle={togglePush}
        label={t(lang, 'notifPush')}
        sub={t(lang, 'notifPushSub')}
      />

      {/* Quiet hours: push waits until morning; the inbox still fills. */}
      <SettingsRow icon={MoonStar} tone="sky" label={t(lang, 'quietHours')} sub={t(lang, 'quietHoursSub')}>
        <div className="settings-row__extra">
          <div className="settings-times">
            <label>
              <span>{t(lang, 'quietFrom')}</span>
              <Input
                type="time"
                value={acct.quiet_hours_start || ''}
                onChange={(e) => persist('_account', { quiet_hours_start: e.target.value || null, timezone: tz }, { quiet_hours_start: e.target.value })}
                className="w-auto"
              />
            </label>
            <label>
              <span>{t(lang, 'quietTo')}</span>
              <Input
                type="time"
                value={acct.quiet_hours_end || ''}
                onChange={(e) => persist('_account', { quiet_hours_end: e.target.value || null, timezone: tz }, { quiet_hours_end: e.target.value })}
                className="w-auto"
              />
            </label>
          </div>
          {tz && <p className="q-meta mt-2">{t(lang, 'timezone')}: {tz}</p>}
        </div>
      </SettingsRow>
    </div>
  );
}
