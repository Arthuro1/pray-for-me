// An unfinished prayer is personal content that has never reached a server, so
// its on-device draft carries the same contract as the guest prayer draft and
// the session-note draft: the words exist only as ciphertext, the key never
// leaves the device in extractable form, anything expired or corrupt is deleted
// rather than trusted — and a second tab can never destroy what the first one
// is still writing.
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
  DRAFT_SLOTS,
  saveFormDraft,
  loadFormDraft,
  clearFormDraft,
  clearAllFormDrafts,
  __resetMemoryForTests,
  __writerIdForTests,
} from './prayerFormDrafts';

const SLOT = DRAFT_SLOTS.NEW_PRAYER;
const STORAGE_KEY = `pfm_form_draft:${SLOT}`;
const SECRET = 'SECRET_pray_for_my_estranged_brother_before_Thursday';
const FIELDS = {
  title: SECRET,
  description: 'SECRET_he_has_not_spoken_to_me_in_years',
  forOther: true,
  personName: 'SECRET_Daniel',
  categoryIds: ['cat-1'],
  scheduleDraft: { mode: 'recurring', freq: 'weekly', weekDays: [4] },
  contentLanguage: 'en',
};

// Everything the module persisted, serialized so we can scan it for plaintext.
const persistedBlob = () => JSON.stringify(idbStore.get(STORAGE_KEY));

beforeEach(() => {
  idbStore.clear();
  __resetMemoryForTests();
});

describe('prayerFormDrafts — privacy at rest', () => {
  it('never writes the prayer in plaintext', async () => {
    await saveFormDraft(SLOT, FIELDS);
    const blob = persistedBlob();
    expect(blob).not.toContain(SECRET);
    expect(blob).not.toContain('estranged');
    expect(blob).not.toContain('Daniel');
    // The ciphertext is genuinely there — this isn't passing because nothing saved.
    expect(idbStore.get(STORAGE_KEY).payload.ct.length).toBeGreaterThan(0);
  });

  it('persists the key as a non-extractable CryptoKey', async () => {
    await saveFormDraft(SLOT, FIELDS);
    const { key } = idbStore.get(STORAGE_KEY);
    expect(key.extractable).toBe(false);
    await expect(crypto.subtle.exportKey('raw', key)).rejects.toThrow();
  });

  it('keeps no draft content in the plaintext metadata', async () => {
    await saveFormDraft(SLOT, FIELDS);
    const { v, slot, writer, createdAt, updatedAt, payload, key } = idbStore.get(STORAGE_KEY);
    // Exactly these fields — a new plaintext field would be a leak waiting to happen.
    expect(Object.keys(idbStore.get(STORAGE_KEY)).sort())
      .toEqual(['createdAt', 'key', 'payload', 'slot', 'updatedAt', 'v', 'writer']);
    expect([v, slot, writer, typeof createdAt, typeof updatedAt])
      .toEqual([1, SLOT, __writerIdForTests(), 'number', 'number']);
    expect(Object.keys(payload).sort()).toEqual(['ct', 'iv', 'v']);
    expect(key).toBeDefined();
  });
});

describe('prayerFormDrafts — surviving an accidental close', () => {
  it('round-trips every persisted field through a fresh page load', async () => {
    await saveFormDraft(SLOT, FIELDS);
    __resetMemoryForTests(); // simulate reopening the app
    expect(await loadFormDraft(SLOT)).toMatchObject(FIELDS);
  });

  it('replaces rather than merges, so a cleared field stays cleared', async () => {
    await saveFormDraft(SLOT, FIELDS);
    await saveFormDraft(SLOT, { ...FIELDS, description: '', personName: '' });
    const draft = await loadFormDraft(SLOT);
    expect(draft.description).toBe('');
    expect(draft.personName).toBe('');
    expect(draft.title).toBe(SECRET);
  });

  it('keeps the two capture surfaces in separate slots', async () => {
    await saveFormDraft(DRAFT_SLOTS.NEW_PRAYER, FIELDS);
    expect(await loadFormDraft(DRAFT_SLOTS.FIRST_PRAYER)).toBeNull();
  });

  it('forgets the draft once the prayer really exists', async () => {
    await saveFormDraft(SLOT, FIELDS);
    await clearFormDraft(SLOT);
    expect(await loadFormDraft(SLOT)).toBeNull();
    expect(idbStore.get(STORAGE_KEY)).toBeUndefined();
  });

  it('wipes every slot when the device is cleaned up (sign-out)', async () => {
    await saveFormDraft(DRAFT_SLOTS.NEW_PRAYER, FIELDS);
    await saveFormDraft(DRAFT_SLOTS.FIRST_PRAYER, { title: SECRET });
    await clearAllFormDrafts();
    expect([...idbStore.keys()]).toEqual([]);
    expect(await loadFormDraft(DRAFT_SLOTS.NEW_PRAYER)).toBeNull();
    expect(await loadFormDraft(DRAFT_SLOTS.FIRST_PRAYER)).toBeNull();
  });
});

