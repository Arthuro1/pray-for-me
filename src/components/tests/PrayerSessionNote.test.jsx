// @vitest-environment jsdom
//
// The prayer session is for praying first. A prayer note is the one quiet
// secondary thing it offers, and these tests pin the behaviour that makes it
// safe to offer at all:
//
//   • someone who never takes a note experiences the walk exactly as before;
//   • NEXT commits what was captured for the prayer that was on screen, records
//     the completion, and moves on — never losing a recording, never blocking on
//     the network, never duplicating an entry when the walk revisits a prayer;
//   • PREVIOUS preserves and commits nothing.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';

// ── Environment doubles ────────────────────────────────────────────────────
vi.mock('../../lib/verseText', () => ({ fetchScriptureText: vi.fn(async () => null), fetchVerseText: vi.fn(async () => ({ data: null, error: null })) }));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../../lib/audio/backgroundAudio', () => ({
  AUDIO_TRACKS: [{ id: 'silence', src: null, labelKey: 'audioSilence' }],
  DEFAULT_AUDIO_TRACK_ID: 'silence',
  resolveTrack: (id) => (id === 'silence' ? { id: 'silence', src: null, labelKey: 'audioSilence' } : null),
  startBackgroundInstrumental: vi.fn(async () => ({ started: false })),
  stopBackgroundAudio: vi.fn(async () => {}),
}));

const idbStore = vi.hoisted(() => new Map());
vi.hoisted(() => { globalThis.indexedDB = {}; });
vi.mock('idb-keyval', () => ({
  get: async (k) => idbStore.get(k),
  set: async (k, v) => { idbStore.set(k, v); },
  del: async (k) => { idbStore.delete(k); },
  keys: async () => [...idbStore.keys()],
}));

// The real encrypted draft store, with one seam so a storage failure can be
// simulated — the case where the session must NOT move on.
const failPersist = vi.hoisted(() => ({ next: false }));
vi.mock('../../lib/prayerNoteDrafts', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    saveNoteDraft: (...args) => (failPersist.next ? Promise.reject(new Error('storage full')) : actual.saveNoteDraft(...args)),
  };
});

const store = vi.hoisted(() => ({
  userId: 'user-1',
  addUpdate: vi.fn(async () => {}),
  editUpdate: vi.fn(async () => {}),
  removeUpdateText: vi.fn(async () => {}),
}));
vi.mock('../../store/prayerStore', () => ({ default: { getState: () => store } }));

const uploadAttachment = vi.hoisted(() => vi.fn());
vi.mock('../../lib/attachments', () => ({ uploadAttachment }));

const confirmSpy = vi.hoisted(() => vi.fn());
vi.mock('../../store/confirmStore', () => ({ confirm: confirmSpy, default: () => {} }));

import PrayerSession from '../PrayerSession';
import RichText from '../rich/RichText';
import { __resetMemoryForTests, loadNoteDraft } from '../../lib/prayerNoteDrafts';
import { __resetForTests as resetNotes } from '../../lib/prayerNotes';
import { t } from '../../i18n';
import { LANG_CODES } from '../../i18n';

const lang = 'en';
const tr = (text) => text;
const T = (key, vars) => t(lang, key, vars);

const prayerA = { id: 'p-a', title: 'For my family', description: '', prayer_categories: [], prayer_points: [] };
const prayerB = { id: 'p-b', title: 'For Sarah', description: '', prayer_categories: [], prayer_points: [] };

// ── MediaRecorder / microphone doubles ─────────────────────────────────────
const recorders = [];
const getUserMedia = vi.fn(async () => ({ getTracks: () => [{ stop: vi.fn() }] }));

class FakeMediaRecorder {
  static isTypeSupported(mime) { return mime === 'audio/mp4;codecs=mp4a.40.2'; }
  constructor(stream, options) {
    this.stream = stream;
    this.mimeType = options.mimeType;
    this.state = 'inactive';
    recorders.push(this);
  }
  start() { this.state = 'recording'; }
  stop() {
    if (this.state === 'inactive') return;
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob([new Uint8Array([7, 7, 7])], { type: 'audio/mp4' }) });
    this.onstop?.();
  }
}

