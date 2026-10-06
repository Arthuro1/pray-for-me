// A prayer note is personal content that may never have reached a server yet, so
// its on-device draft carries the same contract as the guest prayer draft: the
// text and the recording exist only as ciphertext, the key never leaves the
// device in extractable form, and anything expired or corrupt is deleted rather
// than trusted.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// A persistent fake IndexedDB (via idb-keyval) plus a truthy `indexedDB` global
// so the module takes its persistent path.
const idbStore = vi.hoisted(() => new Map());
vi.hoisted(() => { globalThis.indexedDB = {}; });

vi.mock('idb-keyval', () => ({
  get: async (k) => idbStore.get(k),
  set: async (k, v) => { idbStore.set(k, v); },
  del: async (k) => { idbStore.delete(k); },
  keys: async () => [...idbStore.keys()],
}));

import {
  saveNoteDraft, loadNoteDraft, clearNoteDraft, peekNoteDraft, listNoteDraftIds,
  __resetMemoryForTests,
} from './prayerNoteDrafts';

const PRAYER = 'prayer-1';
const SLOT = `pfm_note_draft:${PRAYER}`;
const SECRET = 'SECRET_call_my_estranged_brother_on_Thursday';

// Everything the module persisted, serialized so we can scan it for plaintext.
function persistedBlob() {
  const record = idbStore.get(SLOT);
  return JSON.stringify(record, (_, v) => (v instanceof Uint8Array || v instanceof ArrayBuffer ? '<bytes>' : v));
}

beforeEach(() => {
  idbStore.clear();
  __resetMemoryForTests();
});

describe('prayerNoteDrafts — privacy at rest', () => {
  it('never writes the note text in plaintext', async () => {
    await saveNoteDraft({ prayerId: PRAYER, text: SECRET });
    const blob = persistedBlob();
    expect(blob).not.toContain(SECRET);
    expect(blob).not.toContain('estranged');
    // The ciphertext is genuinely there — this isn't passing because nothing saved.
    expect(idbStore.get(SLOT).payload.ct.length).toBeGreaterThan(0);
  });

  it('persists the key as a non-extractable CryptoKey', async () => {
    await saveNoteDraft({ prayerId: PRAYER, text: SECRET });
    const { key } = idbStore.get(SLOT);
    expect(key.extractable).toBe(false);
    await expect(crypto.subtle.exportKey('raw', key)).rejects.toThrow();
  });

  it('round-trips text through encryption', async () => {
    await saveNoteDraft({ prayerId: PRAYER, text: SECRET });
    __resetMemoryForTests(); // simulate a fresh page load
    expect((await loadNoteDraft(PRAYER)).text).toBe(SECRET);
  });

  it('stores a recording as encrypted bytes and restores it as a blob', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3, 4, 5])], { type: 'audio/mp4' });
    await saveNoteDraft({ prayerId: PRAYER, text: '', voice: { blob, mime: 'audio/mp4', seconds: 7 } });
    const stored = idbStore.get(SLOT);
    expect(stored.audio.ct.byteLength).toBeGreaterThan(0);
    expect(new Uint8Array(stored.audio.ct)).not.toEqual(new Uint8Array([1, 2, 3, 4, 5]));

    __resetMemoryForTests();
    const draft = await loadNoteDraft(PRAYER);
    expect(draft.voice.seconds).toBe(7);
    expect(new Uint8Array(await draft.voice.blob.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
  });

  it('exposes only content-free metadata to peek', async () => {
    await saveNoteDraft({ prayerId: PRAYER, text: SECRET, status: 'committing', savedUpdateId: 'u1' });
    const meta = await peekNoteDraft(PRAYER);
    expect(meta).toEqual(expect.objectContaining({ prayerId: PRAYER, status: 'committing', savedUpdateId: 'u1', hasVoice: false }));
    expect(JSON.stringify(meta)).not.toContain(SECRET);
  });
});

describe('prayerNoteDrafts — partial updates', () => {
  it('keeps an unchanged recording when only the text is saved', async () => {
    const blob = new Blob([new Uint8Array([9, 9, 9])], { type: 'audio/webm' });
    await saveNoteDraft({ prayerId: PRAYER, text: 'first', voice: { blob, mime: 'audio/webm', seconds: 3 } });
    const before = idbStore.get(SLOT).audio.ct;

    await saveNoteDraft({ prayerId: PRAYER, text: 'second' });
    expect(idbStore.get(SLOT).audio.ct).toBe(before); // not re-encrypted

    const draft = await loadNoteDraft(PRAYER);
    expect(draft.text).toBe('second');
    expect(draft.voice.seconds).toBe(3);
  });

  it('keeps the text when only a recording is saved', async () => {
    await saveNoteDraft({ prayerId: PRAYER, text: 'written first' });
    const blob = new Blob([new Uint8Array([1])], { type: 'audio/webm' });
    await saveNoteDraft({ prayerId: PRAYER, voice: { blob, mime: 'audio/webm', seconds: 1 } });
    expect((await loadNoteDraft(PRAYER)).text).toBe('written first');
  });

  it('drops the recording when voice is explicitly null', async () => {
    const blob = new Blob([new Uint8Array([1])], { type: 'audio/webm' });
    await saveNoteDraft({ prayerId: PRAYER, text: 'keep me', voice: { blob, mime: 'audio/webm', seconds: 1 } });
    await saveNoteDraft({ prayerId: PRAYER, text: 'keep me', voice: null });
    const draft = await loadNoteDraft(PRAYER);
    expect(draft.voice).toBeNull();
    expect(draft.text).toBe('keep me');
  });
});

