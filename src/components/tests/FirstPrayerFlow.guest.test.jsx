// @vitest-environment jsdom
//
// The guest first-prayer flow lets a signed-out visitor pray BEFORE registering.
// Its contract: capture → pray → a gentle save decision, with NOTHING sent to the
// server along the way — the prayer text stays on the device until they choose to
// save it. The encrypted device-local storage itself is proven in the node-env
// guestPrayerDraft.test; here we stub it (a plain in-memory record) so the FLOW is
// deterministic and independent of jsdom's async crypto timing.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

// Recording Supabase double — any write here would be a privacy failure.
const rec = vi.hoisted(() => ({ writes: [], supabaseLoaded: false }));
vi.mock('../../lib/supabase', () => {
  rec.supabaseLoaded = true;
  const chain = {
    upsert: (p) => { rec.writes.push({ op: 'upsert', p }); return chain; },
    insert: (p) => { rec.writes.push({ op: 'insert', p }); return chain; },
    update: (p) => { rec.writes.push({ op: 'update', p }); return chain; },
    delete: () => chain, select: () => chain, eq: () => chain, order: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    then: (r) => r({ data: [], error: null, status: 200 }),
  };
  return {
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        getUser: async () => ({ data: { user: null } }),
      },
      from: () => chain,
      rpc: async () => ({ data: null, error: null }),
    },
  };
});
// Keep analytics inert (and off the network) in jsdom.
vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));
const guestAudio = vi.hoisted(() => ({
  start: vi.fn(async ({ trackId }) => ({ started: true, trackId })),
  stop: vi.fn(async () => {}),
}));
vi.mock('../../lib/audio/backgroundAudio', () => ({
  AUDIO_TRACKS: [
    { id: 'soft-piano', src: '/audio/piano-and-rain.mp3', labelKey: 'audioSoftPiano' },
    { id: 'ambient-pad', src: '/audio/ambient-pad.mp3', labelKey: 'audioAmbientPad' },
    { id: 'nature', src: '/audio/nature.mp3', labelKey: 'audioNature' },
    { id: 'soft-pad', src: '/audio/soft-pad.mp3', labelKey: 'audioSoftPad' },
    { id: 'silence', src: null, labelKey: 'audioSilence' },
  ],
  DEFAULT_AUDIO_TRACK_ID: 'silence',
  resolveTrack: (id) => ({
    'soft-piano': { id: 'soft-piano', labelKey: 'audioSoftPiano' },
    'ambient-pad': { id: 'ambient-pad', labelKey: 'audioAmbientPad' },
    nature: { id: 'nature', labelKey: 'audioNature' },
    'soft-pad': { id: 'soft-pad', labelKey: 'audioSoftPad' },
    silence: { id: 'silence', labelKey: 'audioSilence' },
  }[id] || null),
  startBackgroundInstrumental: guestAudio.start,
  stopBackgroundAudio: guestAudio.stop,
}));

// In-memory stand-in for the encrypted device-local draft.
const draftMem = vi.hoisted(() => ({ current: null }));
vi.mock('../../lib/guestPrayerDraft', () => ({
  saveGuestDraft: vi.fn(async ({ id, title, completed = false, contentLanguage = null }) => {
    const draftId = id || 'guest-1';
    draftMem.current = { id: draftId, title, completed, contentLanguage };
    return { id: draftId };
  }),
  markGuestDraftPrayed: vi.fn(async () => { if (draftMem.current) draftMem.current.completed = true; }),
  loadGuestDraft: vi.fn(async () => draftMem.current),
  clearGuestDraft: vi.fn(async () => { draftMem.current = null; }),
  hasPendingGuestDraftSync: vi.fn(() => !!draftMem.current),
  __resetMemoryForTests: vi.fn(() => { draftMem.current = null; }),
}));

import GuestPrayerFlow from '../GuestPrayerFlow';
import { saveGuestDraft, markGuestDraftPrayed } from '../../lib/guestPrayerDraft';
import { t } from '../../i18n';

