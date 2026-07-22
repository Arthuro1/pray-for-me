// @vitest-environment jsdom
//
// The controls this refinement pass touched: named, tappable, keyboard-operable,
// and readable in RTL and with long translated labels. Icon-only buttons must
// carry a real accessible name — a `title` tooltip alone is not one.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../lib/supabase', () => {
  const chain = {
    upsert: () => chain, insert: () => chain, update: () => chain, delete: () => chain,
    select: () => chain, eq: () => chain, in: () => chain, order: () => chain,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve) => resolve({ data: [], error: null }),
  };
  return {
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }),
        getUser: async () => ({ data: { user: null } }),
      },
      from: () => chain,
      rpc: async () => ({ data: null, error: null }),
    },
  };
});
vi.mock('../../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../../lib/mutationQueue', () => ({ enqueue: vi.fn(), pendingPrayerIds: () => new Set() }));

import PrayerDetail from '../../pages/PrayerDetail';
import PrayerSavedStep from '../PrayerSavedStep';
import SourceLanguageField from '../SourceLanguageField';
import Toaster from '../shared/Toaster';
import usePrayerStore from '../../store/prayerStore';
import useCommunityStore from '../../store/communityStore';
import useAuthStore from '../../store/authStore';
import useFollowUpStore from '../../store/followUpStore';
import useToastStore from '../../store/toastStore';
import { t, isRtl, dirFor } from '../../i18n';

const lang = 'fr';

const prayer = (extra = {}) => ({
  id: 'p1', title: 'Ma prière', description: 'Détails', status: 'active',
  created_at: '2026-07-01T00:00:00Z',
  prayer_categories: [], prayer_points: [], prayer_updates: [], prayer_testimonies: [],
  ...extra,
});

const renderDetail = (p = prayer(), l = lang) => {
  usePrayerStore.setState({ prayers: [p], categories: [], completions: {}, settings: { language: l } });
  return render(<PrayerDetail prayer={p} onBack={() => {}} onEdit={() => {}} lang={l} />);
};

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: null });
  useFollowUpStore.setState({ followUps: {} });
  useToastStore.setState({ toasts: [] });
  useCommunityStore.setState({ groups: [], prayers: [], prayerShares: {}, testimonies: [], userReactions: new Set() });
});

describe('icon-only controls carry a real accessible name', () => {
  it('names the Prayer Detail back and overflow controls, and sizes them to 44px', () => {
    renderDetail();
    for (const name of [t(lang, 'tipBack'), t(lang, 'options')]) {
      const btn = screen.getByRole('button', { name });
      expect(btn.className).toMatch(/w-11/);
      expect(btn.className).toMatch(/h-11/);
    }
  });

  it('names the update-submit control (not only via a tooltip)', () => {
    const { container } = renderDetail();
    // Chat-style composer: an empty field shows a mic; the send button appears
    // once there is text to send.
    const field = container.querySelector('#pd-updates [contenteditable]');
    field.textContent = 'God is good';
    fireEvent.input(field);
    const submit = screen.getByRole('button', { name: t(lang, 'tipSaveUpdate') });
    // getByRole matched on the accessible name, so it is not title-only.
    expect(submit.getAttribute('aria-label')).toBe(t(lang, 'tipSaveUpdate'));
    // A 44px circular touch target (w-11 h-11), not below the minimum.
    expect(submit.className).toMatch(/w-11/);
  });

  it('names the toast dismiss control in the user’s language', () => {
    usePrayerStore.setState({ settings: { language: lang } });
    useToastStore.setState({ toasts: [{ id: 1, type: 'success', message: 'Enregistré' }] });
    render(<Toaster />);
    expect(screen.getByRole('button', { name: t(lang, 'close') })).toBeTruthy();
  });
});