function renderSession(prayers, props = {}) {
  return render(
    <PrayerSession
      prayers={prayers}
      categories={[]}
      lang={lang}
      tr={tr}
      onClose={() => {}}
      onComplete={() => {}}
      {...props}
    />,
  );
}

const openComposer = () => fireEvent.click(screen.getByRole('button', { name: T('noteAdd') }));
const editor = () => screen.getByRole('textbox', { name: T('noteTitle') });

// contentEditable can't be "typed into" in jsdom — set the HTML a browser would
// have produced and fire the same input event the editor listens for.
function typeNote(html) {
  const el = editor();
  el.innerHTML = html;
  fireEvent.input(el);
}

// The single advancing action, whatever it is called on this step ("Continue"
// until the last prayer, then "Amen").
const nextButton = () => document.querySelector('.constellation-session__footer .primary-button');
const backButton = () => document.querySelector('.constellation-session__footer .quiet-button');

// A note-free Next is synchronous; one with content has to encrypt and persist
// first. Yield repeatedly rather than betting on a single fixed delay — under a
// loaded full-suite run one turn of the event loop is not always enough.
const settle = () => act(async () => {
  for (let i = 0; i < 12; i += 1) await new Promise((resolve) => { setTimeout(resolve, 5); });
});

const clickNext = async () => { fireEvent.click(nextButton()); await settle(); };
const clickBack = async () => { fireEvent.click(backButton()); await settle(); };

