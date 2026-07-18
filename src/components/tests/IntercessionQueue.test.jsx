// @vitest-environment jsdom
//
// The intercession queue: only explicitly-carried requests enter it, filters
// appear only with more than one source, sessions resume with the first
// unfinished request, and completion updates the UI immediately (optimistic,
// via the ordinary per-prayer completion log — offline included).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../../lib/mutationQueue', () => ({
  enqueue: vi.fn(),
  pendingPrayerIds: () => new Set(),
}));

import IntercessionQueue from '../IntercessionQueue';
import usePrayerStore from '../../store/prayerStore';
import useCommunityStore from '../../store/communityStore';
import { todayKey } from '../../lib/prayedLog';
import { t } from '../../i18n';

const lang = 'fr';
const dayKey = todayKey();

const base = (id, extra = {}) => ({
  id, title: `Sujet ${id}`, status: 'active', created_at: '2026-01-01T00:00:00Z',
  prayer_categories: [], prayer_points: [], prayer_updates: [], ...extra,
});
const forOther = (id) => base(id, { for_other: true, person_name: 'Marc' });
const saved = (id) => base(id, { community_origin_id: `c-${id}`, origin_group_name: 'Église' });

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  usePrayerStore.setState({ prayers: [], categories: [], completions: {}, userId: 'u1', settings: { language: lang } });
  useCommunityStore.setState({ myCommitments: [] });
});

// A weekly schedule on a weekday other than today's — never due on dayKey.
const notTodayWeekday = (new Date().getDay() + 3) % 7;
const weeklyElsewhere = { type: 'recurring', freq: 'weekly', weekDays: [notTodayWeekday], startDate: '2026-01-01' };

describe('IntercessionQueue — membership', () => {
  it('renders nothing when no request was explicitly taken on', () => {
    usePrayerStore.setState({ prayers: [base('a'), base('b')] });
    const { container } = render(<IntercessionQueue lang={lang} />);
    expect(container.firstChild).toBeNull();
  });

  it('counts only committed requests, and hides filters with a single source', () => {
    usePrayerStore.setState({ prayers: [base('a'), forOther('b')] });
    render(<IntercessionQueue lang={lang} />);
    expect(screen.getByText(t(lang, 'intercessionRemaining', { n: 1 }))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'srcPersonal'))).toBeNull();
    expect(screen.queryByText(t(lang, 'srcGroups'))).toBeNull();
  });

  it('offers source filters once two sources exist, without touching completions', () => {
    usePrayerStore.setState({ prayers: [forOther('b'), saved('c')] });
    render(<IntercessionQueue lang={lang} />);
    expect(screen.getByText(t(lang, 'intercessionRemaining', { n: 2 }))).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'srcGroups')));
    expect(screen.getByText(t(lang, 'intercessionRemaining', { n: 1 }))).toBeTruthy();
    expect(usePrayerStore.getState().completions).toEqual({});
  });
});

describe('IntercessionQueue — session & resume', () => {
  it('praying updates completions immediately and the queue count on return', () => {
    usePrayerStore.setState({ prayers: [forOther('b'), forOther('d')] });
    render(<IntercessionQueue lang={lang} />);
    fireEvent.click(screen.getByText(t(lang, 'praySharedBtn')));
    // First unfinished request opens; advancing past it records completion.
    expect(screen.getByText('Sujet b')).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'continueBtn')));
    expect(usePrayerStore.getState().completions.b).toContain(dayKey);
    // Leave midway — progress is kept, count reflects it.
    fireEvent.click(screen.getByLabelText(t(lang, 'close')));
    expect(screen.getByText(t(lang, 'intercessionRemaining', { n: 1 }))).toBeTruthy();
  });

  it('resume starts at the first unfinished request, never repeating completed ones', () => {
    usePrayerStore.setState({
      prayers: [forOther('b'), forOther('d')],
      completions: { b: [dayKey] },
    });
    render(<IntercessionQueue lang={lang} />);
    fireEvent.click(screen.getByText(t(lang, 'praySharedBtn')));
    expect(screen.getByText('Sujet d')).toBeTruthy();
    expect(screen.queryByText('Sujet b')).toBeNull();
  });

  it('collapses to a compact status row when everything due was prayed today', () => {
    usePrayerStore.setState({ prayers: [forOther('b')], completions: { b: [dayKey] } });
    render(<IntercessionQueue lang={lang} />);
    expect(screen.getByText(t(lang, 'intercessionDone'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'praySharedBtn'))).toBeNull();
    // The full dashboard card retires — no title, no subtitle — until expanded.
    expect(screen.queryByText(t(lang, 'intercessionTitle'))).toBeNull();
    fireEvent.click(screen.getByText(t(lang, 'intercessionDone')));
    expect(screen.getByText(t(lang, 'intercessionTitle'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'prayAgainBtn'))).toBeTruthy();
  });
});

describe('IntercessionQueue — schedule-aware default', () => {
  it('excludes a weekly request not due today from the default queue but keeps it behind the disclosure', () => {
    usePrayerStore.setState({ prayers: [forOther('b'), { ...saved('c'), schedule: weeklyElsewhere }] });
    render(<IntercessionQueue lang={lang} />);
    // Only the due (legacy daily) request counts toward today's session.
    expect(screen.getByText(t(lang, 'intercessionRemaining', { n: 1 }))).toBeTruthy();
    const disclosure = screen.getByText(t(lang, 'intercessionAllCarried', { n: 2 }));
    fireEvent.click(disclosure);
    // Every carried request is listed, including the not-due one.
    expect(screen.getByText('Sujet c')).toBeTruthy();
    expect(screen.getByText('Sujet b')).toBeTruthy();
  });

  it('a prayer-chain claim for today pulls its saved copy into the due queue', () => {
    usePrayerStore.setState({ prayers: [{ ...saved('c'), schedule: weeklyElsewhere }] });
    useCommunityStore.setState({ myCommitments: [{ community_prayer_id: 'c-c', day: dayKey }] });
    render(<IntercessionQueue lang={lang} />);
    expect(screen.getByText(t(lang, 'intercessionRemaining', { n: 1 }))).toBeTruthy();
  });

  it('renders nothing at all only when nothing is carried — a not-due-only queue still shows the disclosure', () => {
    usePrayerStore.setState({ prayers: [{ ...saved('c'), schedule: weeklyElsewhere }] });
    render(<IntercessionQueue lang={lang} />);
    expect(screen.getByText(t(lang, 'intercessionAllCarried', { n: 1 }))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'praySharedBtn'))).toBeNull();
  });
});
