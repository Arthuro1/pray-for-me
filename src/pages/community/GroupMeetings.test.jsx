// @vitest-environment jsdom
//
// A group's prayer meetings on the group page: the form asks only what a
// meeting needs (where, when, how long — any length, by its end time) and saves
// the engine's schedule, and can be filled from a calendar; the card shows the
// next time in the reader's zone, the place (opening a map) or a way to join,
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

    const link = screen.getByLabelText(t(lang, 'meetingLinkLabel'));
    fireEvent.change(link, { target: { value: 'zoom.us/j/123' } });
    // The service is recognised from the address.
    expect(document.getElementById(link.getAttribute('aria-describedby')).textContent).toBe('Zoom');
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

  it('lasts any length, set by when it ends — a night of prayer included', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    render(<GroupMeetingForm lang={lang} onSave={onSave} onClose={() => {}} />);
    expect(screen.getByLabelText(t(lang, 'meetingEndLabel')).value).toBe('21:00');
    fireEvent.change(screen.getByLabelText(t(lang, 'meetingLinkLabel')), { target: { value: 'zoom.us/j/123' } });
    fireEvent.change(screen.getByLabelText(t(lang, 'meetingTimeLabel')), { target: { value: '21:00' } });
    // A quick length moves the end with it…
    fireEvent.click(screen.getByRole('button', { name: /^1\s*h\s*30/ }));
    expect(screen.getByLabelText(t(lang, 'meetingEndLabel')).value).toBe('22:30');
    // …and any other length is its end time, shown beside the quick ones.
    fireEvent.change(screen.getByLabelText(t(lang, 'meetingEndLabel')), { target: { value: '05:00' } });
    expect(screen.getByText(/^8\s*h$/)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: t(lang, 'save') })); });
    expect(onSave.mock.calls[0][0]).toMatchObject({ startTime: '21:00', durationMinutes: 480 });
  });

  it('chooses the days of a weekly meeting, and shows the card the group will see', () => {
    render(<GroupMeetingForm lang={lang} onSave={vi.fn()} onClose={() => {}} />);
    expect(screen.queryByText(t(lang, 'meetingPreviewLabel'))).toBeNull();
    fireEvent.change(screen.getByLabelText(t(lang, 'meetingNameLabel')), { target: { value: 'Prière du jeudi' } });
    fireEvent.change(screen.getByLabelText(t(lang, 'meetingLinkLabel')), { target: { value: 'zoom.us/j/123' } });
    const thursday = screen.getByRole('button', { name: 'jeudi' });
    fireEvent.click(thursday);
    expect(thursday.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(t(lang, 'meetingPreviewLabel'))).toBeTruthy();
    const card = screen.getByText('Prière du jeudi').closest('li');
    expect(card.textContent).toContain('Zoom');
    expect(card.querySelector('[aria-haspopup]')).toBeNull();
  });

  it('opens the place to meet in Google Maps', () => {
    render(<GroupMeetingForm lang={lang} onSave={vi.fn()} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'meetingInPerson') }));
    expect(screen.queryByRole('link', { name: t(lang, 'meetingOpenMap') })).toBeNull();
    fireEvent.change(screen.getByLabelText(t(lang, 'meetingPlaceLabel')), { target: { value: 'Église Saint-Jean' } });
    const map = screen.getByRole('link', { name: t(lang, 'meetingOpenMap') });
    expect(map.getAttribute('href')).toBe('https://www.google.com/maps/search/?api=1&query=%C3%89glise%20Saint-Jean');
    expect(map.getAttribute('rel')).toContain('noopener');
  });

  it('fills itself from a calendar link, for the person to check', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-16T10:00:00'));
    render(<GroupMeetingForm lang={lang} onSave={vi.fn()} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'meetingImport') }));
    fireEvent.change(screen.getByLabelText(t(lang, 'meetingImportLinkLabel')), {
      target: { value: 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Veill%C3%A9e&dates=20261030T210000/20261031T050000&location=%C3%89glise' },
    });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: t(lang, 'meetingImportLinkCta') })); });
    expect(screen.getByRole('status').textContent).toContain(t(lang, 'meetingImported'));
    expect(screen.getByLabelText(t(lang, 'meetingNameLabel')).value).toBe('Veillée');
    expect(screen.getByLabelText(t(lang, 'meetingPlaceLabel')).value).toBe('Église');
    expect(screen.getByLabelText(t(lang, 'meetingDateLabel')).value).toBe('2026-10-30');
    expect(screen.getByLabelText(t(lang, 'meetingEndLabel')).value).toBe('05:00');
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

  it('shows when it ends, and opens an in-person place in Google Maps', () => {
    renderCard({ meeting: { ...meeting, mode: 'in_person', link: '', place: 'Chez Marie' } });
    expect(screen.getByText(/20:00–21:00/)).toBeTruthy();
    const map = screen.getByRole('link', { name: t(lang, 'meetingOpenMapFor', { place: 'Chez Marie' }) });
    expect(map.getAttribute('href')).toBe('https://www.google.com/maps/search/?api=1&query=Chez%20Marie');
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
