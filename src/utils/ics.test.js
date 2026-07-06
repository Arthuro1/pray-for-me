import { describe, it, expect } from 'vitest';
import { buildICS } from './ics.js';

const weekly = {
  id: 'p1', status: 'active', title: 'Sarah, healing', description: 'Line1\nLine2',
  schedule: { type: 'recurring', freq: 'weekly', weekDays: [2, 5], startDate: '2026-07-04', end: { kind: 'count', count: 8 } },
};
const once = { id: 'p2', status: 'active', title: 'Exam', schedule: { type: 'once', date: '2026-07-14' } };

describe('buildICS', () => {
  it('emits a valid calendar with RRULE for recurring schedules', () => {
    const ics = buildICS([weekly]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260704');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=TU,FR;COUNT=8');
    expect(ics).toContain('UID:p1@pray4me.space');
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true);
  });

  it('escapes commas and newlines in text fields', () => {
    const ics = buildICS([weekly]);
    expect(ics).toContain('SUMMARY:🙏 Sarah\\, healing');
    expect(ics).toContain('DESCRIPTION:Line1\\nLine2');
  });

  it('exports one-time prayers without an RRULE', () => {
    const ics = buildICS([once]);
    expect(ics).toContain('DTSTART;VALUE=DATE:20260714');
    expect(ics).not.toContain('RRULE');
  });

  it('skips unscheduled or answered prayers and includes commitments', () => {
    const ics = buildICS(
      [{ id: 'x', status: 'active', title: 'No schedule' }, { ...once, status: 'answered' }],
      [{ id: 'c1', day: '2026-07-18', title: 'Marie — surgery', group_name: 'Cell group' }]
    );
    expect(ics).not.toContain('No schedule');
    expect(ics).not.toContain('Exam');
    expect(ics).toContain('UID:commitment-c1@pray4me.space');
    expect(ics).toContain('DESCRIPTION:Cell group');
  });
});
