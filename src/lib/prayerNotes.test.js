// Promotion is where a prayer note stops being a draft and becomes an ordinary
// entry in the prayer's history. The contract under test: it goes through the
// existing addUpdate path (no parallel notes system), it never creates an update
// for an empty note, it never loses a recording it couldn't upload yet, and a
// retry updates the SAME row rather than creating a second one.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const idbStore = vi.hoisted(() => new Map());
vi.hoisted(() => { globalThis.indexedDB = {}; });

vi.mock('idb-keyval', () => ({
  get: async (k) => idbStore.get(k),
  set: async (k, v) => { idbStore.set(k, v); },
  del: async (k) => { idbStore.delete(k); },
  keys: async () => [...idbStore.keys()],
}));

const storeMock = vi.hoisted(() => ({ addUpdate: vi.fn(async () => {}), userId: 'user-1' }));
vi.mock('../store/prayerStore', () => ({ default: { getState: () => storeMock } }));

const uploadAttachment = vi.hoisted(() => vi.fn());
vi.mock('./attachments', () => ({ uploadAttachment }));

import { promoteNoteDraft, flushPendingNoteDrafts, noteIsEmpty, isSessionNote, __resetForTests } from './prayerNotes';
import { saveNoteDraft, loadNoteDraft, peekNoteDraft, __resetMemoryForTests } from './prayerNoteDrafts';

const PRAYER = 'prayer-1';
const audio = () => new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/mp4' });

beforeEach(() => {
  idbStore.clear();
  __resetMemoryForTests();
  __resetForTests();
  storeMock.addUpdate.mockClear();
  uploadAttachment.mockReset();
  uploadAttachment.mockResolvedValue({ attachment: { id: 'att-1', type: 'audio', path: 'user-1/att-1' } });
});

describe('noteIsEmpty', () => {
  it('treats whitespace and empty formatting as empty', () => {
    expect(noteIsEmpty({ text: '' })).toBe(true);
    expect(noteIsEmpty({ text: '   \n  ' })).toBe(true);
    expect(noteIsEmpty({ text: '- \n- ' })).toBe(true);   // empty list bullets
    expect(noteIsEmpty({ text: '**  **' })).toBe(true);   // bold holding only spaces
    expect(noteIsEmpty({ text: '1. \n2. ' })).toBe(true); // empty numbered list
  });

  it('is not empty with real text, or with a recording alone', () => {
    expect(noteIsEmpty({ text: '- Call Sarah' })).toBe(false);
    expect(noteIsEmpty({ text: '', voice: { blob: audio() } })).toBe(false);
  });
});

