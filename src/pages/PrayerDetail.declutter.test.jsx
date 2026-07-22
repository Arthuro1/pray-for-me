// @vitest-environment jsdom
//
// Prayer Detail leads with prayer, not configuration: Pray now → Add update →
// Mark answered up top; scheduling lives in the ⋯ overflow (opened on demand,
// never a permanently expanded editor); a saved-from-community copy shows its
// "From [group]" source badge; audience and encryption are separate statuses.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../lib/supabase', () => {
  const chain = {
    upsert: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    not: () => chain,
    order: () => chain,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve) => resolve({ data: [], error: null }),
  };
  return {
    supabase: {
      auth: { getSession: async () => ({ data: { session: null } }), getUser: async () => ({ data: { user: null } }) },
      from: () => chain,
      rpc: async () => ({ data: null, error: null }),
    },
  };
});
vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../lib/mutationQueue', () => ({
  enqueue: vi.fn(),
  pendingPrayerIds: () => new Set(),
}));

import PrayerDetail from './PrayerDetail';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import useFollowUpStore from '../store/followUpStore';
import { t } from '../i18n';

const lang = 'fr';

const base = (extra = {}) => ({
  id: 'p1',
  title: 'Ma prière',
  description: 'Détails',
  status: 'active',
  created_at: '2026-07-01T00:00:00Z',
  prayer_categories: [],
  prayer_points: [],
  prayer_updates: [],
  prayer_testimonies: [],
  ...extra,
});

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: null });
  useFollowUpStore.setState({ followUps: {} });
  useCommunityStore.setState({ groups: [], prayers: [], prayerShares: {}, testimonies: [], userReactions: new Set() });
});

const renderDetail = (prayer) => {
  usePrayerStore.setState({ prayers: [prayer], categories: [], completions: {}, settings: { language: lang } });
  return render(<PrayerDetail prayer={prayer} onBack={() => {}} onEdit={() => {}} lang={lang} />);
};

