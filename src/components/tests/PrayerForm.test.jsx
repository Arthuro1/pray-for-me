// @vitest-environment jsdom
//
// Quick Add: a brand-new personal prayer surfaces categories and "for someone
// else" directly, and tucks only the recurrence schedule behind More options.
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
  it('surfaces "for someone else" directly and keeps only scheduling behind More options', () => {
    render(<PrayerForm onClose={() => {}} />);
    expect(screen.getByPlaceholderText(t(lang, 'prayerSubjectPlaceholder'))).toBeTruthy();
    expect(screen.getByPlaceholderText(t(lang, 'detailsPlaceholder'))).toBeTruthy();
    // "For someone else" is now visible up-front; only the schedule editor hides.
    expect(screen.getByText(t(lang, 'forOther'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'scheduleHowOften'))).toBeNull();
    expect(screen.getByText(t(lang, 'moreOptions'))).toBeTruthy();
  });

  it('"More options" reveals the recurrence schedule', () => {
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'moreOptions')));
    expect(screen.getByText(t(lang, 'scheduleHowOften'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'fewerOptions'))).toBeTruthy();
  });

  it('shows category chips directly, without opening More options', () => {
    usePrayerStore.setState({
      categories: [{ id: 'c1', name: 'Famille', emoji: '👨‍👩‍👧', color: '#7c5cfc' }],
      settings: { language: lang },
    });
    render(<PrayerForm onClose={() => {}} />);
    // Category is present up-front; the schedule editor still hides.
    expect(screen.getByText('Famille', { exact: false })).toBeTruthy();
    expect(screen.queryByText(t(lang, 'scheduleHowOften'))).toBeNull();
  });

  it('creates a minimal prayer (title only, no schedule) from the collapsed form', () => {
    const addPrayer = vi.fn(async () => null); // null → the form just closes, no Scripture step
    const onClose = vi.fn();
    usePrayerStore.setState({ addPrayer });
    render(<PrayerForm onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText(t(lang, 'prayerSubjectPlaceholder')), {
      target: { value: 'Paix pour ma famille' },
    });
    fireEvent.click(screen.getByText(t(lang, 'add')));

    expect(addPrayer).toHaveBeenCalledTimes(1);
    expect(addPrayer.mock.calls[0][0]).toEqual(
      expect.objectContaining({ title: 'Paix pour ma famille', schedule: null })
    );
  });
});
