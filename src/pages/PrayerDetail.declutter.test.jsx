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
    // The editor opens directly (no second tap), with its Save/Cancel pair.
    expect(screen.getByText(t(lang, 'save'))).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'cancel')));
    expect(screen.queryByText(t(lang, 'save'))).toBeNull();
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
});
