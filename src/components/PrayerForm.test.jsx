// @vitest-environment jsdom
//
// Quick Add: a brand-new personal prayer must open to just a subject + detail,
// with categories / scheduling / "for someone else" tucked behind More options,
// so the first prayer is one field away. French is the always-loaded locale, so
// assertions go through t() to verify the show/hide LOGIC rather than pin copy.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

// Supabase builds its realtime layer at construct time (throws on older Node in
// CI); the form only needs the store shape, so stub the client to no-ops.
vi.mock('../lib/supabase', () => {
  const chain = {
    upsert: () => Promise.resolve({ data: null, error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return { supabase: { auth: { getUser: async () => ({ data: { user: null } }) }, from: () => chain } };
});

import PrayerForm from './PrayerForm';
import usePrayerStore from '../store/prayerStore';
import { t } from '../i18n';

const lang = 'fr';
afterEach(cleanup);

beforeEach(() => {
  usePrayerStore.setState({ categories: [], settings: { language: lang } });
});

describe('PrayerForm — Quick Add', () => {
  it('opens collapsed to just subject + detail, hiding scheduling and categories', () => {
    render(<PrayerForm onClose={() => {}} />);
    expect(screen.getByPlaceholderText(t(lang, 'prayerSubjectPlaceholder'))).toBeTruthy();
    expect(screen.getByPlaceholderText(t(lang, 'detailsPlaceholder'))).toBeTruthy();
    // The schedule editor and "for someone else" live behind More options.
    expect(screen.queryByText(t(lang, 'scheduleHowOften'))).toBeNull();
    expect(screen.queryByText(t(lang, 'forOther'))).toBeNull();
    expect(screen.getByText(t(lang, 'moreOptions'))).toBeTruthy();
  });

  it('"More options" reveals scheduling and the for-someone-else field', () => {
    render(<PrayerForm onClose={() => {}} />);
    fireEvent.click(screen.getByText(t(lang, 'moreOptions')));
    expect(screen.getByText(t(lang, 'scheduleHowOften'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'forOther'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'fewerOptions'))).toBeTruthy();
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