describe('PrayerDetail — leads with prayer', () => {
  it('shows Pray now, Add update and Mark answered as the leading actions', () => {
    renderDetail(base());
    expect(screen.getByText(t(lang, 'prayNow'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'addUpdateBtn'))).toBeTruthy();
    expect(screen.getAllByText(t(lang, 'markAnswered')).length).toBeGreaterThan(0);
  });

  it('orders the hierarchy Pray now → Add update → Mark answered in the document', () => {
    const { container } = renderDetail(base());
    const order = [...container.querySelectorAll('button')].map((b) => b.textContent.trim());
    const at = (label) => order.findIndex((text) => text === label);
    expect(at(t(lang, 'prayNow'))).toBeGreaterThan(-1);
    expect(at(t(lang, 'prayNow'))).toBeLessThan(at(t(lang, 'addUpdateBtn')));
    expect(at(t(lang, 'addUpdateBtn'))).toBeLessThan(at(t(lang, 'markAnswered')));
  });

  it('offers Mark answered EXACTLY once — the disclosure it opens holds the confirm', () => {
    renderDetail(base());
    expect(screen.getAllByText(t(lang, 'markAnswered')).length).toBe(1);
    // Nothing is answered until the disclosure's own confirm is pressed.
    expect(screen.queryByText(t(lang, 'confirm'))).toBeNull();

    const markAnswered = screen.getByRole('button', { name: new RegExp(t(lang, 'markAnswered')) });
    expect(markAnswered.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(markAnswered);
    expect(markAnswered.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(markAnswered.getAttribute('aria-controls'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'confirm'))).toBeTruthy();
    // Still exactly one entry point, not a second competing button.
    expect(screen.getAllByText(t(lang, 'markAnswered')).length).toBe(1);
  });

  it('completes the prayer only through the disclosure’s confirm', () => {
    const markAnswered = vi.fn();
    renderDetail(base());
    usePrayerStore.setState({ markAnswered });

    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'markAnswered')) }));
    expect(markAnswered).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'confirm')) }));
    expect(markAnswered).toHaveBeenCalledWith('p1', '', []);
  });

  it('Add update is immediately reachable — it focuses the real update field, no new form', () => {
    const { container } = renderDetail(base());
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'addUpdateBtn')) }));
    expect(container.querySelector('#pd-updates [contenteditable]')).toBeTruthy();
  });

  it('an answered prayer offers Resume, never Mark answered', () => {
    renderDetail(base({ status: 'answered', answered_at: '2026-07-02T00:00:00Z' }));
    expect(screen.queryByText(t(lang, 'markAnswered'))).toBeNull();
    expect(screen.queryByText(t(lang, 'prayNow'))).toBeNull();
    expect(screen.getByText(t(lang, 'resumePrayer'))).toBeTruthy();
  });

  it('keeps the leading actions on a 44px target and lets long labels truncate, not overflow', () => {
    renderDetail(base());
    for (const key of ['addUpdateBtn', 'markAnswered']) {
      const btn = screen.getByRole('button', { name: new RegExp(t(lang, key)) });
      expect(btn.className).toMatch(/min-h-\[44px\]/);
      expect(btn.className).toMatch(/min-w-0/);
      expect(btn.querySelector('span').className).toMatch(/truncate/);
    }
  });

  it('never renders the schedule editor by default — only a quiet summary when one exists', () => {
    renderDetail(base({ schedule: { type: 'recurring', freq: 'weekly', weekDays: [1], startDate: '2026-01-01' } }));
    // No Save/Cancel editor buttons in the main flow.
    expect(screen.queryByText(t(lang, 'save'))).toBeNull();
    // No inline add/edit schedule pill either — scheduling moved to the ⋯ menu.
    expect(screen.queryByText(t(lang, 'addSchedule'))).toBeNull();
  });

  it('Schedule from the overflow opens the planner as a contextual disclosure', () => {
    renderDetail(base());
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'options') }));
    fireEvent.click(screen.getByRole('menuitem', { name: t(lang, 'addSchedule') }));
    // The editor opens directly (no second tap), asking its one question and
    // offering a specific primary action next to Cancel.
    expect(screen.getByText(t(lang, 'schedWhenAppear'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'schedUseRhythm'))).toBeTruthy();

    fireEvent.click(screen.getByText(t(lang, 'cancel')));
    expect(screen.queryByText(t(lang, 'schedUseRhythm'))).toBeNull();
    // Closing hands focus back to the ⋯ trigger it was opened from.
    expect(document.activeElement).toBe(screen.getByRole('button', { name: t(lang, 'options') }));
  });
});

describe('PrayerDetail — audience & source badges', () => {
  it('a saved-from-community copy shows its From [group] badge (not hidden for read-only copies)', () => {
    renderDetail(base({ community_origin_id: 'c1', origin_group_name: 'Église' }));
    expect(screen.getByText(t(lang, 'audienceFromGroup', { name: 'Église' }))).toBeTruthy();
  });

  it('audience and encryption render as separate statuses on an encrypted private prayer', () => {
    renderDetail(base({ encryption_version: 1 }));
    expect(screen.getByText(t(lang, 'audiencePrivate'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'protEncrypted'))).toBeTruthy();
  });

  it('never labels a plaintext prayer encrypted — protection is read per prayer', () => {
    renderDetail(base());
    expect(screen.getByText(t(lang, 'audiencePrivate'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'protEncrypted'))).toBeNull();
    expect(screen.queryByText(t(lang, 'protEncryptedLocked'))).toBeNull();
  });

  it('says so plainly when an encrypted prayer cannot be opened on this device', () => {
    renderDetail(base({ encryption_version: 1, _locked: true }));
    expect(screen.getByText(t(lang, 'protEncryptedLocked'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'protEncrypted'))).toBeNull();
  });

  it('a saved-from-community copy keeps its source and privacy labels visible', () => {
    renderDetail(base({ community_origin_id: 'c1', origin_group_name: 'Église', encryption_version: 1 }));
    expect(screen.getByText(t(lang, 'audienceFromGroup', { name: 'Église' }))).toBeTruthy();
    expect(screen.getByText(t(lang, 'protEncrypted'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'followsGroup'))).toBeTruthy();
  });
});
