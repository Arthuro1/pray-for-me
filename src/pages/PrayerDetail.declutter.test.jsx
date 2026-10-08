// @vitest-environment jsdom
//
// Prayer Detail leads with prayer, not configuration: Pray now → Add update →
// Mark answered up top; scheduling lives in the ⋯ overflow (opened on demand,
// never a permanently expanded editor); a saved-from-community copy shows its
// "From [group]" source badge; audience and encryption are separate statuses.
import { readFileSync } from 'node:fs';
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
import { t, tp } from '../i18n';
import { carriedSinceLabel } from '../lib/carried';

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
    const { container } = renderDetail(base());
    const prayNow = screen.getByRole('button', { name: t(lang, 'prayNow') });
    expect(prayNow).toBeTruthy();
    expect(prayNow.className).toContain('prayer-detail__pray');
    expect(container.querySelector('.prayer-detail__hero')?.contains(prayNow)).toBe(true);
    expect(screen.getByText(t(lang, 'addUpdateBtn'))).toBeTruthy();
    expect(screen.getAllByText(t(lang, 'markAnswered')).length).toBeGreaterThan(0);
  });

  it('keeps the hero focused on prayer without the rest caption or schedule', () => {
    const { container } = renderDetail(base({
      schedule: { type: 'recurring', freq: 'weekly', weekDays: [1], startDate: '2026-01-01' },
    }));
    const hero = container.querySelector('.prayer-detail__hero');
    expect(hero.textContent).not.toContain('Reposez-vous sous le ciel');
    // A long-carried prayer reads as memory: "Carried since July 2026".
    expect(hero.querySelector('.prayer-detail__meta').textContent)
      .toBe(t(lang, 'carriedSince', { date: carriedSinceLabel({ created_at: '2026-07-01T00:00:00Z' }, lang) }));
    expect(hero.querySelector('.prayer-detail__pray')).toBeTruthy();
  });

  it('adds a plain count of the days prayed — memory, never a score', () => {
    const prayer = base();
    usePrayerStore.setState({ prayers: [prayer], categories: [], completions: { p1: ['2026-08-01', '2026-08-02'] }, settings: { language: lang } });
    const { container } = render(<PrayerDetail prayer={prayer} onBack={() => {}} onEdit={() => {}} lang={lang} />);
    const meta = container.querySelector('.prayer-detail__meta').textContent;
    expect(meta).toContain(tp(lang, 'prayedDays', 2));
    expect(meta).not.toMatch(/%|streak|série/i);
  });

  it('after marking answered, asks once about a faithful next step — private by default', async () => {
    renderDetail(base());
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'markAnswered')) }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'confirm')) }));
    // The app records the person's own act; it never declares that God answered.
    expect(await screen.findByText(t(lang, 'answerMarked'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'answerNextTitle'))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'answerNextPrivate') }));
    expect(screen.queryByText(t(lang, 'answerNextTitle'))).toBeNull();
  });

  it('uses the shared primary button, filling its row on a phone', () => {
    renderDetail(base());
    const prayNow = screen.getByRole('button', { name: t(lang, 'prayNow') });
    expect(prayNow.className).toContain('primary-button');
    expect(prayNow.className).toContain('prayer-detail__pray');
    const css = readFileSync('src/styles/prayer.css', 'utf8');
    expect(css).toMatch(/@media \(max-width: 560px\)\s*\{\s*\.prayer-detail__pray \{ min-width: 0; flex: 1 1 auto; \}/);
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

  it('opens the optional testimony field at the same initial height as Confirm', () => {
    renderDetail(base());
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'markAnswered')) }));

    // The flow asks what happened and invites — never requires — a testimony.
    expect(screen.getByText(t(lang, 'answerWhatHappened'))).toBeTruthy();
    const testimony = screen.getByRole('textbox', { name: new RegExp(t(lang, 'recordTestimony')) });
    const confirm = screen.getByRole('button', { name: new RegExp(t(lang, 'confirm')) });

    expect(testimony.style.minHeight).toBe('24px');
    expect(confirm.className).toMatch(/min-h-\[44px\]/);
    expect(testimony.closest('.update-composer__input')?.className).toContain('update-composer__input');
  });

  it('Add update unfolds the update field; it is not standing open, and no empty heading shows', () => {
    const { container } = renderDetail(base());
    expect(container.querySelector('#pd-updates')).toBeNull();
    expect(screen.queryByText(t(lang, 'evolutions'))).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'addUpdateBtn')) }));
    expect(container.querySelector('#pd-updates [contenteditable]')).toBeTruthy();
    // Still no heading: it names updates that exist, not the field.
    expect(screen.queryByText(t(lang, 'evolutions'))).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'cancel') }));
    expect(container.querySelector('#pd-updates')).toBeNull();
  });

  it('titles the updates once there is one', () => {
    renderDetail(base({ prayer_updates: [{ id: 'u1', text: 'Une nouvelle', created_at: '2026-07-02T00:00:00Z' }] }));
    expect(screen.getByText(t(lang, 'evolutions'))).toBeTruthy();
    expect(screen.getByText('Une nouvelle')).toBeTruthy();
  });

  it('an answered prayer offers Resume, never Mark answered', () => {
    renderDetail(base({ status: 'answered', answered_at: '2026-07-02T00:00:00Z' }));
    expect(screen.queryByText(t(lang, 'markAnswered'))).toBeNull();
    expect(screen.queryByText(t(lang, 'prayNow'))).toBeNull();
    expect(screen.getByText(t(lang, 'resumePrayer'))).toBeTruthy();
  });

  it('keeps the leading actions on a 44px target and lets long labels truncate, not overflow', () => {
    const { container } = renderDetail(base());
    const row = container.querySelector('.prayer-detail__secondary-actions');
    for (const key of ['addUpdateBtn', 'markAnswered']) {
      const btn = screen.getByRole('button', { name: new RegExp(t(lang, key)) });
      expect(btn.className).toContain('secondary-button');
      expect(row.contains(btn)).toBe(true);
    }
    // The 44px target belongs to the button primitive; truncation to the row.
    expect(readFileSync('src/styles/components.css', 'utf8')).toMatch(/\.secondary-button,[\s\S]*?min-height: 44px;/);
    const css = readFileSync('src/styles/prayer.css', 'utf8');
    expect(css).toMatch(/\.prayer-detail__secondary-actions > \* \{ min-width: 0;/);
    expect(css).toMatch(/\.prayer-detail__secondary-actions > \* > span \{[^}]*text-overflow: ellipsis;/);
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
