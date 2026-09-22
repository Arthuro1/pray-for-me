// @vitest-environment jsdom
//
// A plan can be passed on while it is running: the day card and the ⋯ menu both
// open the Share sheet, and a run no longer offers to copy itself into a group
// wall instead. Only signed-in readers share, and only a plan, never a prayer.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../lib/supabase', () => {
  const chain = {
    upsert: () => chain, insert: () => chain, update: () => chain, delete: () => chain,
    select: () => chain, eq: () => chain, in: () => chain, not: () => chain, order: () => chain,
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
vi.mock('../lib/mutationQueue', () => ({ enqueue: vi.fn(), pendingPrayerIds: () => new Set() }));
// The sheet has its own tests; here it only has to open.
vi.mock('../components/plan/PlanShareSheet', () => ({ default: ({ plan }) => <div role="dialog" aria-label={`share ${plan.id}`} /> }));

import PrayerDetail from './PrayerDetail';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import useFollowUpStore from '../store/followUpStore';
import { addDays } from '../lib/schedule';
import { todayKey } from '../lib/prayedLog';
import { t } from '../i18n';

const lang = 'fr';
const START = addDays(todayKey(), -3);

const prayer = (schedule) => ({
  id: 'p1', title: 'x', description: '', status: 'active', created_at: '2026-07-01T00:00:00Z',
  prayer_categories: [], prayer_points: [], prayer_updates: [], prayer_testimonies: [], schedule,
});
const planRun = () => prayer({
  type: 'recurring', freq: 'daily', startDate: START,
  end: { kind: 'count', count: 30 }, plan: { id: 'others30', startDate: START },
});
const ordinary = () => prayer({ type: 'recurring', freq: 'daily', startDate: START, end: { kind: 'never' } });

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: { id: 'me' } });
  useFollowUpStore.setState({ followUps: {} });
  useCommunityStore.setState({ groups: [{ id: 'g1', name: 'Family' }], prayers: [], prayerShares: {}, testimonies: [], userReactions: new Set() });
});

const renderDetail = (p) => {
  usePrayerStore.setState({ prayers: [p], categories: [], completions: {}, settings: { language: lang } });
  return render(<PrayerDetail prayer={p} onBack={() => {}} onEdit={() => {}} lang={lang} />);
};
const openMenu = () => fireEvent.click(screen.getByRole('button', { name: t(lang, 'options') }));
const menuItem = (name) => screen.queryByRole('menuitem', { name });

describe('sharing a running plan', () => {
  it('offers the plan from its day card and opens the Share sheet', () => {
    renderDetail(planRun());
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'planShareAction') }));
    expect(screen.getByRole('dialog', { name: 'share others30' })).toBeTruthy();
  });

  it('offers the plan, not a group copy of the run, in the ⋯ menu', () => {
    renderDetail(planRun());
    openMenu();
    expect(menuItem(t(lang, 'planShareAction'))).toBeTruthy();
    expect(menuItem(t(lang, 'shareWithGroup'))).toBeNull();
  });

  it('keeps an ordinary prayer exactly as it was', () => {
    renderDetail(ordinary());
    expect(screen.queryByRole('button', { name: t(lang, 'planShareAction') })).toBeNull();
    openMenu();
    expect(menuItem(t(lang, 'planShareAction'))).toBeNull();
    expect(menuItem(t(lang, 'shareWithGroup'))).toBeTruthy();
  });

  it('offers nothing to share without an account', () => {
    useAuthStore.setState({ user: null });
    renderDetail(planRun());
    expect(screen.queryByRole('button', { name: t(lang, 'planShareAction') })).toBeNull();
  });
});
