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
      setTimeout(() => {
        new Notification('📋 Pray4Me — Suivi de prière', {
          body: `${stalePrayers.length} prière(s) n'ont pas été mises à jour depuis ${settings.followUpDays} jours. Comment Dieu agit-il?`,
          icon: '/favicon.ico',
          tag: 'follow-up',
        });
      }, 5000);
    }
  }

  // Call reminders
  if (settings.callReminderEnabled) {
    const prayersForOthers = prayers.filter(
      (p) => p.status === 'active' && p.for_other && p.phone
    );

    if (prayersForOthers.length > 0) {
      setTimeout(() => {
        const p = prayersForOthers[0];
        new Notification('📞 Pray4Me — Rappel d\'appel', {
          body: `Pensez à appeler ${p.person_name} pour encourager et partager votre prière pour eux.`,
          icon: '/favicon.ico',
          tag: 'call-reminder',
        });
      }, 10000);
    }
  }
}
