// @vitest-environment jsdom
//
// Quick Add asks ONE question — who or what to pray for. A note and all
// organization (person, categories, prayer rhythm) are optional and collapsed.
// French is the always-loaded locale, so assertions go through t() to verify the
// show/hide LOGIC rather than pin copy.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

// Supabase builds its realtime layer at construct time (throws on older Node in
// CI); the form only needs the store shape, so stub the client to no-ops.
vi.mock('../../lib/supabase', () => {
  const chain = {
    upsert: () => Promise.resolve({ data: null, error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return { supabase: { auth: { getUser: async () => ({ data: { user: null } }) }, from: () => chain } };
});

import PrayerForm from '../PrayerForm';
import usePrayerStore from '../../store/prayerStore';
import { parseKey } from '../../lib/schedule';
import { todayKey } from '../../lib/prayedLog';
import { t } from '../../i18n';

const lang = 'fr';
afterEach(cleanup);

// Scheduling rows are named "<label> <sub-line>", so match from the start.
const rhythmRadio = (key) => screen.getByRole('radio', {
  name: new RegExp(`^${t(lang, key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
});

beforeEach(() => {
  usePrayerStore.setState({ categories: [], settings: { language: lang } });
});

describe('PrayerForm — Quick Add', () => {
  it('asks only who/what to pray for; note and organization are collapsed', () => {
    render(<PrayerForm onClose={() => {}} />);
    expect(screen.getByText(t(lang, 'prayerFieldLabel'))).toBeTruthy();
    expect(screen.getByPlaceholderText(t(lang, 'prayerSubjectPlaceholder'))).toBeTruthy();
    // The note textarea and every organization field wait behind expanders.
    expect(screen.queryByPlaceholderText(t(lang, 'detailsPlaceholder'))).toBeNull();
    expect(screen.queryByText(t(lang, 'forOther'))).toBeNull();
    expect(screen.queryByText(t(lang, 'schedRhythmLabel'))).toBeNull();
    expect(screen.getByText(t(lang, 'addNote'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'organizeLabel'))).toBeTruthy();
  });

  it('can open Organize directly from a contextual activation invitation', () => {
    const legacy = { id: 'p1', title: 'Ancienne', schedule: null, prayer_categories: [] };
    render(<PrayerForm onClose={() => {}} editPrayer={legacy} initialOrganizeOpen />);
    expect(screen.getByText(t(lang, 'forOther'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'schedRhythmLabel'))).toBeTruthy();
  });

  it('"Add a note" reveals the note field', () => {
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'addNote')));
    expect(screen.getByPlaceholderText(t(lang, 'detailsPlaceholder'))).toBeTruthy();
  });

  it('the note field offers the same light formatting as updates', () => {
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'addNote')));
    const note = screen.getByPlaceholderText(t(lang, 'detailsPlaceholder'));
    fireEvent.change(note, { target: { value: 'important' } });
    note.setSelectionRange(0, 9);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'formatBold') }));
    expect(note.value).toBe('**important**');
  });

  it('"Organize" reveals person, categories and the rhythm — as one compact line', () => {
    usePrayerStore.setState({
      categories: [{ id: 'c1', name: 'Famille', emoji: '👨‍👩‍👧', color: '#7c5cfc' }],
      settings: { language: lang },
    });
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'organizeLabel')));
    expect(screen.getByText(t(lang, 'forOther'))).toBeTruthy();
    expect(screen.getByText('Famille', { exact: false })).toBeTruthy();
    // The rhythm reads as a summary row; the scheduler itself waits behind it.
    expect(screen.getByText(t(lang, 'schedRhythmLabel'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'schedChangeLater'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'schedWhenAppear'))).toBeNull();
    fireEvent.click(screen.getByText(t(lang, 'schedRhythmLabel')));
    expect(screen.getByText(t(lang, 'schedWhenAppear'))).toBeTruthy();
  });

  it('a rhythm chosen in the scheduler maps onto a real schedule (daily)', () => {
    const addPrayer = vi.fn(async () => null);
    usePrayerStore.setState({ addPrayer });
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'organizeLabel')));
    fireEvent.click(screen.getByText(t(lang, 'schedRhythmLabel')));
    fireEvent.click(rhythmRadio('schedOtherRhythm'));
    fireEvent.click(rhythmRadio('schedEveryDay'));
    fireEvent.click(screen.getByText(t(lang, 'schedUseRhythm')));
    fireEvent.change(screen.getByPlaceholderText(t(lang, 'prayerSubjectPlaceholder')), {
      target: { value: 'Paix' },
    });
    fireEvent.click(screen.getByText(t(lang, 'savePrayer')));
    expect(addPrayer).toHaveBeenCalledTimes(1);
    expect(addPrayer.mock.calls[0][0].schedule).toEqual(
      expect.objectContaining({ type: 'recurring', freq: 'daily' })
    );
  });

  it('Cancel in the scheduler leaves the prayer on its previous rhythm', () => {
    const addPrayer = vi.fn(async () => null);
    usePrayerStore.setState({ addPrayer });
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'organizeLabel')));
    fireEvent.click(screen.getByText(t(lang, 'schedRhythmLabel')));
    fireEvent.click(rhythmRadio('schedOtherRhythm'));
    fireEvent.click(rhythmRadio('schedEveryDay'));
    // The scheduler's own Cancel, not the form's.
    const scheduler = screen.getByText(t(lang, 'schedUseRhythm')).closest('div');
    fireEvent.click(within(scheduler).getByText(t(lang, 'cancel')));

    fireEvent.change(screen.getByPlaceholderText(t(lang, 'prayerSubjectPlaceholder')), {
      target: { value: 'Paix' },
    });
    fireEvent.click(screen.getByText(t(lang, 'savePrayer')));
    // The discarded draft never reached the prayer: still the bounded weekly.
    expect(addPrayer.mock.calls[0][0].schedule).toEqual(
      expect.objectContaining({ freq: 'weekly', weekDays: [parseKey(todayKey()).getDay()] })
    );
  });

  it('creates a minimal prayer with the bounded weekly default from the collapsed form', () => {
    const addPrayer = vi.fn(async () => null); // null → the form just closes, no saved step
    const onClose = vi.fn();
    usePrayerStore.setState({ addPrayer });
    render(<PrayerForm onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText(t(lang, 'prayerSubjectPlaceholder')), {
      target: { value: 'Paix pour ma famille' },
    });
    fireEvent.click(screen.getByText(t(lang, 'savePrayer')));

    expect(addPrayer).toHaveBeenCalledTimes(1);
    // The quick capture shows today and returns weekly on this weekday — it
    // never silently becomes a daily item.
    expect(addPrayer.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        title: 'Paix pour ma famille',
        schedule: expect.objectContaining({
          type: 'recurring',
          freq: 'weekly',
          weekDays: [parseKey(todayKey()).getDay()],
        }),
      })
    );
  });

  it('the weekly default is readable, in words, when Organize is opened', () => {
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'organizeLabel')));
    // The compact row states the rhythm this prayer already has — no chips, no
    // decision to make, and the weekday it names is today's.
    const row = screen.getByText(t(lang, 'schedRhythmLabel')).closest('button');
    expect(row.textContent).toContain(t(lang, 'days')[parseKey(todayKey()).getDay()]);
    expect(row.textContent).toContain(t(lang, 'slotAnytime'));
    // Opening the scheduler does not preselect the unbounded plan-following mode.
    fireEvent.click(row);
    expect(rhythmRadio('schedUsePlan').checked).toBe(false);
    expect(rhythmRadio('schedOtherRhythm').checked).toBe(true);
  });

  it('editing a legacy unscheduled prayer keeps its plan-based rhythm untouched', () => {
    const updatePrayer = vi.fn();
    usePrayerStore.setState({ updatePrayer });
    const legacy = { id: 'p1', title: 'Ancienne', schedule: null, prayer_categories: [{ category_id: 'c1' }] };
    render(<PrayerForm onClose={() => {}} editPrayer={legacy} />);
    // Its rhythm is stated honestly, as the days it really produces…
    expect(screen.getByText(t(lang, 'schedRhythmLabel'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'rhythmPlanHint'))).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'schedRhythmLabel')));
    expect(rhythmRadio('schedUsePlan').checked).toBe(true);
    const scheduler = screen.getByText(t(lang, 'schedUseRhythm')).closest('div');
    fireEvent.click(within(scheduler).getByText(t(lang, 'cancel')));
    // …and saving without touching it never migrates the null schedule.
    fireEvent.click(screen.getByText(t(lang, 'save')));
    expect(updatePrayer).toHaveBeenCalledTimes(1);
    expect(updatePrayer).toHaveBeenCalledWith('p1', expect.objectContaining({ schedule: null }));
  });

  it('saves a prayer without the scheduler ever being opened', () => {
    const addPrayer = vi.fn(async () => null);
    usePrayerStore.setState({ addPrayer });
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(t(lang, 'prayerSubjectPlaceholder')), {
      target: { value: 'Sans décision' },
    });
    fireEvent.click(screen.getByText(t(lang, 'savePrayer')));
    expect(screen.queryByText(t(lang, 'schedWhenAppear'))).toBeNull();
    expect(addPrayer).toHaveBeenCalledTimes(1);
    expect(addPrayer.mock.calls[0][0].schedule).toEqual(
      expect.objectContaining({ type: 'recurring', freq: 'weekly' })
    );
  });
});

describe('PrayerForm — accessibility', () => {
  it('expanders expose aria-expanded/aria-controls and collapse without losing values', () => {
    render(<PrayerForm onClose={() => {}} />);
    const noteToggle = screen.getByRole('button', { name: new RegExp(t(lang, 'addNote')) });
    expect(noteToggle.getAttribute('aria-expanded')).toBe('false');
    expect(noteToggle.getAttribute('aria-controls')).toBe('prayer-note-section');

    fireEvent.click(noteToggle);
    expect(noteToggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.change(screen.getByPlaceholderText(t(lang, 'detailsPlaceholder')), {
      target: { value: 'Un détail important' },
    });
    // Collapse, then reopen: the entered note is still there.
    fireEvent.click(noteToggle);
    expect(screen.queryByPlaceholderText(t(lang, 'detailsPlaceholder'))).toBeNull();
    fireEvent.click(noteToggle);
    expect(screen.getByPlaceholderText(t(lang, 'detailsPlaceholder')).value).toBe('Un détail important');
  });

  it('uses a real labelled checkbox for "for someone else" (keyboard/screen-reader operable)', () => {
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'organizeLabel')) }));
    const checkbox = screen.getByRole('checkbox', { name: t(lang, 'forOther') });
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(screen.getByText(t(lang, 'personName'))).toBeTruthy();
  });

  it('the icon-only close button has an accessible name, and the title field a label', () => {
    render(<PrayerForm onClose={() => {}} />);
    expect(screen.getByRole('button', { name: t(lang, 'close') })).toBeTruthy();
    expect(screen.getByLabelText(t(lang, 'prayerFieldLabel'))).toBeTruthy();
  });
});
