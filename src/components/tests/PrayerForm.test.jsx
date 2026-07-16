// @vitest-environment jsdom
//
// Quick Add asks ONE question — who or what to pray for. A note and all
// organization (person, categories, prayer rhythm) are optional and collapsed.
// French is the always-loaded locale, so assertions go through t() to verify the
// show/hide LOGIC rather than pin copy.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

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
    expect(screen.queryByText(t(lang, 'rhythmLabel'))).toBeNull();
    expect(screen.getByText(t(lang, 'addNote'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'organizeLabel'))).toBeTruthy();
  });

  it('"Add a note" reveals the note field', () => {
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'addNote')));
    expect(screen.getByPlaceholderText(t(lang, 'detailsPlaceholder'))).toBeTruthy();
  });

  it('"Organize" reveals person, categories and the rhythm question', () => {
    usePrayerStore.setState({
      categories: [{ id: 'c1', name: 'Famille', emoji: '👨‍👩‍👧', color: '#7c5cfc' }],
      settings: { language: lang },
    });
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'organizeLabel')));
    expect(screen.getByText(t(lang, 'forOther'))).toBeTruthy();
    expect(screen.getByText('Famille', { exact: false })).toBeTruthy();
    expect(screen.getByText(t(lang, 'rhythmLabel'))).toBeTruthy();
    // The full schedule editor only appears for Custom.
    expect(screen.queryByText(t(lang, 'scheduleHowOften'))).toBeNull();
    fireEvent.click(screen.getByText(t(lang, 'rhythmCustom')));
    expect(screen.getByText(t(lang, 'scheduleHowOften'))).toBeTruthy();
  });

  it('a rhythm preset maps onto a real schedule (daily) without the full editor', () => {
    const addPrayer = vi.fn(async () => null);
    usePrayerStore.setState({ addPrayer });
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'organizeLabel')));
    fireEvent.click(screen.getByText(t(lang, 'freqDaily')));
    fireEvent.change(screen.getByPlaceholderText(t(lang, 'prayerSubjectPlaceholder')), {
      target: { value: 'Paix' },
    });
    fireEvent.click(screen.getByText(t(lang, 'savePrayer')));
    expect(addPrayer.mock.calls[0][0].schedule).toEqual(
      expect.objectContaining({ type: 'recurring', freq: 'daily' })
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

  it('the weekly default is visible (and selected) when Organize is opened', () => {
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'organizeLabel')));
    const weekly = screen.getByRole('button', { name: t(lang, 'freqWeekly') });
    expect(weekly.getAttribute('aria-pressed')).toBe('true');
    // The old unbounded "Flexible" preset is not offered on new prayers.
    expect(screen.queryByText(t(lang, 'rhythmFlexible'))).toBeNull();
  });

  it('editing a legacy unscheduled prayer keeps its plan-based rhythm untouched', () => {
    const updatePrayer = vi.fn();
    usePrayerStore.setState({ updatePrayer });
    const legacy = { id: 'p1', title: 'Ancienne', schedule: null, prayer_categories: [{ category_id: 'c1' }] };
    render(<PrayerForm onClose={() => {}} editPrayer={legacy} />);
    // Its rhythm chip is visible and selected, honestly labeled…
    const chip = screen.getByRole('button', { name: t(lang, 'rhythmFlexible') });
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(t(lang, 'rhythmPlanHint'))).toBeTruthy();
    // …and saving without touching it never migrates the null schedule.
    fireEvent.click(screen.getByText(t(lang, 'save')));
    expect(updatePrayer).toHaveBeenCalledWith('p1', expect.objectContaining({ schedule: null }));
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