const lang = 'fr';
afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  rec.writes.length = 0;
  draftMem.current = null;
  vi.clearAllMocks();
});

// Walk the capture → pray → decide path. Leaves the visitor on the decide screen.
async function prayAsGuest() {
  fireEvent.change(screen.getByPlaceholderText(t(lang, 'onboardCapturePlaceholder')), {
    target: { value: 'La paix dans notre foyer' },
  });
  fireEvent.click(screen.getByText(t(lang, 'firstPrayerPrayCta')));
  // The session opens on the just-typed prayer.
  expect(await screen.findByText('La paix dans notre foyer')).toBeTruthy();
  // Pray through it (single request → Amen), then close the done screen.
  fireEvent.click(screen.getByText(t(lang, 'amenBtn')));
  await waitFor(() => expect(screen.getByText(t(lang, 'continueBtn'))).toBeTruthy());
  fireEvent.click(screen.getByText(t(lang, 'continueBtn')));
  await screen.findByText(t(lang, 'firstPrayerSaveTitle'));
}

describe('GuestPrayerFlow', () => {
  it('asks the one question with an honest device-local reassurance', () => {
    render(<GuestPrayerFlow lang={lang} onFinish={vi.fn()} onRequestSave={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: t(lang, 'firstPrayerQuestion') })).toBeTruthy();
    expect(screen.getByText(t(lang, 'firstPrayerQuestion'))).toBeTruthy();
    // Device-local, NOT a claim that account E2EE already happened.
    expect(screen.getByText(t(lang, 'firstPrayerDeviceNote'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'firstPrayerPrayCta'))).toBeTruthy();
  });

  it('lets the visitor pray, then asks to save — with NO server writes', async () => {
    const onRequestSave = vi.fn();
    render(<GuestPrayerFlow lang={lang} onFinish={vi.fn()} onRequestSave={onRequestSave} />);
    await prayAsGuest();

    // The prayer was saved only to the device, and its completion was recorded.
    expect(saveGuestDraft).toHaveBeenCalled();
    expect(markGuestDraftPrayed).toHaveBeenCalled();
    expect(guestAudio.start).not.toHaveBeenCalled();

    // The decision screen offers Save / Finish without saving.
    expect(screen.getByText(t(lang, 'firstPrayerSaveBtn'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'firstPrayerFinishBtn'))).toBeTruthy();

    // Choosing to save hands off to contextual auth (the draft persists locally).
    fireEvent.click(screen.getByText(t(lang, 'firstPrayerSaveBtn')));
    expect(onRequestSave).toHaveBeenCalled();

    // Nothing about the prayer ever reached Supabase before authentication.
    expect(rec.writes).toHaveLength(0);
    expect(rec.supabaseLoaded).toBe(false);
  });

  it('"Finish without saving" leaves without saving anything', async () => {
    const onFinish = vi.fn();
    render(<GuestPrayerFlow lang={lang} onFinish={onFinish} onRequestSave={vi.fn()} />);
    await prayAsGuest();
    fireEvent.click(screen.getByText(t(lang, 'firstPrayerFinishBtn')));
    expect(onFinish).toHaveBeenCalled();
    expect(rec.writes).toHaveLength(0);
  });

  it('resumes at the save decision if a draft already exists (e.g. auth cancelled)', () => {
    // A draft is already present (as after returning from a cancelled auth)…
    draftMem.current = { id: 'guest-1', title: 'Un souci', completed: false, contentLanguage: 'fr' };
    render(<GuestPrayerFlow lang={lang} onFinish={vi.fn()} onRequestSave={vi.fn()} />);
    // …so we land on the decision, never a blank capture screen — the draft is
    // never quietly lost.
    expect(screen.getByText(t(lang, 'firstPrayerSaveTitle'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'firstPrayerQuestion'))).toBeNull();
  });
});