describe('prayerNoteDrafts — fail closed', () => {
  it('deletes and ignores an expired draft', async () => {
    await saveNoteDraft({ prayerId: PRAYER, text: SECRET });
    const record = idbStore.get(SLOT);
    idbStore.set(SLOT, { ...record, updatedAt: Date.now() - 8 * 24 * 60 * 60 * 1000 });
    __resetMemoryForTests();
    expect(await loadNoteDraft(PRAYER)).toBeNull();
    expect(idbStore.has(SLOT)).toBe(false);
  });

  it('deletes a draft whose ciphertext cannot be decrypted', async () => {
    await saveNoteDraft({ prayerId: PRAYER, text: SECRET });
    const record = idbStore.get(SLOT);
    idbStore.set(SLOT, { ...record, payload: { ...record.payload, ct: record.payload.ct.replace(/^./, 'A') } });
    __resetMemoryForTests();
    expect(await loadNoteDraft(PRAYER)).toBeNull();
    expect(idbStore.has(SLOT)).toBe(false);
  });

  it('keeps the written half when only the recording is unreadable', async () => {
    const blob = new Blob([new Uint8Array([4, 5, 6])], { type: 'audio/webm' });
    await saveNoteDraft({ prayerId: PRAYER, text: SECRET, voice: { blob, mime: 'audio/webm', seconds: 2 } });
    const record = idbStore.get(SLOT);
    idbStore.set(SLOT, { ...record, audio: { ...record.audio, ct: new Uint8Array([0, 0, 0, 0]).buffer } });
    __resetMemoryForTests();
    const draft = await loadNoteDraft(PRAYER);
    expect(draft.text).toBe(SECRET);
    expect(draft.voice).toBeNull();
  });

  it('lists and clears drafts by prayer', async () => {
    await saveNoteDraft({ prayerId: 'a', text: 'one' });
    await saveNoteDraft({ prayerId: 'b', text: 'two' });
    expect((await listNoteDraftIds()).sort()).toEqual(['a', 'b']);
    await clearNoteDraft('a');
    expect(await listNoteDraftIds()).toEqual(['b']);
    expect(await loadNoteDraft('a')).toBeNull();
  });
});

// Every save is a read-modify-write, so two of them racing for the same prayer
// must not let the later one resurrect what the earlier one dropped.
describe('prayerNoteDrafts — concurrent writes', () => {
  const blob = () => new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' });

  it('does not bring a deleted recording back when a text save is in flight', async () => {
    await saveNoteDraft({ prayerId: PRAYER, text: 'the written half', voice: { blob: blob(), mime: 'audio/webm', seconds: 2 } });

    // Deleting the recording and flushing the text debounce, started together.
    await Promise.all([
      saveNoteDraft({ prayerId: PRAYER, text: 'the written half', voice: null }),
      saveNoteDraft({ prayerId: PRAYER, text: 'the written half' }),
    ]);

    const draft = await loadNoteDraft(PRAYER);
    expect(draft.voice).toBeNull();
    expect(draft.text).toBe('the written half');
  });

  it('keeps a recording captured while an earlier text save is in flight', async () => {
    await saveNoteDraft({ prayerId: PRAYER, text: 'first' });
    await Promise.all([
      saveNoteDraft({ prayerId: PRAYER, text: 'second' }),
      saveNoteDraft({ prayerId: PRAYER, voice: { blob: blob(), mime: 'audio/webm', seconds: 3 } }),
    ]);

    const draft = await loadNoteDraft(PRAYER);
    expect(draft.voice?.seconds).toBe(3);
    expect(draft.text).toBe('second');
  });

  it('does not re-create a draft that was cleared while a save was in flight', async () => {
    await saveNoteDraft({ prayerId: PRAYER, text: 'something' });
    await Promise.all([
      saveNoteDraft({ prayerId: PRAYER, text: 'something more' }),
      clearNoteDraft(PRAYER),
    ]);
    expect(await loadNoteDraft(PRAYER)).toBeNull();
  });

  it('keeps serving later writes after one of them fails', async () => {
    await expect(saveNoteDraft({ text: 'no prayer id' })).rejects.toThrow();
    await saveNoteDraft({ prayerId: PRAYER, text: 'still works' });
    expect((await loadNoteDraft(PRAYER)).text).toBe('still works');
  });
});
