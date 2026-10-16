// @vitest-environment jsdom
//
// A group's prayer meetings on the group page: the form asks only what a
// meeting needs (where, when, how long) and saves the engine's schedule; the
// card shows the next time in the reader's zone, the place or a way to join,
// and offers changes only to the member who scheduled it or an admin.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import GroupMeetingForm from './GroupMeetingForm';
import GroupMeetingCard from './GroupMeetingCard';
import usePrayerStore from '../../store/prayerStore';
import { nextMeeting } from '../../lib/meetingTime';
import { t } from '../../i18n';

const lang = 'fr';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
beforeEach(() => {
  usePrayerStore.setState({ settings: { language: lang } });
});

const meeting = {
  id: 'm1',
  group_id: 'g1',
  created_by: 'host',
  schedule: { type: 'recurring', freq: 'weekly', weekDays: [2], startDate: '2026-10-01' },
  start_time: '20:00:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  duration_minutes: 60,
  title: 'Prière du mardi',
  mode: 'online',
  link: 'https://meet.google.com/abc-defg-hij',
  place: '',
  notes: 'Apportez vos sujets',
  _locked: false,
};

describe('GroupMeetingForm', () => {
  it('asks for a link before an online meeting can be saved, then saves the schedule', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    render(<GroupMeetingForm lang={lang} onSave={onSave} onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: t(lang, 'meetingFormTitleNew') })).toBeTruthy();

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: t(lang, 'save') })); });
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(t(lang, 'meetingLinkInvalid'))).toBeTruthy();

    fireEvent.change(screen.getByLabelText(t(lang, 'meetingLinkLabel')), { target: { value: 'zoom.us/j/123' } });
    // The service is recognised from the address.
    expect(screen.getByText('Zoom')).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: t(lang, 'save') })); });

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0];
    expect(saved.schedule).toMatchObject({ type: 'recurring', freq: 'weekly' });
    expect(saved.startTime).toBe('20:00');
    expect(saved.details).toMatchObject({ mode: 'online', link: 'https://zoom.us/j/123', place: '' });
  });

  it('meets in person at a named place, once', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    render(<GroupMeetingForm lang={lang} onSave={onSave} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'meetingInPerson') }));
    fireEvent.change(screen.getByLabelText(t(lang, 'meetingPlaceLabel')), { target: { value: 'Chez Marie' } });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'meetingRepeatOnce') }));
    fireEvent.change(screen.getByLabelText(t(lang, 'meetingDateLabel')), { target: { value: '2099-01-05' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: t(lang, 'save') })); });
    expect(onSave.mock.calls[0][0]).toMatchObject({
      schedule: { type: 'once', date: '2099-01-05' },
      details: { mode: 'in_person', place: 'Chez Marie', link: '' },
    });
  });

  it('opens an existing meeting as it was saved', () => {
    render(<GroupMeetingForm lang={lang} meeting={meeting} onSave={vi.fn()} onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: t(lang, 'meetingFormTitleEdit') })).toBeTruthy();
    expect(screen.getByLabelText(t(lang, 'meetingLinkLabel')).value).toBe(meeting.link);
    expect(screen.getByLabelText(t(lang, 'meetingTimeLabel')).value).toBe('20:00');
  });
});

describe('GroupMeetingCard', () => {
  const renderCard = (props = {}, now = new Date()) => render(
    <ul>
      <GroupMeetingCard meeting={meeting} next={nextMeeting(meeting, now)} lang={lang} canManage={false} onEdit={() => {}} onEnd={() => {}} now={now} {...props} />
    </ul>,
  );

  it('names the meeting, when it is next and how to join', () => {
    renderCard();
    expect(screen.getByText('Prière du mardi')).toBeTruthy();
    expect(screen.getByText(/Chaque mardi/)).toBeTruthy();
    expect(screen.getByText('Google Meet')).toBeTruthy();
    const join = screen.getByRole('link', { name: t(lang, 'meetingJoinOn', { platform: 'Google Meet' }) });
    expect(join.getAttribute('href')).toBe(meeting.link);
    expect(join.getAttribute('rel')).toContain('noopener');
    expect(screen.getByText(meeting.notes)).toBeTruthy();
  });

  it('marks a meeting that is on now', () => {
    const next = nextMeeting(meeting, new Date());
    const during = new Date(next.start.getTime() + 10 * 60_000);
    renderCard({ next: nextMeeting(meeting, during) }, during);
    expect(screen.getByText(t(lang, 'meetingLive'))).toBeTruthy();
  });

  it('shows no details it cannot decrypt, and no way to join', () => {
    renderCard({ meeting: { ...meeting, _locked: true, title: '', link: '' } });
    expect(screen.getByText(t(lang, 'meetingDefaultTitle'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'meetingLocked'))).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('offers to change or remove it only to whoever may', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Prière du mardi' }));
    expect(screen.queryByText(t(lang, 'meetingEnd'))).toBeNull();
    cleanup();

    const onEnd = vi.fn();
    renderCard({ canManage: true, onEnd });
    fireEvent.click(screen.getByRole('button', { name: 'Prière du mardi' }));
    fireEvent.click(screen.getByText(t(lang, 'meetingEnd')));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
