import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabase', () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'test-token' } } }) } },
}));

const { IMPORT_ERRORS, importCalendarFile, importCalendarLink } = await import('./calendarImport');

const CONTEXT = { now: new Date('2026-10-16T10:00:00Z'), todayKey: '2026-10-16', timeZone: 'Europe/Paris' };
const ICS = [
  'BEGIN:VCALENDAR', 'VERSION:2.0',
  'BEGIN:VEVENT', 'DTSTART;TZID=Europe/Paris:20261020T200000', 'DURATION:PT1H', 'RRULE:FREQ=WEEKLY;BYDAY=TU', 'SUMMARY:Mardi', 'END:VEVENT',
  'BEGIN:VEVENT', 'DTSTART;TZID=Europe/Paris:20261024T090000', 'SUMMARY:Samedi', 'LOCATION:Église', 'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

afterEach(() => vi.unstubAllGlobals());

describe('importing a meeting from a calendar link', () => {
  it('reads a Google "add to calendar" link without any request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const link = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Pri%C3%A8re&dates=20261020T180000Z/20261020T193000Z'
      + '&details=Venez&location=https%3A%2F%2Fzoom.us%2Fj%2F1&recur=RRULE:FREQ%3DWEEKLY%3BBYDAY%3DTU';
    const { events } = await importCalendarLink(link, CONTEXT);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(events[0].fields).toMatchObject({
      title: 'Prière', notes: 'Venez', link: 'https://zoom.us/j/1', time: '20:00', duration: 90, repeat: 'weekly', weekDays: [2],
    });
  });

  it('reads a Google link written in its own zone', async () => {
    const link = 'https://calendar.google.com/calendar/u/0/r/eventedit?text=Soir&dates=20261020T200000/20261020T210000&ctz=Africa/Douala';
    const { events } = await importCalendarLink(link, CONTEXT);
    expect(events[0].fields).toMatchObject({ timezone: 'Africa/Douala', time: '20:00', duration: 60, repeat: 'once', date: '2026-10-20' });
  });

  it('reads an Outlook compose link, a night of prayer included', async () => {
    const link = 'https://outlook.live.com/calendar/0/deeplink/compose?subject=Veill%C3%A9e'
      + '&startdt=2026-10-30T21:00:00%2B01:00&enddt=2026-10-31T05:00:00%2B01:00&location=%C3%89glise%20Saint-Jean';
    const { events } = await importCalendarLink(link, CONTEXT);
    expect(events[0].fields).toMatchObject({
      title: 'Veillée', place: 'Église Saint-Jean', mode: 'in_person', time: '21:00', duration: 480, repeat: 'once', date: '2026-10-30',
    });
  });

  it('points an event page to the iCal address instead', async () => {
    expect(await importCalendarLink('https://calendar.google.com/calendar/event?eid=abc123', CONTEXT))
      .toEqual({ error: IMPORT_ERRORS.eventPage });
    expect(await importCalendarLink('not a link', CONTEXT)).toEqual({ error: IMPORT_ERRORS.invalidLink });
  });

  it('fetches a calendar address through the app’s own server, never in the URL', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ text: ICS }) }));
    vi.stubGlobal('fetch', fetchMock);
    const { events } = await importCalendarLink('webcal://p01-calendars.icloud.com/published/2/secret', CONTEXT);
    expect(fetchMock).toHaveBeenCalledWith('/api/calendar-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify({ url: 'https://p01-calendars.icloud.com/published/2/secret' }),
    });
    expect(events.map((event) => event.fields.title)).toEqual(['Mardi', 'Samedi']);
  });

  it('says when a calendar cannot be reached, or the link is a page', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({ error: 'unreachable' }) })));
    expect(await importCalendarLink('https://example.org/cal.ics', CONTEXT)).toEqual({ error: IMPORT_ERRORS.unreachable });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({ error: 'not_calendar' }) })));
    expect(await importCalendarLink('https://example.org/page', CONTEXT)).toEqual({ error: IMPORT_ERRORS.notIcal });
  });
});

