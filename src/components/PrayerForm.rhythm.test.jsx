// @vitest-environment jsdom
//
// Creating a prayer stays one question, but the rhythm it silently receives is
// never hidden: its row states when the prayer comes back, and one tap on that
// row opens the real control. And what someone has typed but not yet saved
// survives an accidental close.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';

// The draft store is exercised for real in prayerFormDrafts.test.js; here we only
// care that the form reads and writes it at the right moments, so it is faked in
// memory (jsdom has no IndexedDB and no crypto.subtle).
const drafts = vi.hoisted(() => new Map());
vi.mock('../lib/prayerFormDrafts', async (orig) => ({
  ...(await orig()),
  saveFormDraft: vi.fn(async (slot, fields) => { drafts.set(slot, fields); return 'saved'; }),
  loadFormDraft: vi.fn(async (slot) => drafts.get(slot) ?? null),
  clearFormDraft: vi.fn(async (slot) => { drafts.delete(slot); }),
}));

import PrayerForm from './PrayerForm';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import { DRAFT_SLOTS, saveFormDraft, clearFormDraft } from '../lib/prayerFormDrafts';
import { defaultNewSchedule, scheduleSummary, weekdayName } from '../lib/scheduleDraft';
import { parseKey } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import { t } from '../i18n';

const lang = 'fr';
const addPrayer = vi.fn(async () => 'new-prayer-id');
const updatePrayer = vi.fn();

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  drafts.clear();
  useCommunityStore.setState({ prayerShares: {} });
  usePrayerStore.setState({
    prayers: [], categories: [], settings: { language: lang },
    addPrayer, updatePrayer,
  });
});

const renderForm = (props = {}) => render(<PrayerForm onClose={() => {}} {...props} />);
// The form restores its draft asynchronously; every assertion waits for that to
// settle so nothing races the one-shot read.
const settled = () => act(async () => { await Promise.resolve(); });

describe('PrayerForm — the default rhythm is visible before saving', () => {
  const rhythmRow = () => screen.getByRole('button', { name: new RegExp(t(lang, 'schedRhythmLabel')) });

  it('states when a new prayer comes back, using the real weekday', async () => {
    renderForm();
    await settled();
    const today = weekdayName(lang, parseKey(todayKey()).getDay());
    const summary = scheduleSummary(defaultNewSchedule(), lang);

    expect(summary).toContain(today);
    expect(rhythmRow().textContent).toContain(summary);
    // Secondary information, not another field to fill in.
    expect(screen.queryByLabelText(summary)).toBeNull();
  });

  it('opens the real control from the same row that states the rhythm', async () => {
    renderForm();
    await settled();
    const row = rhythmRow();
    expect(row.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(row);
    expect(row.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(row.getAttribute('aria-controls'))).toBeTruthy();
  });

  it('follows a changed rhythm immediately', async () => {
    renderForm();
    await settled();
    // Open the editor, choose "every day", and use it.
    fireEvent.click(rhythmRow());
    fireEvent.click(screen.getByText(t(lang, 'schedEveryDay')));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'schedUseRhythm') }));

    expect(rhythmRow().textContent).toContain(t(lang, 'schedDaily'));
    expect(rhythmRow().textContent).not.toContain(scheduleSummary(defaultNewSchedule(), lang));
  });

  it('shows an edited prayer its own existing schedule', async () => {
    const editPrayer = {
      id: 'p1', title: 'Une prière', description: '', prayer_categories: [],
      schedule: { type: 'recurring', freq: 'daily', startDate: todayKey(), end: { kind: 'never' } },
    };
    renderForm({ editPrayer });
    await settled();
    expect(rhythmRow().textContent).toContain(t(lang, 'schedDaily'));
  });

  it('says nothing about a rhythm on a community request (there is none)', async () => {
    renderForm({ communityMode: true, onCommunitySubmit: vi.fn() });
    await settled();
    expect(screen.queryByText(t(lang, 'schedRhythmLabel'))).toBeNull();
  });
});