describe('promoteNoteDraft', () => {
  it('creates no update for an empty draft and clears it', async () => {
    await saveNoteDraft({ prayerId: PRAYER, text: '   ' });
    const result = await promoteNoteDraft(PRAYER);
    expect(result).toEqual({ ok: true, promoted: false });
    expect(storeMock.addUpdate).not.toHaveBeenCalled();
    expect(await loadNoteDraft(PRAYER)).toBeNull();
  });

  it('promotes a written note through the existing addUpdate path', async () => {
    await saveNoteDraft({ prayerId: PRAYER, text: '**Psalm 46** and call Sarah' });
    const result = await promoteNoteDraft(PRAYER);

    expect(result.ok).toBe(true);
    expect(storeMock.addUpdate).toHaveBeenCalledTimes(1);
    const [prayerId, text, author, attachments, options] = storeMock.addUpdate.mock.calls[0];
    expect(prayerId).toBe(PRAYER);
    expect(text).toBe('**Psalm 46** and call Sarah'); // formatting preserved verbatim
    expect(author).toBe('');
    expect(attachments).toEqual([]);
    expect(options.id).toBe(result.updateId);
    // Committed → the local draft is gone, and the entry is labelled a session note.
    expect(await loadNoteDraft(PRAYER)).toBeNull();
    expect(isSessionNote(result.updateId)).toBe(true);
    expect(uploadAttachment).not.toHaveBeenCalled(); // text alone never touches the network
  });

  it('uploads a recording through the encrypted attachment pipeline', async () => {
    await saveNoteDraft({ prayerId: PRAYER, text: 'remember', voice: { blob: audio(), mime: 'audio/mp4', seconds: 24 } });
    const result = await promoteNoteDraft(PRAYER);

    expect(result.ok).toBe(true);
    const [file, userId] = uploadAttachment.mock.calls[0];
    expect(userId).toBe('user-1');
    // The filename must never echo a prayer title, a person, or anything written.
    expect(file.name).toBe('prayer-note.m4a');
    // Text and voice land as ONE entry.
    expect(storeMock.addUpdate).toHaveBeenCalledTimes(1);
    const [, text, , attachments] = storeMock.addUpdate.mock.calls[0];
    expect(text).toBe('remember');
    expect(attachments).toEqual([{ id: 'att-1', type: 'audio', path: 'user-1/att-1' }]);
  });

  it('promotes a voice-only note', async () => {
    await saveNoteDraft({ prayerId: PRAYER, text: '', voice: { blob: audio(), mime: 'audio/mp4', seconds: 5 } });
    await promoteNoteDraft(PRAYER);
    const [, text, , attachments] = storeMock.addUpdate.mock.calls[0];
    expect(text).toBe('');
    expect(attachments).toHaveLength(1);
  });

  it('keeps the draft when the recording cannot be uploaded, and never half-writes an entry', async () => {
    uploadAttachment.mockResolvedValue({ error: 'attachOffline' });
    await saveNoteDraft({ prayerId: PRAYER, text: 'offline note', voice: { blob: audio(), mime: 'audio/mp4', seconds: 9 } });

    const result = await promoteNoteDraft(PRAYER);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('attachOffline');
    expect(storeMock.addUpdate).not.toHaveBeenCalled();

    // Nothing lost: the encrypted draft still holds both halves.
    const kept = await loadNoteDraft(PRAYER);
    expect(kept.text).toBe('offline note');
    expect(kept.voice.seconds).toBe(9);
    expect(kept.status).toBe('committing'); // marked for retry
  });

  it('retries onto the SAME update id rather than creating a second note', async () => {
    uploadAttachment.mockResolvedValueOnce({ error: 'attachOffline' });
    await saveNoteDraft({ prayerId: PRAYER, text: 'note', voice: { blob: audio(), mime: 'audio/mp4', seconds: 4 } });

    const first = await promoteNoteDraft(PRAYER);
    expect(first.ok).toBe(false);
    const reservedId = (await peekNoteDraft(PRAYER)).savedUpdateId;
    expect(reservedId).toBe(first.updateId);

    const second = await promoteNoteDraft(PRAYER); // back online
    expect(second.ok).toBe(true);
    expect(second.updateId).toBe(reservedId);
    expect(storeMock.addUpdate).toHaveBeenCalledTimes(1);
    expect(storeMock.addUpdate.mock.calls[0][4].id).toBe(reservedId);
  });
});

describe('flushPendingNoteDrafts', () => {
  it('retries only drafts whose commit had already started', async () => {
    await saveNoteDraft({ prayerId: 'still-writing', text: 'not finished with this prayer yet' });
    await saveNoteDraft({ prayerId: 'awaiting-upload', text: 'committed', savedUpdateId: 'u-9', status: 'committing' });

    await flushPendingNoteDrafts();

    expect(storeMock.addUpdate).toHaveBeenCalledTimes(1);
    expect(storeMock.addUpdate.mock.calls[0][0]).toBe('awaiting-upload');
    // The unfinished draft is untouched — Previous/close preserved it deliberately.
    expect((await loadNoteDraft('still-writing')).text).toBe('not finished with this prayer yet');
  });

  it('stops and keeps everything when the connection is still down', async () => {
    uploadAttachment.mockResolvedValue({ error: 'attachOffline' });
    await saveNoteDraft({ prayerId: PRAYER, text: 'x', voice: { blob: audio(), mime: 'audio/mp4', seconds: 2 }, savedUpdateId: 'u-1', status: 'committing' });
    await flushPendingNoteDrafts();
    expect(storeMock.addUpdate).not.toHaveBeenCalled();
    expect(await loadNoteDraft(PRAYER)).not.toBeNull();
  });
});
