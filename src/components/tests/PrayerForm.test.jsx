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

  it('creates a minimal prayer (title only, no schedule) from the collapsed form', () => {
    const addPrayer = vi.fn(async () => null); // null → the form just closes, no saved step
    const onClose = vi.fn();
    usePrayerStore.setState({ addPrayer });
    render(<PrayerForm onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText(t(lang, 'prayerSubjectPlaceholder')), {
      target: { value: 'Paix pour ma famille' },
    });
    fireEvent.click(screen.getByText(t(lang, 'savePrayer')));

    expect(addPrayer).toHaveBeenCalledTimes(1);
    expect(addPrayer.mock.calls[0][0]).toEqual(
      expect.objectContaining({ title: 'Paix pour ma famille', schedule: null })
    );
  });
});