beforeEach(() => {
  localStorage.clear();
  idbStore.clear();
  recorders.length = 0;
  failPersist.next = false;
  __resetMemoryForTests();
  resetNotes();
  store.addUpdate.mockClear();
  store.editUpdate.mockClear();
  store.removeUpdateText.mockClear();
  confirmSpy.mockClear();
  getUserMedia.mockClear();
  uploadAttachment.mockReset();
  uploadAttachment.mockResolvedValue({ attachment: { id: 'att-1', type: 'audio', path: 'user-1/att-1' } });
  globalThis.MediaRecorder = FakeMediaRecorder;
  Object.defineProperty(globalThis.navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:note');
  globalThis.URL.revokeObjectURL = vi.fn();
});
// A promotion is deliberately fire-and-forget so the session never waits on it.
// Let it settle before the next test's mocks are cleared, or background work
// from one test shows up as a call in another.
afterEach(async () => {
  await new Promise((resolve) => { setTimeout(resolve, 10); });
  cleanup();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('a session without notes is unchanged', () => {
  it('offers one quiet action and no editor', () => {
    renderSession([prayerA]);
    expect(screen.getByRole('button', { name: T('noteAdd') })).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: T('noteTitle') })).toBeNull();
    // No formatting toolbar, no recorder, no prompt to take notes.
    expect(screen.queryByRole('button', { name: T('formatBold') })).toBeNull();
    expect(screen.queryByRole('button', { name: T('noteVoice') })).toBeNull();
  });

  it('Next still marks prayed and advances, creating no update', async () => {
    const onPrayed = vi.fn();
    renderSession([prayerA, prayerB], { onPrayed });

    await clickNext();

    expect(onPrayed).toHaveBeenCalledWith('p-a');
    expect(screen.getByText('For Sarah')).toBeTruthy();
    expect(store.addUpdate).not.toHaveBeenCalled();
  });

  it('never asks for the microphone on its own', () => {
    renderSession([prayerA]);
    openComposer();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('hides the note action on a saved-from-community copy', () => {
    renderSession([{ ...prayerA, community_origin_id: 'c-1' }]);
    expect(screen.queryByRole('button', { name: T('noteAdd') })).toBeNull();
  });

  it('is off entirely when notes are not allowed (the signed-out first prayer)', () => {
    renderSession([prayerA], { allowNotes: false });
    expect(screen.queryByRole('button', { name: T('noteAdd') })).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('the composer', () => {
  it('opens on Add a prayer note and collapses on Done, returning focus', async () => {
    renderSession([prayerA]);
    const trigger = screen.getByRole('button', { name: T('noteAdd') });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);
    expect(editor()).toBeTruthy();

    fireEvent.click(screen.getByText(T('noteDone')));
    await waitFor(() => expect(screen.queryByRole('textbox', { name: T('noteTitle') })).toBeNull());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: T('noteAdd') }));
  });

  it('keeps formatting behind one Aa control and collapses it with the composer', async () => {
    renderSession([prayerA]);
    openComposer();
    expect(screen.queryByRole('button', { name: T('formatBold') })).toBeNull();

    const aa = screen.getByRole('button', { name: T('noteFormatting') });
    expect(aa.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(aa);

    expect(screen.getByRole('button', { name: T('formatBold') })).toBeTruthy();
    expect(screen.getByRole('button', { name: T('formatOrderedList') })).toBeTruthy();
    expect(screen.getByRole('button', { name: T('noteFormatting') }).getAttribute('aria-pressed')).toBe('true');
    // Nothing a word processor would offer beyond the shared model.
    expect(screen.queryByRole('button', { name: T('attachPhoto') })).toBeNull();

    fireEvent.click(screen.getByText(T('noteDone')));
    await waitFor(() => expect(screen.queryByRole('button', { name: T('formatBold') })).toBeNull());
  });

  it('restores the draft when reopened, and summarises it while collapsed', async () => {
    renderSession([prayerA]);
    openComposer();
    typeNote('<div>Call Sarah before Thursday</div>');
    fireEvent.click(screen.getByText(T('noteDone')));

    await waitFor(() => expect(screen.getByRole('button', { name: T('noteAdded') })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: T('noteAdded') }));
    expect(editor().textContent).toContain('Call Sarah before Thursday');
  });

  it('creates no update for a draft that normalises to nothing', async () => {
    renderSession([prayerA]);
    openComposer();
    typeNote('<div><br></div>');
    await clickNext();
    expect(store.addUpdate).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Next commits the note to the prayer that was on screen', () => {
  it('creates one update for the written note, with its formatting intact', async () => {
    const onPrayed = vi.fn();
    renderSession([prayerA, prayerB], { onPrayed });
    openComposer();
    typeNote('<div><strong>Psalm 46</strong></div><ul><li>Call Sarah</li><li>Pray for peace</li></ul>');

    await clickNext();

    await waitFor(() => expect(store.addUpdate).toHaveBeenCalledTimes(1));
    const [prayerId, text] = store.addUpdate.mock.calls[0];
    expect(prayerId).toBe('p-a'); // never the prayer we advanced TO
    expect(text).toBe('**Psalm 46**\n- Call Sarah\n- Pray for peace');
    expect(onPrayed).toHaveBeenCalledWith('p-a');
    await waitFor(() => expect(screen.getByText('For Sarah')).toBeTruthy());
  });

  it('renders that stored text through the ordinary RichText pipeline', async () => {
    renderSession([prayerA]);
    openComposer();
    typeNote('<div><strong>Psalm 46</strong></div><ol><li>Call Sarah</li></ol>');
    await clickNext();
    await waitFor(() => expect(store.addUpdate).toHaveBeenCalled());

    cleanup();
    const { container } = render(<RichText text={store.addUpdate.mock.calls[0][1]} />);
    expect(container.querySelector('strong').textContent).toBe('Psalm 46');
    expect(container.querySelector('ol li').textContent).toBe('Call Sarah');
  });

  it('never lets pasted markup become live HTML', async () => {
    renderSession([prayerA]);
    openComposer();
    // The editor escapes on the way in; RichText builds elements, never HTML.
    typeNote('<div>&lt;img src=x onerror="alert(1)"&gt;</div>');
    await clickNext();
    await waitFor(() => expect(store.addUpdate).toHaveBeenCalled());

    cleanup();
    const { container } = render(<RichText text={store.addUpdate.mock.calls[0][1]} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror="alert(1)">');
  });

  it('does not require Done first', async () => {
    renderSession([prayerA]);
    openComposer();
    typeNote('<div>straight to Next</div>');
    await clickNext(); // composer still open
    await waitFor(() => expect(store.addUpdate).toHaveBeenCalledTimes(1));
    expect(store.addUpdate.mock.calls[0][1]).toBe('straight to Next');
  });

  it('leaves the next prayer with a clean, collapsed composer', async () => {
    renderSession([prayerA, prayerB]);
    openComposer();
    typeNote('<div>for A only</div>');
    await clickNext();

    await waitFor(() => expect(screen.getByText('For Sarah')).toBeTruthy());
    expect(screen.getByRole('button', { name: T('noteAdd') })).toBeTruthy();
    openComposer();
    expect(editor().textContent).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('voice notes', () => {
  const record = async () => {
    fireEvent.click(screen.getByRole('button', { name: T('noteVoice') }));
    await waitFor(() => expect(recorders).toHaveLength(1));
  };

  it('asks for the microphone only when Voice note is tapped', async () => {
    renderSession([prayerA]);
    openComposer();
    expect(getUserMedia).not.toHaveBeenCalled();
    await record();
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it('announces the recording state in words, not colour alone', async () => {
    renderSession([prayerA]);
    openComposer();
    await record();
    await waitFor(() => expect(screen.getAllByText(T('noteRecording')).length).toBeGreaterThan(0));
    expect(document.querySelector('[role="status"]').textContent).toBe(T('noteRecording'));
    expect(screen.getByRole('button', { name: T('noteStopRecording') })).toBeTruthy();
  });

  it('preserves the audio on stop and offers playback, re-record and delete', async () => {
    renderSession([prayerA]);
    openComposer();
    await record();
    await act(async () => { recorders[0].stop(); });

    await waitFor(() => expect(document.querySelector('audio')).toBeTruthy());
    expect(screen.getByRole('button', { name: T('noteRecordAgain') })).toBeTruthy();
    expect(screen.getByRole('button', { name: T('noteDeleteRecording') })).toBeTruthy();
    // Durably held before anything else happens.
    expect((await loadNoteDraft('p-a')).voice.blob.size).toBe(3);
  });

  it('finalises an in-flight recording rather than discarding it when Next is tapped', async () => {
    renderSession([prayerA, prayerB]);
    openComposer();
    await record();
    expect(recorders[0].state).toBe('recording');

    await clickNext();

    expect(recorders[0].state).toBe('inactive');
    await waitFor(() => expect(store.addUpdate).toHaveBeenCalledTimes(1));
    const [prayerId, , , attachments] = store.addUpdate.mock.calls[0];
    expect(prayerId).toBe('p-a');
    expect(attachments).toEqual([{ id: 'att-1', type: 'audio', path: 'user-1/att-1' }]);
    expect(uploadAttachment.mock.calls[0][0].name).toBe('prayer-note.m4a'); // no user content in the name
  });

  it('saves text and voice as ONE entry', async () => {
    renderSession([prayerA]);
    openComposer();
    typeNote('<div>Remember to call Sarah</div>');
    await record();
    await act(async () => { recorders[0].stop(); });

    // Next lands immediately after Stop — the note must still arrive whole.
    await clickNext();

    await waitFor(() => expect(store.addUpdate).toHaveBeenCalledTimes(1));
    const [, text, , attachments] = store.addUpdate.mock.calls[0];
    expect(text).toBe('Remember to call Sarah');
    expect(attachments).toHaveLength(1);
  });

  it('deletes a recording without touching the written text', async () => {
    renderSession([prayerA]);
    openComposer();
    typeNote('<div>the written half</div>');
    await record();
    await act(async () => { recorders[0].stop(); });
    await waitFor(() => expect(document.querySelector('audio')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: T('noteDeleteRecording') }));
    await waitFor(() => expect(document.querySelector('audio')).toBeNull());

    await clickNext();
    await waitFor(() => expect(store.addUpdate).toHaveBeenCalledTimes(1));
    expect(store.addUpdate.mock.calls[0][1]).toBe('the written half');
    expect(store.addUpdate.mock.calls[0][3]).toEqual([]);
  });

  it('keeps writing fully usable when the microphone is refused', async () => {
    getUserMedia.mockRejectedValueOnce(Object.assign(new Error('denied'), { name: 'NotAllowedError' }));
    renderSession([prayerA]);
    openComposer();
    typeNote('<div>written before trying the mic</div>');
    fireEvent.click(screen.getByRole('button', { name: T('noteVoice') }));

    await waitFor(() => expect(screen.getByText(T('micPermission'))).toBeTruthy());
    expect(editor().textContent).toBe('written before trying the mic');

    await clickNext();
    await waitFor(() => expect(store.addUpdate).toHaveBeenCalledTimes(1));
    expect(store.addUpdate.mock.calls[0][1]).toBe('written before trying the mic');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Previous preserves; Next commits', () => {
  it('going back keeps the draft, creates no update and marks nothing prayed', async () => {
    const onPrayed = vi.fn();
    renderSession([prayerA, prayerB], { onPrayed });

    await clickNext();                       // finish A (no note)
    onPrayed.mockClear();
    openComposer();
    typeNote('<div>half a thought about Sarah</div>');

    await clickBack();

    expect(store.addUpdate).not.toHaveBeenCalled();
    expect(onPrayed).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText('For my family')).toBeTruthy());
    await waitFor(async () => expect((await loadNoteDraft('p-b')).text).toBe('half a thought about Sarah'));
  });

  it('restores the preserved draft on the correct prayer when the walk comes forward again', async () => {
    renderSession([prayerA, prayerB]);
    await clickNext();
    openComposer();
    typeNote('<div>half a thought about Sarah</div>');
    await clickBack();

    // Prayer A has no note of its own.
    expect(screen.getByRole('button', { name: T('noteAdd') })).toBeTruthy();

    await clickNext(); // forward to B again
    await waitFor(() => expect(screen.getByRole('button', { name: T('noteAdded') })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: T('noteAdded') }));
    expect(editor().textContent).toBe('half a thought about Sarah');
  });

  it('shows an already saved note when a completed prayer is revisited, and edits that same entry', async () => {
    const onPrayed = vi.fn();
    renderSession([prayerA, prayerB], { onPrayed });
    openComposer();
    typeNote('<div>first thought</div>');
    await clickNext();
    await waitFor(() => expect(store.addUpdate).toHaveBeenCalledTimes(1));
    const updateId = store.addUpdate.mock.calls[0][4].id;

    await clickBack(); // return to the completed prayer A
    await waitFor(() => expect(screen.getByRole('button', { name: T('noteSaved') })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: T('noteSaved') }));
    typeNote('<div>first thought, and one more</div>');
    onPrayed.mockClear();
    await clickNext();

    // Same entry updated — no second note, and no second completion.
    await waitFor(() => expect(store.editUpdate).toHaveBeenCalledTimes(1));
    expect(store.editUpdate).toHaveBeenCalledWith('p-a', updateId, 'first thought, and one more');
    expect(store.addUpdate).toHaveBeenCalledTimes(1);
    expect(onPrayed).not.toHaveBeenCalled();
  });

  it('emptying an already saved note removes its text through the ordinary update path', async () => {
    renderSession([prayerA, prayerB]);
    openComposer();
    typeNote('<div>written by mistake</div>');
    await clickNext();
    await waitFor(() => expect(store.addUpdate).toHaveBeenCalledTimes(1));
    const updateId = store.addUpdate.mock.calls[0][4].id;

    await clickBack();
    fireEvent.click(screen.getByRole('button', { name: T('noteSaved') }));
    typeNote('<div><br></div>');
    await clickNext();

    await waitFor(() => expect(store.removeUpdateText).toHaveBeenCalledWith('p-a', updateId));
    expect(store.addUpdate).toHaveBeenCalledTimes(1);
  });

  it('cannot attach a note to the next prayer by advancing twice quickly', async () => {
    renderSession([prayerA, prayerB]);
    openComposer();
    typeNote('<div>for A</div>');

    fireEvent.click(nextButton());
    fireEvent.click(nextButton()); // second tap lands while the commit is still running
    await settle();
    await waitFor(() => expect(screen.getByText('For Sarah')).toBeTruthy());

    expect(store.addUpdate).toHaveBeenCalledTimes(1);
    expect(store.addUpdate.mock.calls[0][0]).toBe('p-a');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('offline and failure', () => {
  it('advances normally when a written note is only queued locally', async () => {
    const onPrayed = vi.fn();
    renderSession([prayerA, prayerB], { onPrayed });
    openComposer();
    typeNote('<div>written on the train</div>');

    await clickNext();

    // addUpdate is the app's durable, offline-capable path — no network here.
    await waitFor(() => expect(store.addUpdate).toHaveBeenCalledTimes(1));
    expect(uploadAttachment).not.toHaveBeenCalled();
    expect(onPrayed).toHaveBeenCalledWith('p-a');
    await waitFor(() => expect(screen.getByText('For Sarah')).toBeTruthy());
  });

  it('still advances when a recording cannot be uploaded yet, keeping it safe for retry', async () => {
    uploadAttachment.mockResolvedValue({ error: 'attachOffline' });
    const onPrayed = vi.fn();
    renderSession([prayerA, prayerB], { onPrayed });
    openComposer();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: T('noteVoice') }));
    });
    await waitFor(() => expect(recorders).toHaveLength(1));
    await act(async () => { recorders[0].stop(); });

    await clickNext();

    await waitFor(() => expect(screen.getByText('For Sarah')).toBeTruthy());
    expect(onPrayed).toHaveBeenCalledWith('p-a');
    expect(store.addUpdate).not.toHaveBeenCalled();
    // Nothing lost, and nothing claimed as sent.
    await waitFor(async () => {
      const kept = await loadNoteDraft('p-a');
      expect(kept.voice.blob.size).toBe(3);
      expect(kept.status).toBe('committing');
    });
  });

  it('refuses to move on — and offers a way back — when the note cannot be stored', async () => {
    const onPrayed = vi.fn();
    renderSession([prayerA, prayerB], { onPrayed });
    openComposer();
    typeNote('<div>something I must not lose</div>');
    failPersist.next = true;

    await clickNext();

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain(T('noteSaveFailed')));
    expect(screen.getByText('For my family')).toBeTruthy(); // still here
    expect(onPrayed).not.toHaveBeenCalled();
    expect(store.addUpdate).not.toHaveBeenCalled();

    failPersist.next = false;
    fireEvent.click(screen.getByText(T('noteTryAgain')));
    await act(async () => {});
    await waitFor(() => expect(store.addUpdate).toHaveBeenCalledTimes(1));
    expect(onPrayed).toHaveBeenCalledWith('p-a');
  });

  it('confirms before discarding a note the user chooses to abandon', async () => {
    renderSession([prayerA, prayerB]);
    openComposer();
    typeNote('<div>something I must not lose</div>');
    failPersist.next = true;
    await clickNext();
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());

    fireEvent.click(screen.getByText(T('noteContinueWithoutSaving')));
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy.mock.calls[0][0].title).toBe(T('noteDiscardTitle'));
    expect(confirmSpy.mock.calls[0][0].danger).toBe(true);
    // It really is a choice: nothing is discarded until the dialog is confirmed.
    expect(screen.getByText('For my family')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('recovery', () => {
  it('restores an unfinished note left by an earlier session', async () => {
    // A draft persisted before the session was closed.
    const { saveNoteDraft } = await vi.importActual('../../lib/prayerNoteDrafts');
    await saveNoteDraft({ prayerId: 'p-a', text: 'left unfinished last night' });

    renderSession([prayerA]);

    await waitFor(() => expect(screen.getByRole('button', { name: T('noteAdded') })).toBeTruthy());
    expect(screen.getByText(T('noteContinue'))).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: T('noteAdded') }));
    expect(editor().textContent).toBe('left unfinished last night');
  });

  it('clears the local draft once the note has genuinely been committed', async () => {
    renderSession([prayerA]);
    openComposer();
    typeNote('<div>committed</div>');
    await clickNext();
    await waitFor(() => expect(store.addUpdate).toHaveBeenCalled());
    await waitFor(async () => expect(await loadNoteDraft('p-a')).toBeNull());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('accessibility', () => {
  it('exposes the disclosure state and the panel it controls', () => {
    renderSession([prayerA]);
    const trigger = screen.getByRole('button', { name: T('noteAdd') });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe('prayer-note-p-a');

    fireEvent.click(trigger);
    expect(document.getElementById('prayer-note-p-a')).toBeTruthy();
    // Opening puts the caret where the user asked to write.
    expect(document.activeElement).toBe(editor());
  });

  it('gives every icon-only note control a real name and a 44px target', async () => {
    renderSession([prayerA]);
    openComposer();

    for (const name of [T('noteFormatting'), T('noteVoice')]) {
      const button = screen.getByRole('button', { name });
      expect(button.getAttribute('aria-label') || button.textContent).toBeTruthy();
      expect(button.className).toMatch(/min-h-11/);
    }

    fireEvent.click(screen.getByRole('button', { name: T('noteVoice') }));
    await waitFor(() => expect(recorders).toHaveLength(1));
    const stop = screen.getByRole('button', { name: T('noteStopRecording') });
    expect(stop.getAttribute('aria-label')).toBe(T('noteStopRecording'));
    expect(stop.className).toMatch(/min-h-11/);

    await act(async () => { recorders[0].stop(); });
    await waitFor(() => expect(document.querySelector('audio')).toBeTruthy());
    for (const name of [T('noteRecordAgain'), T('noteDeleteRecording')]) {
      expect(screen.getByRole('button', { name }).className).toMatch(/min-h-11/);
    }
  });

  it('announces recording once instead of every ticking second', async () => {
    renderSession([prayerA]);
    openComposer();
    fireEvent.click(screen.getByRole('button', { name: T('noteVoice') }));
    await waitFor(() => expect(recorders).toHaveLength(1));

    const status = document.querySelector('[role="status"]');
    expect(status.textContent).toBe(T('noteRecording')); // no counter inside
    // The counter is decorative, so a screen reader is not re-interrupted each second.
    const counter = [...document.querySelectorAll('[aria-hidden="true"]')].find((el) => /^\d+:\d\d$/.test(el.textContent));
    expect(counter).toBeTruthy();
  });

  it('names the audio player and keeps it a native, keyboard-operable control', async () => {
    renderSession([prayerA]);
    openComposer();
    fireEvent.click(screen.getByRole('button', { name: T('noteVoice') }));
    await waitFor(() => expect(recorders).toHaveLength(1));
    await act(async () => { recorders[0].stop(); });

    await waitFor(() => expect(document.querySelector('audio')).toBeTruthy());
    const player = document.querySelector('audio');
    expect(player.getAttribute('aria-label')).toBe(T('noteVoicePlayback'));
    expect(player.hasAttribute('controls')).toBe(true);
  });

  it('keeps Escape closing the session, preserving the draft rather than losing it', async () => {
    const onClose = vi.fn();
    renderSession([prayerA], { onClose });
    openComposer();
    typeNote('<div>mid-thought when the phone rang</div>');

    fireEvent.keyDown(document, { key: 'Escape' });
    await settle();

    expect(onClose).toHaveBeenCalled();
    expect((await loadNoteDraft('p-a')).text).toBe('mid-thought when the phone rang');
    expect(store.addUpdate).not.toHaveBeenCalled(); // closing is a pause, not a commit
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('localization', () => {
  const KEYS = [
    'noteAdd', 'noteTitle', 'notePlaceholder', 'noteFormatting', 'noteVoice', 'noteRecording',
    'noteStopRecording', 'noteRecordAgain', 'noteDeleteRecording', 'noteDone', 'noteAdded',
    'noteSaved', 'noteSummaryBoth', 'noteSummaryVoice', 'noteContinue', 'noteVoicePending',
    'noteVoicePlayback', 'noteSavingRecording', 'noteSaveFailed', 'noteSaveFailedShort',
    'noteTryAgain', 'noteContinueWithoutSaving', 'noteDiscardTitle', 'noteDiscardMessage',
    'noteLabel', 'noteDuringPrayer', 'micPermission', 'notesSavedCount_one', 'notesSavedCount_other',
  ];

  it('has a real string for every note key in every language', async () => {
    const { default: loadedFr } = await import('../../i18n/locales/fr.js');
    for (const code of LANG_CODES) {
      const { default: strings } = await import(`../../i18n/locales/${code}.js`);
      for (const key of KEYS) {
        expect(typeof strings[key], `${code}.${key}`).toBe('string');
        expect(strings[key].length, `${code}.${key}`).toBeGreaterThan(0);
      }
      // The duration/count slots must survive translation, or the UI shows a hole.
      expect(strings.noteSummaryVoice.includes('{duration}'), `${code}.noteSummaryVoice`).toBe(true);
      expect(strings.notesSavedCount_other.includes('{n}'), `${code}.notesSavedCount_other`).toBe(true);
      expect(Object.keys(loadedFr).length).toBeGreaterThan(0);
    }
  });

  it('renders no hardcoded English in a right-to-left language', () => {
    cleanup();
    render(
      <PrayerSession prayers={[prayerA]} categories={[]} lang="ar" tr={tr} onClose={() => {}} onComplete={() => {}} />,
    );
    expect(screen.getByRole('button', { name: t('ar', 'noteAdd') })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add a prayer note' })).toBeNull();
  });
});
