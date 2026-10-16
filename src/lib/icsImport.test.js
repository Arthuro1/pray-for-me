import { describe, expect, it } from 'vitest';
import { looksLikeCalendar, readCalendar, resolveZone } from './icsImport';
import { buildMeetingICS } from '../utils/ics';

const TODAY = '2026-10-16'; // a Friday
const NOW = new Date('2026-10-16T10:00:00Z');
const PARIS = { now: NOW, todayKey: TODAY, timeZone: 'Europe/Paris' };

const calendar = (...events) => ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events.flat(), 'END:VCALENDAR'].join('\r\n');
const vevent = (...lines) => ['BEGIN:VEVENT', ...lines, 'END:VEVENT'];

describe('reading a calendar event into the meeting form', () => {
  it('reads a Google Calendar weekly meeting with its Meet link and length', () => {
    const text = calendar(vevent(
      'DTSTART;TZID=Europe/Paris:20261006T200000',
      'DTEND;TZID=Europe/Paris:20261006T213000',
      'RRULE:FREQ=WEEKLY;BYDAY=TU',
      'UID:abc@google.com',
      'X-GOOGLE-CONFERENCE:https://meet.google.com/abc-defg-hij',
      'DESCRIPTION:Louange\\, puis intercession.\\n\\n-::~:~::~:~:~:~::~:~::-\\nJoin with Google Meet: https://meet',
      ' .google.com/abc-defg-hij\\n-::~:~::~:~:~:~::~:~::-',
      'SUMMARY:Prière du mardi',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:This is an event reminder',
      'END:VALARM',
    ));
    const [event] = readCalendar(text, PARIS);
    expect(event.fields).toEqual({
      title: 'Prière du mardi',
      notes: 'Louange, puis intercession.',
      timezone: 'Europe/Paris',
      repeat: 'weekly',
      weekDays: [2],
      date: '2026-10-06',
      mode: 'online',
      link: 'https://meet.google.com/abc-defg-hij',
      time: '20:00',
      duration: 90,
    });
    expect(event.next.start.toISOString()).toBe('2026-10-20T18:00:00.000Z');
  });

  it('reads an Outlook invitation: Windows zone, Teams link, length as a duration', () => {
    const text = calendar(vevent(
      'DTSTART;TZID=W. Central Africa Standard Time:20261025T180000',
      'DURATION:PT2H',
      'SUMMARY:Veillée de prière',
      'LOCATION:Microsoft Teams Meeting',
      'X-MICROSOFT-SKYPETEAMSMEETINGURL:https://teams.microsoft.com/l/meetup-join/19%3ameeting',
      'DESCRIPTION:Venez nombreux.\\n________________________________________________________________________________\\nMicrosoft Teams meeting\\nJoin: https://teams.microsoft.com/l/meetup-join/19%3ameeting\\n________________________________________________________________________________',
    ));
    const [event] = readCalendar(text, PARIS);
    expect(event.fields).toMatchObject({
      title: 'Veillée de prière',
      notes: 'Venez nombreux.',
      timezone: 'Africa/Lagos',
      repeat: 'once',
      date: '2026-10-25',
      time: '18:00',
      duration: 120,
      mode: 'online',
      link: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting',
    });
  });

  it('moves a UTC start to the member’s own day and weekday', () => {
    const text = calendar(vevent('DTSTART:20261020T233000Z', 'DTEND:20261021T003000Z', 'RRULE:FREQ=WEEKLY;BYDAY=TU', 'SUMMARY:Late'));
    const [event] = readCalendar(text, PARIS);
    expect(event.fields).toMatchObject({ timezone: 'Europe/Paris', time: '01:30', weekDays: [3], date: '2026-10-21', duration: 60 });
  });

  it('keeps a place to meet, and a monthly rhythm on its day', () => {
    const text = calendar(vevent(
      'DTSTART:20261101T090000',
      'DTEND:20261101T100000',
      'RRULE:FREQ=MONTHLY;BYMONTHDAY=1',
      'SUMMARY:Premier du mois',
      'LOCATION:Chez Marie\\, 12 rue de la Paix',
      'DESCRIPTION:<p>Bienvenue&nbsp;!<br>Apportez votre Bible</p>',
    ));
    const [event] = readCalendar(text, PARIS);
    expect(event.fields).toMatchObject({
      mode: 'in_person', place: 'Chez Marie, 12 rue de la Paix', repeat: 'monthly', dayOfMonth: 1,
      time: '09:00', notes: 'Bienvenue !\nApportez votre Bible',
    });
  });

  it('starts an every-other-week rhythm on its next date, not in the past', () => {
    const text = calendar(vevent('DTSTART;TZID=Europe/Paris:20260901T190000', 'RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU', 'SUMMARY:Biweekly'));
    const [event] = readCalendar(text, PARIS);
    expect(event.fields).toMatchObject({ repeat: 'biweekly', date: '2026-10-27' });
  });

  it('offers only what lies ahead, soonest first', () => {
    const text = calendar(
      vevent('DTSTART:20261030T200000', 'SUMMARY:Later'),
      vevent('DTSTART:20261017T200000', 'SUMMARY:Sooner'),
      vevent('DTSTART:20261001T200000', 'SUMMARY:Past one-off'),
      vevent('DTSTART:20260101T200000', 'RRULE:FREQ=WEEKLY;UNTIL=20260601T000000Z', 'SUMMARY:Ended series'),
      vevent('DTSTART:20261018T200000', 'STATUS:CANCELLED', 'SUMMARY:Cancelled'),
      vevent('DTSTART:20261019T200000', 'RECURRENCE-ID:20261019T200000', 'SUMMARY:Moved occurrence'),
    );
    expect(readCalendar(text, PARIS).map((event) => event.fields.title)).toEqual(['Sooner', 'Later']);
  });

  it('reads back a meeting the app exported', () => {
    const exported = buildMeetingICS(
      {
        id: 'abc', start_time: '20:00:00', timezone: 'Europe/Paris', duration_minutes: 60,
        schedule: { type: 'recurring', freq: 'weekly', weekDays: [2], startDate: '2026-10-20' },
      },
      { title: 'Prière, mardi', link: 'https://zoom.us/j/1', notes: 'Louange' },
      NOW,
    );
    const [event] = readCalendar(exported, PARIS);
    expect(event.fields).toMatchObject({
      title: 'Prière, mardi', link: 'https://zoom.us/j/1', mode: 'online', notes: 'Louange',
      repeat: 'weekly', weekDays: [2], time: '20:00', duration: 60, timezone: 'Europe/Paris',
    });
  });

  it('names zones the way calendars write them', () => {
    expect(resolveZone('Europe/Paris')).toBe('Europe/Paris');
    expect(resolveZone('Romance Standard Time')).toBe('Europe/Paris');
    expect(resolveZone('/mozilla.org/20050126_1/America/New_York')).toBe('America/New_York');
    expect(resolveZone('Nowhere Standard Time')).toBeNull();
  });

  it('knows a calendar file from anything else', () => {
    expect(looksLikeCalendar('\uFEFFBEGIN:VCALENDAR\r\nEND:VCALENDAR')).toBe(true);
    expect(looksLikeCalendar('<html>')).toBe(false);
  });
});