describe('PrayerForm — an unfinished prayer is not lost', () => {
  const type = (value) => fireEvent.change(
    screen.getByLabelText(t(lang, 'prayerFieldLabel')), { target: { value } },
  );

  it('keeps what is being typed, on this device only', async () => {
    vi.useFakeTimers();
    renderForm();
    await act(async () => { await Promise.resolve(); });
    type('Pour la santé de ma sœur');
    await act(async () => { vi.advanceTimersByTime(1000); });

    expect(saveFormDraft).toHaveBeenCalledWith(
      DRAFT_SLOTS.NEW_PRAYER,
      expect.objectContaining({ title: 'Pour la santé de ma sœur' }),
    );
    // Nothing about a draft reaches the server.
    expect(addPrayer).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('puts it back when the form is reopened, and says so once', async () => {
    drafts.set(DRAFT_SLOTS.NEW_PRAYER, {
      title: 'Pour la santé de ma sœur',
      description: 'Elle attend les résultats.',
      categoryIds: [],
    });
    renderForm();

    await waitFor(() => {
      expect(screen.getByLabelText(t(lang, 'prayerFieldLabel')).value).toBe('Pour la santé de ma sœur');
    });
    // The note it carried is opened, not silently hidden.
    expect(screen.getByText('Elle attend les résultats.')).toBeTruthy();
    expect(screen.getByText(t(lang, 'draftRestoredNote'))).toBeTruthy();
  });

  it('offers one way to start over, which really empties the form', async () => {
    drafts.set(DRAFT_SLOTS.NEW_PRAYER, { title: 'Un brouillon', description: '', categoryIds: [] });
    renderForm();
    await waitFor(() => expect(screen.getByText(t(lang, 'draftRestoredNote'))).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: t(lang, 'draftDiscardCta') }));
    expect(screen.getByLabelText(t(lang, 'prayerFieldLabel')).value).toBe('');
    expect(screen.queryByText(t(lang, 'draftRestoredNote'))).toBeNull();
    expect(clearFormDraft).toHaveBeenCalledWith(DRAFT_SLOTS.NEW_PRAYER);
  });

  it('forgets the draft once the prayer is really saved', async () => {
    renderForm();
    await settled();
    type('Pour la santé de ma sœur');
    await act(async () => {
      fireEvent.submit(screen.getByLabelText(t(lang, 'prayerFieldLabel')).closest('form'));
    });

    expect(addPrayer).toHaveBeenCalled();
    expect(clearFormDraft).toHaveBeenCalledWith(DRAFT_SLOTS.NEW_PRAYER);
  });

  it('does not let a keystroke still in flight resurrect the saved draft', async () => {
    vi.useFakeTimers();
    renderForm();
    await act(async () => { await Promise.resolve(); });
    // Type and submit INSIDE the save debounce — the pending timer must not
    // write an unfinished copy of a prayer that now exists.
    type('Pour la santé de ma sœur');
    await act(async () => { vi.advanceTimersByTime(200); });
    await act(async () => {
      fireEvent.submit(screen.getByLabelText(t(lang, 'prayerFieldLabel')).closest('form'));
    });
    saveFormDraft.mockClear();
    await act(async () => { vi.advanceTimersByTime(5000); });

    expect(saveFormDraft).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('never restores a new-prayer draft into an edit', async () => {
    drafts.set(DRAFT_SLOTS.NEW_PRAYER, { title: 'Un brouillon sans rapport', categoryIds: [] });
    renderForm({ editPrayer: { id: 'p1', title: 'La prière existante', prayer_categories: [] } });
    await settled();

    expect(screen.getByLabelText(t(lang, 'prayerFieldLabel')).value).toBe('La prière existante');
    expect(screen.queryByText(t(lang, 'draftRestoredNote'))).toBeNull();
  });

  it('never restores it into a community request either', async () => {
    drafts.set(DRAFT_SLOTS.NEW_PRAYER, { title: 'Un brouillon privé', categoryIds: [] });
    renderForm({ communityMode: true, onCommunitySubmit: vi.fn() });
    await settled();

    expect(screen.getByLabelText(t(lang, 'prayerSubject')).value).toBe('');
    expect(screen.queryByText(t(lang, 'draftRestoredNote'))).toBeNull();
  });
});
