export function scheduleNotifications(settings, prayers, categories) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  // Daily reminder
  if (settings.dailyReminderEnabled && settings.dailyReminderTime) {
    const [h, m] = settings.dailyReminderTime.split(':').map(Number);
    const now = new Date();
    const next = new Date();
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);

    const delay = next - now;
    setTimeout(() => {
      const today = new Date().getDay();
      const todayCatIds = categories
        .filter((c) => (c.week_days || []).includes(today))
        .map((c) => c.id);

      const todaysPrayers = prayers.filter(
        (p) => p.status === 'active' && todayCatIds.includes(p.category_id)
      );

      new Notification('🙏 Pray For Me — Heure de prière!', {
        body: todaysPrayers.length > 0
          ? `Vous avez ${todaysPrayers.length} sujets de prière pour aujourd'hui. "Priez sans cesse" — 1 Thess 5:17`
          : 'Prenez un moment pour communier avec Dieu aujourd\'hui.',
        icon: '/favicon.ico',
        tag: 'daily-reminder',
      });
    }, delay);
  }

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
        new Notification('📋 Pray For Me — Suivi de prière', {
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
        new Notification('📞 Pray For Me — Rappel d\'appel', {
          body: `Pensez à appeler ${p.person_name} pour encourager et partager votre prière pour eux.`,
          icon: '/favicon.ico',
          tag: 'call-reminder',
        });
      }, 10000);
    }
  }
}
