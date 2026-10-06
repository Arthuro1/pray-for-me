export type DailyReminderSubscription = {
  timezone?: string | null;
  tz_offset?: number | null;
  reminder_time?: string | null;
  last_daily_sent_on?: string | null;
};

type ReminderClock = { dayKey: string; minutes: number };

const pad = (value: number) => String(value).padStart(2, '0');

function clockFromOffset(now: Date, offsetMinutes: number): ReminderClock {
  const local = new Date(now.getTime() + offsetMinutes * 60_000);
  return {
    dayKey: `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`,
    minutes: local.getUTCHours() * 60 + local.getUTCMinutes(),
  };
}

// Resolve the subscription's real local calendar clock. The IANA zone is the
// primary source because it follows daylight-saving changes; tz_offset remains
// a compatibility fallback for older subscriptions.
export function localReminderClock(now: Date, sub: DailyReminderSubscription): ReminderClock {
  if (sub.timezone) {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: sub.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(now);
      const part = (type: string) => parts.find((item) => item.type === type)?.value;
      const year = Number(part('year'));
      const month = Number(part('month'));
      const day = Number(part('day'));
      const hour = Number(part('hour'));
      const minute = Number(part('minute'));
      if ([year, month, day, hour, minute].every(Number.isFinite)) {
        return {
          dayKey: `${year}-${pad(month)}-${pad(day)}`,
          minutes: hour * 60 + minute,
        };
      }
    } catch {
      // Invalid/missing browser timezone: use the stored fixed offset below.
    }
  }
  return clockFromOffset(now, Number(sub.tz_offset) || 0);
}

function reminderMinutes(value: string | null | undefined): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '07:00'));
  const hour = Number(match?.[1]);
  const minute = Number(match?.[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
    ? hour * 60 + minute
    : 7 * 60;
}

// A reminder becomes due at the requested local minute and remains retryable
// for the rest of that local day. A successful push stamps the day key, making
// later cron passes idempotent. This avoids both missed windows and duplicates.
export function dailyReminderDue(
  sub: DailyReminderSubscription,
  now: Date,
): { due: boolean; dayKey: string } {
  const clock = localReminderClock(now, sub);
  const lastSentDay = sub.last_daily_sent_on ? String(sub.last_daily_sent_on).slice(0, 10) : null;
  return {
    dayKey: clock.dayKey,
    due: lastSentDay !== clock.dayKey && clock.minutes >= reminderMinutes(sub.reminder_time),
  };
}
