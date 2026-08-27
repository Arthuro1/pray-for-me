// @vitest-environment jsdom
//
// Creating a prayer stays one question, but the rhythm it silently receives is
// no longer hidden: a quiet line under the subject states when the prayer comes
// back, and one tap opens the real control. And what someone has typed but not
// yet saved survives an accidental close.
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
import { defaultNewSchedule, returnsSummary, weekdayName } from '../lib/scheduleDraft';
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
  it('states when a new prayer comes back, using the real weekday', async () => {
    renderForm();
    await settled();
    const today = weekdayName(lang, parseKey(todayKey()).getDay());
    const line = returnsSummary(defaultNewSchedule(), lang);

    expect(screen.getByText(line)).toBeTruthy();
    expect(line).toContain(today);
    // Secondary information, not another field to fill in.
    expect(screen.queryByLabelText(line)).toBeNull();
  });

  it('gives screen readers the rhythm AND what the control does', async () => {
    renderForm();
    await settled();
    const change = screen.getByRole('button', {
      name: `${returnsSummary(defaultNewSchedule(), lang)} — ${t(lang, 'rhythmChangeAria')}`,
    });
    expect(change).toBeTruthy();
  });

  it('leaves Organize collapsed until the rhythm line is used', async () => {
    renderForm();
    await settled();
    const organize = screen.getByRole('button', { name: new RegExp(t(lang, 'organizeLabel')) });
    expect(organize.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'rhythmChangeAria')) }));
    expect(organize.getAttribute('aria-expanded')).toBe('true');
    // …and the rhythm control itself is what the user lands on.
    const rhythmRow = screen.getByRole('button', { name: new RegExp(t(lang, 'schedRhythmLabel')) });
    expect(document.activeElement).toBe(rhythmRow);
  });

  it('follows a changed rhythm immediately', async () => {
    renderForm();
    await settled();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'rhythmChangeAria')) }));
    // Open the editor, choose "every day", and use it.
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'schedRhythmLabel')) }));
    fireEvent.click(screen.getByText(t(lang, 'schedEveryDay')));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'schedUseRhythm') }));

    const daily = t(lang, 'rhythmReturns', { phrase: t(lang, 'sentDaily') });
    expect(screen.getByText(daily)).toBeTruthy();
    expect(screen.queryByText(returnsSummary(defaultNewSchedule(), lang))).toBeNull();
  });

  it('shows an edited prayer its own existing schedule', async () => {
    const editPrayer = {
      id: 'p1', title: 'Une prière', description: '', prayer_categories: [],
      schedule: { type: 'recurring', freq: 'daily', startDate: todayKey(), end: { kind: 'never' } },
    };
    renderForm({ editPrayer });
    await settled();
    expect(screen.getByText(t(lang, 'rhythmReturns', { phrase: t(lang, 'sentDaily') }))).toBeTruthy();
  });

  it('says nothing about a rhythm on a community request (there is none)', async () => {
    renderForm({ communityMode: true, onCommunitySubmit: vi.fn() });
    await settled();
    expect(screen.queryByText(returnsSummary(defaultNewSchedule(), lang))).toBeNull();
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
