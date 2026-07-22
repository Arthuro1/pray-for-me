// The guest prayer draft is the ONLY place a signed-out visitor's prayer lives.
// These tests pin its privacy and durability contract: the subject is never in
// plaintext storage, it survives a simulated OAuth reload (encrypted, restored
// from IndexedDB), and expired / corrupt / declined drafts are deleted.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// A persistent fake IndexedDB (via idb-keyval) plus a truthy `indexedDB` global so
// the module takes its persistent path, and a localStorage shim for the marker.
const idbStore = vi.hoisted(() => new Map());
vi.hoisted(() => {
  globalThis.indexedDB = {}; // truthy → hasIDB() passes; storage is the mock below
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
});

vi.mock('idb-keyval', () => ({
  get: async (k) => idbStore.get(k),
  set: async (k, v) => { idbStore.set(k, v); },
  del: async (k) => { idbStore.delete(k); },
}));

import {
  saveGuestDraft, loadGuestDraft, clearGuestDraft, markGuestDraftPrayed,
  hasPendingGuestDraftSync, __resetMemoryForTests,
} from './guestPrayerDraft';

const SLOT = 'pfm_guest_draft';
const SECRET = 'SECRET_pray_for_my_estranged_brother';

// Everything the module persisted (IndexedDB record + localStorage marker),
// serialized so we can scan it for leaked plaintext.
function persistedBlob() {
  const rec = idbStore.get(SLOT);
  return JSON.stringify(rec) + '||' + String(localStorage.getItem(SLOT));
}

beforeEach(() => {
  idbStore.clear();
  localStorage.clear();
  __resetMemoryForTests();
});

describe('guestPrayerDraft — privacy at rest', () => {
  it('never writes the prayer subject in plaintext (only ciphertext + a bare marker)', async () => {
    await saveGuestDraft({ title: SECRET, contentLanguage: 'en' });
    const blob = persistedBlob();
    expect(blob).not.toContain(SECRET);
    // The IndexedDB record carries an opaque encrypted payload, not the text.
    expect(idbStore.get(SLOT).payload.ct).toBeTruthy();
    // The localStorage marker is only a timestamp (content-free).
    expect(Number.isFinite(Number(localStorage.getItem(SLOT)))).toBe(true);
  });

  it('round-trips the draft back to its plaintext for the owner', async () => {
    const { id } = await saveGuestDraft({ title: SECRET, contentLanguage: 'fr' });
    const draft = await loadGuestDraft();
    expect(draft).toMatchObject({ id, title: SECRET, completed: false, contentLanguage: 'fr' });
  });
});

describe('guestPrayerDraft — survives a same-device OAuth reload', () => {
  it('restores the encrypted draft after the in-memory state is gone', async () => {
    const { id } = await saveGuestDraft({ title: SECRET, contentLanguage: 'en' });
    // Simulate the page reloading after an OAuth redirect: memory is cleared, but
    // the encrypted record + its non-extractable key persist in IndexedDB.
    __resetMemoryForTests();
    const draft = await loadGuestDraft();
    expect(draft?.id).toBe(id);
    expect(draft?.title).toBe(SECRET);
  });
});

describe('guestPrayerDraft — lifetime & integrity', () => {
  it('deletes an expired draft on read (older than 24h)', async () => {
    await saveGuestDraft({ title: SECRET });
    // Age both the record and the marker past the 24h ceiling.
    const rec = idbStore.get(SLOT);
    const old = Date.now() - 25 * 60 * 60 * 1000;
    idbStore.set(SLOT, { ...rec, createdAt: old });
    localStorage.setItem(SLOT, String(old));
    __resetMemoryForTests();

    expect(hasPendingGuestDraftSync()).toBe(false);
    expect(await loadGuestDraft()).toBeNull();
    expect(idbStore.has(SLOT)).toBe(false);
  });

  it('deletes a corrupt / undecryptable draft on read', async () => {
    await saveGuestDraft({ title: SECRET });
    const rec = idbStore.get(SLOT);
    // Valid base64 but the wrong ciphertext → GCM auth failure on decrypt.
    idbStore.set(SLOT, { ...rec, payload: { v: 1, iv: 'AAAAAAAAAAAAAAAA', ct: 'AAAA' } });
    __resetMemoryForTests();

    expect(await loadGuestDraft()).toBeNull();
    expect(idbStore.has(SLOT)).toBe(false);
  });
});

describe('guestPrayerDraft — declining & completion', () => {
  it('clearGuestDraft deletes everything (the "finish without saving" path)', async () => {
    await saveGuestDraft({ title: SECRET });
    expect(hasPendingGuestDraftSync()).toBe(true);
    await clearGuestDraft();
    expect(hasPendingGuestDraftSync()).toBe(false);
    expect(idbStore.has(SLOT)).toBe(false);
    expect(localStorage.getItem(SLOT)).toBeNull();
    expect(await loadGuestDraft()).toBeNull();
  });

  it('markGuestDraftPrayed flips completion without changing the id', async () => {
    const { id } = await saveGuestDraft({ title: SECRET, contentLanguage: 'en' });
    await markGuestDraftPrayed();
    __resetMemoryForTests();
    const draft = await loadGuestDraft();
    expect(draft?.id).toBe(id);
    expect(draft?.completed).toBe(true);
    // Still no plaintext leaked after the re-save.
    expect(persistedBlob()).not.toContain(SECRET);
  });
});
