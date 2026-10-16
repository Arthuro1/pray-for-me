import { describe, expect, it } from 'vitest';
import {
  draftFromMeeting, meetingDetails, meetingDraftError, newMeetingDraft, scheduleFromMeetingDraft,
} from './meetingDraft';
import { meetingPlatform, safeMeetingUrl } from './meetingLink';
import { buildMeetingICS } from '../utils/ics';

const TODAY = '2026-10-16'; // a Friday

describe('meeting links', () => {
  it('keeps only web addresses, reading a bare host as https', () => {
    expect(safeMeetingUrl('https://zoom.us/j/123?pwd=abc')).toBe('https://zoom.us/j/123?pwd=abc');
    expect(safeMeetingUrl('meet.google.com/abc-defg-hij')).toBe('https://meet.google.com/abc-defg-hij');
    for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'file:///etc/passwd', 'not a link', '', 'https://user:pw@zoom.us/j/1', 'localhost']) {
      expect(safeMeetingUrl(bad), bad).toBeNull();
    }
  });

  it('names the service from the host', () => {
    expect(meetingPlatform('https://us02web.zoom.us/j/1')).toBe('Zoom');
    expect(meetingPlatform('https://meet.google.com/abc')).toBe('Google Meet');
    expect(meetingPlatform('https://teams.microsoft.com/l/meetup-join/x')).toBe('Microsoft Teams');
    expect(meetingPlatform('https://chat.whatsapp.com/AbC')).toBe('WhatsApp');
    expect(meetingPlatform('https://myteam.slack.com/huddle/x')).toBe('Slack');
    expect(meetingPlatform('https://evilzoom.us/j/1')).toBeNull();
    expect(meetingPlatform('https://example.org/call')).toBeNull();
  });
});

describe('meeting draft', () => {
  it('starts as a weekly online meeting on today\'s weekday at 20:00', () => {
    const d = newMeetingDraft(TODAY, 'Europe/Paris');
    expect(d).toMatchObject({ mode: 'online', repeat: 'weekly', weekDays: [5], time: '20:00', duration: 60, timezone: 'Europe/Paris' });
  });

  it('maps each rhythm onto the prayer engine\'s schedule', () => {
    const d = newMeetingDraft(TODAY, 'Europe/Paris');
    expect(scheduleFromMeetingDraft({ ...d, weekDays: [4, 2] }, TODAY))
      .toEqual({ type: 'recurring', freq: 'weekly', weekDays: [2, 4], startDate: TODAY });
    expect(scheduleFromMeetingDraft({ ...d, repeat: 'biweekly', date: '2026-10-20' }, TODAY))
      .toEqual({ type: 'recurring', freq: 'interval', interval: 14, startDate: '2026-10-20' });
    expect(scheduleFromMeetingDraft({ ...d, repeat: 'monthly', dayOfMonth: '1' }, TODAY))
      .toEqual({ type: 'recurring', freq: 'monthly', dayOfMonth: 1, startDate: TODAY });
    expect(scheduleFromMeetingDraft({ ...d, repeat: 'once', date: '2026-11-01' }, TODAY))
      .toEqual({ type: 'once', date: '2026-11-01' });
  });

  it('round-trips a saved meeting back into the form', () => {
    const meeting = {
      schedule: { type: 'recurring', freq: 'weekly', weekDays: [2], startDate: '2026-10-01' },
      start_time: '19:30:00', timezone: 'America/Chicago', duration_minutes: 90,
      title: 'Mardi', mode: 'in_person', place: 'Chez Marie', link: '', notes: 'Louange',
    };
    expect(draftFromMeeting(meeting, TODAY)).toMatchObject({
      repeat: 'weekly', weekDays: [2], time: '19:30', duration: 90, timezone: 'America/Chicago',
      mode: 'in_person', place: 'Chez Marie', title: 'Mardi', notes: 'Louange',
    });
  });

  it('says what is missing before saving', () => {
    const d = newMeetingDraft(TODAY, 'Europe/Paris');
    expect(meetingDraftError(d, TODAY)).toBe('meetingLinkInvalid');
    const online = { ...d, link: 'zoom.us/j/1' };
    expect(meetingDraftError(online, TODAY)).toBeNull();
    expect(meetingDraftError({ ...online, weekDays: [] }, TODAY)).toBe('meetingDaysRequired');
    expect(meetingDraftError({ ...online, repeat: 'once', date: '2026-10-01' }, TODAY)).toBe('meetingDateRequired');
    expect(meetingDraftError({ ...online, repeat: 'monthly', dayOfMonth: '32' }, TODAY)).toBe('meetingDayOfMonthInvalid');
    expect(meetingDraftError({ ...d, mode: 'in_person', place: '  ' }, TODAY)).toBe('meetingPlaceRequired');
  });

  it('encrypts only what belongs to the chosen place', () => {
    const d = { ...newMeetingDraft(TODAY, 'Europe/Paris'), title: ' Mardi ', link: 'zoom.us/j/1', place: 'old place' };
    expect(meetingDetails(d)).toEqual({ title: 'Mardi', mode: 'online', link: 'https://zoom.us/j/1', place: '', notes: '' });
    expect(meetingDetails({ ...d, mode: 'in_person' })).toMatchObject({ mode: 'in_person', link: '', place: 'old place' });
  });
});

describe('meeting calendar file', () => {
  it('is one timed event in the meeting\'s zone, repeating like the schedule', () => {
    const ics = buildMeetingICS(
      {
        id: 'abc', start_time: '20:00:00', timezone: 'Europe/Paris', duration_minutes: 60,
        schedule: { type: 'recurring', freq: 'weekly', weekDays: [2], startDate: '2026-10-20' },
      },
      { title: 'Prière, mardi', link: 'https://zoom.us/j/1', notes: 'Line one\nline two' },
      new Date('2026-10-16T10:00:00Z'),
    );
    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20261020T200000');
    expect(ics).toContain('DURATION:PT60M');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=TU');
    expect(ics).toContain('SUMMARY:🙏 Prière\\, mardi');
    expect(ics).toContain('URL:https://zoom.us/j/1');
    expect(ics).toContain('DESCRIPTION:Line one\\nline two');
    expect(ics).toContain('DTSTAMP:20261016T100000Z');
  });
});