describe('status changes are announced without interrupting', () => {
  it('puts saved/copied/completed messages in a polite live region', () => {
    useToastStore.setState({ toasts: [{ id: 1, type: 'success', message: 'Enregistré' }] });
    const { container } = render(<Toaster />);
    const region = container.querySelector('[role="status"]');
    expect(region).toBeTruthy();
    expect(region.getAttribute('aria-live')).toBe('polite'); // never 'assertive'
    expect(region.textContent).toContain('Enregistré');
  });

  it('keeps the region mounted while empty, so an added toast reads as a change', () => {
    useToastStore.setState({ toasts: [] });
    const { container } = render(<Toaster />);
    expect(container.querySelector('[role="status"]')).toBeTruthy();
  });
});

describe('disclosures expose their state', () => {
  it('Mark answered and the language picker both use aria-expanded + aria-controls', () => {
    renderDetail();
    const answer = screen.getByRole('button', { name: new RegExp(t(lang, 'markAnswered')) });
    expect(answer.getAttribute('aria-expanded')).toBe('false');
    expect(answer.getAttribute('aria-controls')).toBeTruthy();
    fireEvent.click(answer);
    expect(answer.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(answer.getAttribute('aria-controls'))).toBeTruthy();

    cleanup();
    render(<SourceLanguageField value="fr" onChange={() => {}} sampleText="" lang={lang} />);
    const change = screen.getByRole('button', { name: t(lang, 'sourceLangChange') });
    expect(change.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(change);
    expect(document.getElementById(change.getAttribute('aria-controls'))).toBeTruthy();
  });
});

describe('keyboard operation', () => {
  it('the language correction uses native button/select — Enter and Space work for free', () => {
    const onChange = vi.fn();
    render(<SourceLanguageField value="fr" onChange={onChange} sampleText="" lang={lang} />);
    const change = screen.getByRole('button', { name: t(lang, 'sourceLangChange') });
    expect(change.tagName).toBe('BUTTON');

    change.focus();
    expect(document.activeElement).toBe(change);
    // A native button activates on both keys via a click event; assert the
    // element type that guarantees it rather than simulating the browser.
    fireEvent.click(change);
    const select = screen.getByLabelText(t(lang, 'sourceLangLabel'));
    expect(select.tagName).toBe('SELECT');
    expect(select.disabled).toBe(false);
  });

  it('returns focus to the trigger when the saved confirmation closes', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    usePrayerStore.setState({ prayers: [prayer()], categories: [], completions: {}, settings: { language: lang } });
    const { unmount } = render(<PrayerSavedStep prayerId="p1" title="Ma prière" description="" lang={lang} onClose={() => {}} />);
    expect(document.activeElement).not.toBe(trigger); // trapped inside the dialog

    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});

describe('RTL and long translated labels', () => {
  it('renders the leading actions in Arabic without losing the hierarchy', () => {
    expect(isRtl('ar')).toBe(true);
    expect(dirFor('ar')).toBe('rtl');
    renderDetail(prayer(), 'ar');
    expect(screen.getByText(t('ar', 'prayNow'))).toBeTruthy();
    expect(screen.getByText(t('ar', 'addUpdateBtn'))).toBeTruthy();
    expect(screen.getByText(t('ar', 'markAnswered'))).toBeTruthy();
  });

  it('lets the longest translated action labels truncate rather than overflow', () => {
    // German is the widest of the set for these two actions.
    renderDetail(prayer(), 'de');
    for (const key of ['addUpdateBtn', 'markAnswered']) {
      const label = screen.getByText(t('de', key));
      expect(label.className).toMatch(/truncate/);
      expect(label.closest('button').className).toMatch(/min-w-0/);
    }
  });

  it('stacks the secondary actions on the narrowest phones instead of squeezing them', () => {
    const { container } = renderDetail();
    const row = screen.getByText(t(lang, 'addUpdateBtn')).closest('button').parentElement;
    expect(row.className).toMatch(/flex-col/);
    expect(row.className).toMatch(/min-\[380px\]:flex-row/);
    expect(container.querySelector('[dir]')).toBeNull(); // dir is owned by <html>, not duplicated here
  });
});

describe('state is never colour alone', () => {
  it('marks an encrypted-but-locked prayer with distinct TEXT, not just a tint', () => {
    renderDetail(prayer({ encryption_version: 1, _locked: true }));
    expect(screen.getByText(t(lang, 'protEncryptedLocked'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'protEncrypted'))).toBeNull();
  });
});
