// The prayer-note draft's privacy contract only really holds if the browser
// does what we assume: real AES-GCM, and real IndexedDB structured-cloning a
// NON-EXTRACTABLE CryptoKey alongside the ciphertext. jsdom can't prove either,
// so this is the layer that does — the same reason the guest prayer draft has a
// browser spec.
import { beforeEach, describe, expect, it } from 'vitest';
import { get as idbGet, del as idbDel } from 'idb-keyval';
import {
  saveNoteDraft, loadNoteDraft, clearNoteDraft, __resetMemoryForTests,
} from './prayerNoteDrafts';

const PRAYER = 'browser-prayer';
const SLOT = `pfm_note_draft:${PRAYER}`;
const SECRET = 'SECRET_call_my_estranged_brother_on_Thursday';
const AUDIO = new Uint8Array([12, 34, 56, 78, 90]);

beforeEach(async () => {
  await clearNoteDraft(PRAYER);
  await idbDel(SLOT);
  __resetMemoryForTests();
});

describe('prayer-note drafts in a real browser', () => {
  it('persists the note as decrypt-only ciphertext, keyed by a non-extractable CryptoKey', async () => {
    await saveNoteDraft({
      prayerId: PRAYER,
      text: SECRET,
      voice: { blob: new Blob([AUDIO], { type: 'audio/mp4' }), mime: 'audio/mp4', seconds: 11 },
    });

    // Read the raw record back out of real IndexedDB.
    const stored = await idbGet(SLOT);
    expect(stored).toBeTruthy();

    // The CryptoKey survived structured clone and still cannot be exported.
    expect(stored.key).toBeInstanceOf(CryptoKey);
    expect(stored.key.extractable).toBe(false);
    await expect(crypto.subtle.exportKey('raw', stored.key)).rejects.toThrow();

    // Nothing readable is at rest — not the text, not the audio bytes.
    const atRest = JSON.stringify(stored, (_, v) => (v instanceof ArrayBuffer || ArrayBuffer.isView(v) ? '<bytes>' : v));
    expect(atRest).not.toContain(SECRET);
    expect(atRest).not.toContain('estranged');
    expect(new Uint8Array(stored.audio.ct)).not.toEqual(AUDIO);
    expect(stored.audio.ct.byteLength).toBeGreaterThan(AUDIO.length); // GCM tag included

    // And it round-trips after a simulated reload (memory cache dropped).
    __resetMemoryForTests();
    const draft = await loadNoteDraft(PRAYER);
    expect(draft.text).toBe(SECRET);
    expect(draft.voice.seconds).toBe(11);
    expect(new Uint8Array(await draft.voice.blob.arrayBuffer())).toEqual(AUDIO);
  });

  it('fails closed when the stored ciphertext is tampered with', async () => {
    await saveNoteDraft({ prayerId: PRAYER, text: SECRET });
    const stored = await idbGet(SLOT);
    // Real GCM authentication: one flipped character must not decrypt. The
    // replacement has to differ from what is already there — hardcoding 'A'
    // silently tampered with nothing on the ~1 run in 64 where the ciphertext
    // already started with 'A', and the test then failed on a correct decrypt.
    const { ct } = stored.payload;
    const { set: idbSet } = await import('idb-keyval');
    await idbSet(SLOT, { ...stored, payload: { ...stored.payload, ct: `${ct[0] === 'A' ? 'B' : 'A'}${ct.slice(1)}` } });

    __resetMemoryForTests();
    expect(await loadNoteDraft(PRAYER)).toBeNull();
    expect(await idbGet(SLOT)).toBeUndefined(); // deleted rather than trusted
  });
});
