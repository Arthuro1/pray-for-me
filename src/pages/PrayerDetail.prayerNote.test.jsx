// @vitest-environment jsdom
//
// A note captured while praying is not a different kind of thing: it lands in
// the prayer's ordinary update history, renders through the same RichText and
// attachment pipeline, and keeps the same edit/delete behaviour. The only
// difference is a quiet line saying where it came from.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

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
      storage: { from: () => ({ download: async () => ({ data: null, error: new Error('offline') }), remove: async () => ({}) }) },
    },
  };
});
vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../lib/mutationQueue', () => ({ enqueue: vi.fn(), pendingPrayerIds: () => new Set() }));
// Media decryption has its own tests; here we only care that the note's voice
// goes through the ORDINARY attachment renderer.
vi.mock('../hooks/useAttachmentUrl', () => ({ useAttachmentUrl: () => ({ url: 'blob:voice', error: null }) }));

const idbStore = vi.hoisted(() => new Map());
vi.hoisted(() => { globalThis.indexedDB = {}; });
vi.mock('idb-keyval', () => ({
  get: async (k) => idbStore.get(k),
  set: async (k, v) => { idbStore.set(k, v); },
  del: async (k) => { idbStore.delete(k); },
  keys: async () => [...idbStore.keys()],
}));

import PrayerDetail from './PrayerDetail';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import useAuthStore from '../store/authStore';
import useFollowUpStore from '../store/followUpStore';
import { __resetForTests } from '../lib/prayerNotes';
import { t } from '../i18n';

const lang = 'fr';
const NOTE_ID = 'update-from-session';

const prayerWith = (updates) => ({
  id: 'p1',
  title: 'Ma prière',
  description: '',
  status: 'active',
  created_at: '2026-07-01T00:00:00Z',
  prayer_categories: [],
  prayer_points: [],
  prayer_testimonies: [],
  prayer_updates: updates,
});

const sessionNote = {
  id: NOTE_ID,
  text: '**Psaume 46**\n- Appeler Sarah',
  attachments: [{ id: 'att-1', type: 'audio', path: 'u/att-1', mime: 'audio/mp4', name: 'prayer-note.m4a' }],
  created_at: '2026-08-20T10:42:00Z',
};

const ordinaryUpdate = { id: 'update-typed-later', text: 'Écrit depuis la page', attachments: [], created_at: '2026-08-21T09:00:00Z' };

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  idbStore.clear();
  __resetForTests();
  useAuthStore.setState({ user: null });
  useFollowUpStore.setState({ followUps: {} });
  useCommunityStore.setState({ groups: [], prayers: [], prayerShares: {}, testimonies: [], userReactions: new Set() });
});

const renderDetail = (prayer) => {
  usePrayerStore.setState({ prayers: [prayer], categories: [], completions: {}, settings: { language: lang } });
  return render(<PrayerDetail prayer={prayer} onBack={() => {}} onEdit={() => {}} lang={lang} />);
};

describe('PrayerDetail — a note captured during prayer', () => {
  it('appears in the ordinary history, labelled and fully rendered', async () => {
    idbStore.set('pfm_session_note_ids', [NOTE_ID]);
    const { container } = renderDetail(prayerWith([sessionNote]));

    await waitFor(() => expect(screen.getByText(new RegExp(t(lang, 'noteDuringPrayer')))).toBeTruthy());
    expect(screen.getByText(new RegExp(t(lang, 'noteLabel')))).toBeTruthy();

    // Same RichText renderer as any other update — real formatting, no raw markers.
    expect(container.querySelector('strong').textContent).toBe('Psaume 46');
    expect(container.querySelector('ul li').textContent).toBe('Appeler Sarah');
    expect(screen.queryByText(/\*\*Psaume/)).toBeNull();

    // Same attachment renderer — the voice note is playable in place.
    expect(container.querySelector('audio')).toBeTruthy();
  });

  it('keeps the normal update actions — edit and delete', async () => {
    idbStore.set('pfm_session_note_ids', [NOTE_ID]);
    renderDetail(prayerWith([sessionNote]));

    await waitFor(() => expect(screen.getByText(new RegExp(t(lang, 'noteDuringPrayer')))).toBeTruthy());
    expect(screen.getByRole('button', { name: t(lang, 'editUpdate') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t(lang, 'deleteUpdate') })).toBeTruthy();
  });

  it('leaves every other update unlabelled', async () => {
    idbStore.set('pfm_session_note_ids', [NOTE_ID]);
    renderDetail(prayerWith([ordinaryUpdate]));

    await waitFor(() => expect(screen.getByText(ordinaryUpdate.text)).toBeTruthy());
    expect(screen.queryByText(new RegExp(t(lang, 'noteDuringPrayer')))).toBeNull();
  });

  it('still shows the entry when this device has no record of where it came from', async () => {
    // The marker is device-local by design; another device just sees an update.
    renderDetail(prayerWith([sessionNote]));
    await waitFor(() => expect(screen.getByText('Appeler Sarah')).toBeTruthy());
    expect(screen.queryByText(new RegExp(t(lang, 'noteDuringPrayer')))).toBeNull();
  });
});
