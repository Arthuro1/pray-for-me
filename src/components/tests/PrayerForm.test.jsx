// @vitest-environment jsdom
//
// Quick Add asks ONE question — who or what to pray for. A note is folded, and
// the details (who it is for, categories, prayer rhythm) are rows that state
// their value and open one at a time.
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
import { weekdayName } from '../../lib/scheduleDraft';
import { todayKey } from '../../lib/prayedLog';
import { t } from '../../i18n';

const lang = 'fr';
afterEach(cleanup);

const startsWith = (key) => new RegExp(`^${t(lang, key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
// Scheduling rows are named "<label> <sub-line>", so match from the start.
const rhythmRadio = (key) => screen.getByRole('radio', { name: startsWith(key) });
// A detail row is named "<label> <value>".
const detailRow = (key) => screen.getByRole('button', { name: startsWith(key) });

beforeEach(() => {
  usePrayerStore.setState({ categories: [], settings: { language: lang } });
});

describe('PrayerForm — Quick Add', () => {
  it('asks only who/what to pray for; the note and every detail wait folded', () => {
    render(<PrayerForm onClose={() => {}} />);
    expect(screen.getByText(t(lang, 'prayerFieldLabel'))).toBeTruthy();
    expect(screen.getByPlaceholderText(t(lang, 'prayerSubjectPlaceholder'))).toBeTruthy();
    // The note textarea and every detail's control wait behind their rows; the
    // rows only state what is already true.
    expect(screen.queryByRole('textbox', { name: t(lang, 'details') })).toBeNull();
    expect(screen.queryByText(t(lang, 'forOther'))).toBeNull();
    expect(screen.queryByText(t(lang, 'schedWhenAppear'))).toBeNull();
    expect(screen.getByText(t(lang, 'addNote'))).toBeTruthy();
    expect(detailRow('forWhomLabel').textContent).toContain(t(lang, 'forWhomMe'));
    expect(detailRow('schedRhythmLabel').getAttribute('aria-expanded')).toBe('false');
    // One way forward; the ✕ is the way out.
    expect(screen.queryByRole('button', { name: t(lang, 'cancel') })).toBeNull();
  });

  it('opens on the one row a contextual invitation asked about', () => {
    const legacy = { id: 'p1', title: 'Ancienne', schedule: null, prayer_categories: [] };
    render(<PrayerForm onClose={() => {}} editPrayer={legacy} initialDetail="rhythm" />);
    expect(detailRow('schedRhythmLabel').getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(t(lang, 'schedWhenAppear'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'forOther'))).toBeNull();
  });

  it('"Add a note" reveals the note field', () => {
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'addNote')));
    expect(screen.getByRole('textbox', { name: t(lang, 'details') })).toBeTruthy();
  });

  it('the note field is WYSIWYG and offers every formatting action', () => {
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'addNote')));
    const note = screen.getByRole('textbox', { name: t(lang, 'details') });
    note.innerHTML = '<strong>important</strong><ol><li>first</li></ol>';
    fireEvent.input(note);
    expect(note.querySelector('strong').textContent).toBe('important');
    expect(note.querySelector('ol li').textContent).toBe('first');
    for (const key of ['formatBold', 'formatItalic', 'formatUnderline', 'formatList', 'formatOrderedList', 'formatRemove']) {
      expect(screen.getByRole('button', { name: t(lang, key) })).toBeTruthy();
    }
  });

  it('opens one detail at a time: who it is for, its labels, its rhythm', () => {
    usePrayerStore.setState({
      categories: [{ id: 'c1', name: 'Famille', emoji: '👨‍👩‍👧', color: '#7c5cfc' }],
      settings: { language: lang },
    });
    render(<PrayerForm onClose={() => {}} />);
    expect(detailRow('categories').textContent).toContain(t(lang, 'categoriesNone'));

    fireEvent.click(detailRow('forWhomLabel'));
    expect(screen.getByText(t(lang, 'forOther'))).toBeTruthy();

    // Opening the labels folds the person away again.
    fireEvent.click(detailRow('categories'));
    expect(screen.queryByText(t(lang, 'forOther'))).toBeNull();
    const labels = screen.getByRole('group', { name: t(lang, 'categories') });
    fireEvent.click(within(labels).getByRole('button', { name: /Famille/ }));
    expect(within(labels).getByRole('button', { name: /Famille/ }).getAttribute('aria-pressed')).toBe('true');
    expect(detailRow('categories').textContent).toContain('Famille');

    // The scheduler waits behind the rhythm row, one tap away.
    expect(screen.queryByText(t(lang, 'schedWhenAppear'))).toBeNull();
    fireEvent.click(detailRow('schedRhythmLabel'));
    expect(screen.getByText(t(lang, 'schedWhenAppear'))).toBeTruthy();
    expect(screen.queryByRole('group', { name: t(lang, 'categories') })).toBeNull();
  });

  it('keeps a long list of labels behind "Add" once some are chosen', () => {
    usePrayerStore.setState({
      categories: [
        { id: 'c1', name: 'Famille', emoji: '🏠', color: '#7c5cfc' },
        { id: 'c2', name: 'Santé', emoji: '🙏', color: '#4F7A6B' },
      ],
      settings: { language: lang },
    });
    const editPrayer = { id: 'p1', title: 'Ma mère', prayer_categories: [{ category_id: 'c1' }], schedule: null };
    render(<PrayerForm onClose={() => {}} editPrayer={editPrayer} />);
    fireEvent.click(detailRow('categories'));
    const labels = screen.getByRole('group', { name: t(lang, 'categories') });
    expect(within(labels).getByRole('button', { name: /Famille/ }).getAttribute('aria-pressed')).toBe('true');
    expect(within(labels).queryByRole('button', { name: /Santé/ })).toBeNull();
    fireEvent.click(within(labels).getByRole('button', { name: t(lang, 'addCategoryFull') }));
    expect(within(labels).getByRole('button', { name: /Santé/ }).getAttribute('aria-pressed')).toBe('false');
  });

  it('a rhythm chosen in the scheduler maps onto a real schedule (daily)', () => {
    const addPrayer = vi.fn(async () => null);
    usePrayerStore.setState({ addPrayer });
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(detailRow('schedRhythmLabel'));
    fireEvent.click(rhythmRadio('schedOtherRhythm'));
    fireEvent.click(rhythmRadio('schedEveryDay'));
    fireEvent.click(screen.getByText(t(lang, 'schedUseRhythm')));
    // Folded again, the row names the new rhythm and holds focus.
    expect(detailRow('schedRhythmLabel').textContent).toContain(t(lang, 'schedDaily'));
    expect(document.activeElement).toBe(detailRow('schedRhythmLabel'));
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
    fireEvent.click(detailRow('schedRhythmLabel'));
    fireEvent.click(rhythmRadio('schedOtherRhythm'));
    fireEvent.click(rhythmRadio('schedEveryDay'));
    // The scheduler's own Cancel.
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

  it('states the weekly default in words on its row', () => {
    render(<PrayerForm onClose={() => {}} />);
    // The compact row states the rhythm this prayer already has — no chips, no
    // decision to make, and the weekday it names is today's.
    const row = detailRow('schedRhythmLabel');
    expect(row.textContent).toContain(weekdayName(lang, parseKey(todayKey()).getDay()));
    // Opening the scheduler does not preselect the "no fixed schedule" mode.
    fireEvent.click(row);
    expect(rhythmRadio('schedNoFixed').checked).toBe(false);
    expect(rhythmRadio('schedOtherRhythm').checked).toBe(true);
  });

  it('editing a legacy unscheduled prayer shows it as "no fixed schedule"', () => {
    const updatePrayer = vi.fn();
    usePrayerStore.setState({ updatePrayer });
    const legacy = { id: 'p1', title: 'Ancienne', schedule: null, prayer_categories: [{ category_id: 'c1' }] };
    render(<PrayerForm onClose={() => {}} editPrayer={legacy} />);
    // Categories are labels now: a schedule-less prayer reads as "no fixed schedule".
    expect(screen.getByText(t(lang, 'schedRhythmLabel'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'rhythmPlanHint'))).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'schedRhythmLabel')));
    expect(rhythmRadio('schedNoFixed').checked).toBe(true);
    const scheduler = screen.getByText(t(lang, 'schedUseRhythm')).closest('div');
    fireEvent.click(within(scheduler).getByText(t(lang, 'cancel')));
    // Saving records the explicit choice — { type: 'none' }, not a null plan.
    fireEvent.click(screen.getByText(t(lang, 'save')));
    expect(updatePrayer).toHaveBeenCalledTimes(1);
    expect(updatePrayer).toHaveBeenCalledWith('p1', expect.objectContaining({ schedule: { type: 'none' } }));
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
    const note = screen.getByRole('textbox', { name: t(lang, 'details') });
    note.textContent = 'Un détail important';
    fireEvent.input(note);
    // Collapse, then reopen: the entered note is still there.
    fireEvent.click(noteToggle);
    expect(screen.queryByRole('textbox', { name: t(lang, 'details') })).toBeNull();
    fireEvent.click(noteToggle);
    expect(screen.getByRole('textbox', { name: t(lang, 'details') }).textContent).toBe('Un détail important');
  });

  it('uses a real labelled checkbox for "for someone else" (keyboard/screen-reader operable)', () => {
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(detailRow('forWhomLabel'));
    const checkbox = screen.getByRole('checkbox', { name: t(lang, 'forOther') });
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(detailRow('forWhomLabel').textContent).toContain(t(lang, 'forWhomSomeone'));
    fireEvent.change(screen.getByLabelText(t(lang, 'personName')), { target: { value: 'Marie' } });
    expect(detailRow('forWhomLabel').textContent).toContain('Marie');
  });

  it('the icon-only close button has an accessible name, and the title field a label', () => {
    render(<PrayerForm onClose={() => {}} />);
    expect(screen.getByRole('button', { name: t(lang, 'close') })).toBeTruthy();
    expect(screen.getByLabelText(t(lang, 'prayerFieldLabel'))).toBeTruthy();
  });
});
