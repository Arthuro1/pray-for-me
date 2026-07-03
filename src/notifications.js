import { t } from './i18n';

export function scheduleNotifications(settings, prayers) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  // The daily reminder is now delivered server-side via Web Push (works even
  // when the app is closed), so it is intentionally not scheduled here.

  // Follow-up reminders
  if (settings.followUpEnabled && settings.followUpDays) {
    const stalePrayers = prayers.filter((p) => {
      if (p.status !== 'active') return false;
      const lastActivity = p.updated_at || p.created_at;
      const daysSince = (Date.now() - new Date(lastActivity)) / (1000 * 60 * 60 * 24);
      return daysSince >= settings.followUpDays;
    });

    if (stalePrayers.length > 0) {
      const lang = settings.language || 'en';
      const MAX_LISTED_TITLES = 5;
      const titles = stalePrayers.map((p) => (p.title || '').trim()).filter(Boolean);
      const titleSuffix = titles.length
        ? `: ${titles.slice(0, MAX_LISTED_TITLES).join(', ')}${titles.length > MAX_LISTED_TITLES ? '…' : ''}`
        : '';
      setTimeout(() => {
        new Notification(`📋 Pray4Me — ${t(lang, 'followUp')}`, {
          body: t(lang, 'followUpNotifBody', { count: stalePrayers.length, days: settings.followUpDays, titles: titleSuffix }),
          icon: '/favicon.ico',
          tag: 'follow-up',
        });
      }, 5000);
    }
  }
}
