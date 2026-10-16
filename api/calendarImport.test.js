import { describe, expect, it, vi } from 'vitest';
import {
  CalendarImportError, calendarUrl, fetchCalendar, handleCalendarImport, isPublicAddress, publicLookup,
} from './calendar-import.js';

const ENV = { VITE_SUPABASE_URL: 'https://project.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon' };
const CALENDAR = 'BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n';

function response() {
  const res = { statusCode: 0, body: null, headers: {} };
  res.setHeader = (name, value) => { res.headers[name] = value; return res; };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (value) => { res.body = value; return res; };
  return res;
}

const signedIn = vi.fn(async () => ({ ok: true }));
const request = (body, authorization = 'Bearer token') => ({ method: 'POST', headers: { authorization }, body });

describe('which addresses the calendar import may reach', () => {
  it('allows only the public internet', () => {
    for (const ip of ['93.184.216.34', '8.8.8.8', '172.32.0.1', '2606:4700:4700::1111']) expect(isPublicAddress(ip), ip).toBe(true);
    for (const ip of [
      '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1',
      '0.0.0.0', '224.0.0.1', '255.255.255.255', '::1', '::', 'fe80::1', 'fc00::1', 'fd12:3456::1',
      '::ffff:127.0.0.1', '::ffff:10.0.0.1', '64:ff9b::7f00:1', '2002:7f00:1::1', '2001:db8::1', 'calendar.example', '',
    ]) expect(isPublicAddress(ip), ip).toBe(false);
  });

  it('fetches https on the standard port, from a name, with no credentials', () => {
    expect(calendarUrl('webcal://p01-calendars.icloud.com/published/2/abc')?.href).toBe('https://p01-calendars.icloud.com/published/2/abc');
    expect(calendarUrl('https://calendar.google.com/calendar/ical/x/basic.ics#top')?.href).toBe('https://calendar.google.com/calendar/ical/x/basic.ics');
    for (const bad of [
      'http://example.org/a.ics', 'https://example.org:8443/a.ics', 'https://user:pw@example.org/a.ics', 'https://127.0.0.1/a.ics',
      'https://[::1]/a.ics', 'https://2130706433/a.ics', 'ftp://example.org/a.ics', 'file:///etc/passwd', '', `https://example.org/${'a'.repeat(2100)}`,
    ]) expect(calendarUrl(bad), bad).toBeNull();
  });

  it('refuses a name that resolves to a private address, at connection time', async () => {
    const lookup = (addresses) => new Promise((resolve) => {
      publicLookup((host, options, callback) => callback(null, addresses))('calendar.example', {}, (...args) => resolve(args));
    });
    const [blocked] = await lookup([{ address: '93.184.216.34', family: 4 }, { address: '10.0.0.1', family: 4 }]);
    expect(blocked.code).toBe('EBLOCKED');
    expect(await lookup([{ address: '93.184.216.34', family: 4 }])).toEqual([null, '93.184.216.34', 4]);
    const all = await new Promise((resolve) => {
      publicLookup((host, options, callback) => callback(null, [{ address: '2606:4700::1', family: 6 }]))('calendar.example', { all: true }, (...args) => resolve(args));
    });
    expect(all).toEqual([null, [{ address: '2606:4700::1', family: 6 }]]);
  });
});

describe('fetching a calendar', () => {
  it('follows a redirect only to another allowed address', async () => {
    const get = vi.fn()
      .mockResolvedValueOnce({ redirect: '/moved.ics' })
      .mockResolvedValueOnce({ text: `\uFEFF${CALENDAR}` });
    expect(await fetchCalendar(calendarUrl('https://example.org/a.ics'), { get, lookup: () => {} })).toBe(CALENDAR);
    expect(get.mock.calls[1][0].href).toBe('https://example.org/moved.ics');

    const toPrivate = vi.fn().mockResolvedValueOnce({ redirect: 'http://169.254.169.254/latest' });
    await expect(fetchCalendar(calendarUrl('https://example.org/a.ics'), { get: toPrivate, lookup: () => {} }))
      .rejects.toMatchObject({ code: 'unreachable' });
  });

  it('answers only with a calendar, after a few redirects at most', async () => {
    await expect(fetchCalendar(calendarUrl('https://example.org/a'), { get: async () => ({ text: '<html>secret</html>' }), lookup: () => {} }))
      .rejects.toMatchObject({ code: 'not_calendar', status: 422 });
    await expect(fetchCalendar(calendarUrl('https://example.org/a'), { get: async () => ({ redirect: '/again' }), lookup: () => {} }))
      .rejects.toMatchObject({ code: 'unreachable' });
  });
});

describe('the calendar import request', () => {
  it('is POST only and needs a signed-in member', async () => {
    const readCalendar = vi.fn();
    const get = response();
    await handleCalendarImport({ method: 'GET', headers: {} }, get, { env: ENV, fetchImpl: signedIn, readCalendar });
    expect(get.statusCode).toBe(405);

    const anonymous = response();
    await handleCalendarImport(request({ url: 'https://example.org/a.ics' }, null), anonymous, { env: ENV, fetchImpl: signedIn, readCalendar });
    expect(anonymous.statusCode).toBe(401);

    const expired = response();
    await handleCalendarImport(request({ url: 'https://example.org/a.ics' }), expired, { env: ENV, fetchImpl: async () => ({ ok: false }), readCalendar });
    expect(expired.statusCode).toBe(401);
    expect(readCalendar).not.toHaveBeenCalled();
  });

  it('refuses an address it may not fetch', async () => {
    const res = response();
    await handleCalendarImport(request({ url: 'https://localhost:5432/' }), res, { env: ENV, fetchImpl: signedIn, readCalendar: vi.fn() });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_url' });
  });

  it('returns the calendar, or a short error that never echoes the address', async () => {
    const ok = response();
    await handleCalendarImport(request({ url: 'webcal://example.org/a.ics' }), ok, { env: ENV, fetchImpl: signedIn, readCalendar: async () => CALENDAR });
    expect(ok.statusCode).toBe(200);
    expect(ok.body).toEqual({ text: CALENDAR });
    expect(ok.headers['Cache-Control']).toBe('no-store');

    const notCalendar = response();
    await handleCalendarImport(request({ url: 'https://example.org/secret-token' }), notCalendar, {
      env: ENV, fetchImpl: signedIn, readCalendar: async () => { throw new CalendarImportError('not_calendar', 422); },
    });
    expect(notCalendar.statusCode).toBe(422);
    expect(JSON.stringify(notCalendar.body)).not.toContain('secret-token');

    const crashed = response();
    await handleCalendarImport(request({ url: 'https://example.org/a.ics' }), crashed, {
      env: ENV, fetchImpl: signedIn, readCalendar: async () => { throw new Error('socket hang up https://example.org/a.ics'); },
    });
    expect(crashed.statusCode).toBe(502);
    expect(crashed.body).toEqual({ error: 'unreachable' });
  });
});