describe('a calendar page standing for its iCal address', () => {
  const requested = (fetchMock) => fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body).url);
  const answering = () => vi.fn(async () => ({ ok: true, json: async () => ({ text: ICS }) }));

  it('reads a Google embed through the calendar’s public iCal address', async () => {
    const fetchMock = answering();
    vi.stubGlobal('fetch', fetchMock);
    const { events } = await importCalendarLink('https://calendar.google.com/calendar/embed?src=eglise%40group.calendar.google.com&ctz=Africa%2FDouala', CONTEXT);
    expect(requested(fetchMock)).toEqual(['https://calendar.google.com/calendar/ical/eglise%40group.calendar.google.com/public/basic.ics']);
    expect(events).toHaveLength(2);
  });

  it('reads an "add this calendar" link, whose calendar is base64-encoded', async () => {
    const fetchMock = answering();
    vi.stubGlobal('fetch', fetchMock);
    const cid = btoa('eglise@group.calendar.google.com').replace(/=+$/, '');
    await importCalendarLink(`https://calendar.google.com/calendar/u/0?cid=${cid}`, CONTEXT);
    expect(requested(fetchMock)).toEqual(['https://calendar.google.com/calendar/ical/eglise%40group.calendar.google.com/public/basic.ics']);
  });

  it('reads every calendar an embed shows, together', async () => {
    const other = ICS.replace('SUMMARY:Mardi', 'SUMMARY:Jeunes').replace('SUMMARY:Samedi', 'SUMMARY:Chorale');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ text: ICS }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ text: other }) });
    vi.stubGlobal('fetch', fetchMock);
    const { events } = await importCalendarLink('https://calendar.google.com/calendar/embed?src=a%40gmail.com&src=b%40gmail.com', CONTEXT);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(events.map((event) => event.fields.title).sort()).toEqual(['Chorale', 'Jeunes', 'Mardi', 'Samedi']);
  });

  it('says a calendar must be public when its public address does not answer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({ error: 'unreachable' }) })));
    expect(await importCalendarLink('https://calendar.google.com/calendar/embed?src=private%40gmail.com', CONTEXT))
      .toEqual({ error: IMPORT_ERRORS.unreachable });
  });

  it('points a calendar page that names no calendar to the iCal address, without a request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await importCalendarLink('https://calendar.google.com/calendar/u/0/r/week/2026/10/20', CONTEXT)).toEqual({ error: IMPORT_ERRORS.notIcal });
    expect(await importCalendarLink('https://outlook.live.com/calendar/0/view/month', CONTEXT)).toEqual({ error: IMPORT_ERRORS.notIcal });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reads a published Outlook calendar from its page’s .ics', async () => {
    const fetchMock = answering();
    vi.stubGlobal('fetch', fetchMock);
    await importCalendarLink('https://outlook.office365.com/owa/calendar/abc@church.org/token123/calendar.html', CONTEXT);
    expect(requested(fetchMock)).toEqual(['https://outlook.office365.com/owa/calendar/abc@church.org/token123/calendar.ics']);
  });
});

describe('importing a meeting from a .ics file', () => {
  it('reads the upcoming events of the file', async () => {
    const { events } = await importCalendarFile(new File([ICS], 'meetings.ics', { type: 'text/calendar' }), CONTEXT);
    expect(events).toHaveLength(2);
  });

  it('says what is wrong with a file', async () => {
    expect(await importCalendarFile(new File(['hello'], 'notes.txt'), CONTEXT)).toEqual({ error: IMPORT_ERRORS.unreadable });
    const past = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART:20250101T100000\r\nEND:VEVENT\r\nEND:VCALENDAR';
    expect(await importCalendarFile(new File([past], 'old.ics'), CONTEXT)).toEqual({ error: IMPORT_ERRORS.none });
  });
});