describe('prayerFormDrafts — failing closed', () => {
  it('ignores and deletes a draft past its lifetime', async () => {
    await saveFormDraft(SLOT, FIELDS);
    __resetMemoryForTests();
    const stored = idbStore.get(STORAGE_KEY);
    // 49 hours old — one hour past the 48h window.
    idbStore.set(STORAGE_KEY, { ...stored, updatedAt: Date.now() - 49 * 60 * 60 * 1000 });
    expect(await loadFormDraft(SLOT)).toBeNull();
    expect(idbStore.get(STORAGE_KEY)).toBeUndefined();
  });

  it('deletes a record it cannot decrypt rather than surfacing garbage', async () => {
    await saveFormDraft(SLOT, FIELDS);
    __resetMemoryForTests();
    const stored = idbStore.get(STORAGE_KEY);
    idbStore.set(STORAGE_KEY, {
      ...stored,
      key: await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']),
    });
    expect(await loadFormDraft(SLOT)).toBeNull();
    expect(idbStore.get(STORAGE_KEY)).toBeUndefined();
  });

  it('ignores a record written by a future version', async () => {
    await saveFormDraft(SLOT, FIELDS);
    __resetMemoryForTests();
    idbStore.set(STORAGE_KEY, { ...idbStore.get(STORAGE_KEY), v: 99 });
    expect(await loadFormDraft(SLOT)).toBeNull();
  });
});

describe('prayerFormDrafts — two tabs, one slot', () => {
  it('refuses to overwrite a draft another tab is actively writing', async () => {
    // A record left by another page load, seconds ago.
    await saveFormDraft(SLOT, FIELDS);
    __resetMemoryForTests();
    idbStore.set(STORAGE_KEY, {
      ...idbStore.get(STORAGE_KEY),
      writer: 'another-tab',
      updatedAt: Date.now() - 5_000,
    });

    expect(await saveFormDraft(SLOT, { ...FIELDS, title: 'typed in this tab' })).toBe('skipped');
    // The other tab's work is intact — and still readable here, which is what
    // makes the refusal safe rather than a silent loss.
    expect((await loadFormDraft(SLOT)).title).toBe(SECRET);
  });

  it('takes over a slot whose owner has gone quiet', async () => {
    await saveFormDraft(SLOT, FIELDS);
    __resetMemoryForTests();
    idbStore.set(STORAGE_KEY, {
      ...idbStore.get(STORAGE_KEY),
      writer: 'a-tab-that-was-closed',
      updatedAt: Date.now() - 5 * 60 * 1000,
    });

    expect(await saveFormDraft(SLOT, { ...FIELDS, title: 'resumed here' })).toBe('saved');
    expect((await loadFormDraft(SLOT)).title).toBe('resumed here');
  });

  it('serializes concurrent writes so the last one wins intact', async () => {
    await Promise.all([
      saveFormDraft(SLOT, { ...FIELDS, title: 'first' }),
      saveFormDraft(SLOT, { ...FIELDS, title: 'second' }),
      saveFormDraft(SLOT, { ...FIELDS, title: 'third' }),
    ]);
    expect((await loadFormDraft(SLOT)).title).toBe('third');
  });
});
