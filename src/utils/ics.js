import { toRRule } from '../lib/schedule';

// Builds an iCalendar (RFC 5545) file from the user's prayer schedule so it
// can live inside Google/Apple/Outlook calendars too. Pure (no I/O): the
// caller turns the string into a download. All-day events by design — the app
// thinks in days and soft slots, not clock times.

function esc(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

const dayBasic = (key) => key.replace(/-/g, ''); // 2026-07-14 → 20260714

function vevent({ uid, day, title, description, rrule }) {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dayBasic(day)}T000000Z`,
    `DTSTART;VALUE=DATE:${dayBasic(day)}`,
    `SUMMARY:${esc(title)}`,
  ];
  if (description) lines.push(`DESCRIPTION:${esc(description)}`);
  if (rrule) lines.push(`RRULE:${rrule}`);
  lines.push('END:VEVENT');
  return lines;
}

// prayers: personal prayers (only those with a schedule are exported).
// commitments: group prayer-chain claims [{ id, day, title, group_name }].
export function buildICS(prayers = [], commitments = []) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pray4Me//Prayer Schedule//EN',
    'CALSCALE:GREGORIAN',
  ];
  for (const p of prayers) {
    const s = p.schedule;
    if (!s || p.status !== 'active') continue;
    const day = s.type === 'once' ? s.date : s.startDate;
    if (!day) continue;
    lines.push(...vevent({
      uid: `${p.id}@pray4me.space`,
      day,
      title: `🙏 ${p.title}`,
      description: p.description,
      rrule: toRRule(s),
    }));
  }
  for (const c of commitments) {
    lines.push(...vevent({
      uid: `commitment-${c.id}@pray4me.space`,
      day: c.day,
      title: `🙏 ${c.title}`,
      description: c.group_name,
    }));
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}
