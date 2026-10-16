import { useShallow } from 'zustand/react/shallow';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import { dailyReminderStartDay, enablePush, updatePushPrefs } from '../push';
import { track, EVENTS } from '../lib/analytics';
import { toast } from '../store/toastStore';
import { t } from '../i18n';

// Turns the daily reminder on for the account and asks THIS device for push
// permission — the Settings switch and Today's notifications card share it.
// The preference flips first so the switch responds; only an explicit
// permission denial reverts it. Resolves to 'on', 'denied' or 'unavailable'
// (reminder saved, but this device can't deliver push).
export default function useTurnOnReminders() {
  const { settings, updateSettings } = usePrayerStore(
    useShallow((s) => ({ settings: s.settings, updateSettings: s.updateSettings }))
  );
  const userId = useAuthStore((s) => s.user?.id);
  const lang = settings.language || 'fr';

  return async function turnOnReminders() {
    updateSettings({ dailyReminderEnabled: true });
    track(EVENTS.REMINDER_SET, { method: 'daily' });
    const reminder = {
      reminderTime: settings.dailyReminderTime,
      lang,
      enabled: true,
      lastDailySentOn: dailyReminderStartDay(settings.dailyReminderTime),
    };

    let res;
    try { res = await enablePush(userId, reminder); }
    catch { res = { error: 'failed' }; }

    if (res?.error === 'denied') {
      updateSettings({ dailyReminderEnabled: false });
      toast.error(t(lang, 'pushDenied'));
      return 'denied';
    }
    if (res?.error) {
      // In-app reminders still show while the app is open (e.g. a dev server
      // with no service worker).
      toast.info(t(lang, 'pushUnavailable'));
    } else {
      updateSettings({ notificationsGranted: true });
      toast.success(t(lang, 'remindersOn'));
    }
    // The reminder is account-level: align every other signed-in device's
    // subscription row too (enablePush only wrote this one's).
    try { await updatePushPrefs(userId, reminder); } catch { /* best-effort */ }
    return res?.error ? 'unavailable' : 'on';
  };
}
