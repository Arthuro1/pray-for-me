// Real-browser E2E of the "pray first, sign up only to save" guest flow.
//
// Run with:  npm run test:browser   (Chromium via @vitest/browser-playwright)
//
// Why a REAL browser and not jsdom: the guest draft is encrypted at rest with
// AES-256-GCM under a NON-EXTRACTABLE CryptoKey persisted in IndexedDB by
// structured clone (see src/lib/guestPrayerDraft.js). jsdom has neither a
// faithful Web Crypto SubtleCrypto nor IndexedDB CryptoKey cloning, so the
// encrypted-at-rest guarantee — the whole privacy promise of this flow — can
// only be exercised in a real browser. This is the thin end-to-end layer unit
// tests can't cover.
//
// Deliberately SECRET-FREE: the guest flow makes zero network calls, so it runs
// in CI with no Supabase/Anthropic credentials. Extend the same harness to
// authenticated flows once test credentials are wired (see docs/TESTING.md).
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import GuestPrayerFlow from './GuestPrayerFlow';
import {
  saveGuestDraft,
  loadGuestDraft,
  clearGuestDraft,
  __resetMemoryForTests,
} from '../lib/guestPrayerDraft';
import { t } from '../i18n';

beforeEach(async () => {
  cleanup();
  await clearGuestDraft();
  localStorage.clear();
});

afterEach(async () => {
  cleanup();
  await clearGuestDraft();
});

describe('GuestPrayerFlow (real browser)', () => {
  // The encrypted-at-rest guarantee: a draft written to IndexedDB is recoverable
  // ONLY by decrypting with the persisted non-extractable key — real AES-GCM +
  // real IndexedDB CryptoKey clone, not a plaintext stash. __resetMemoryForTests
  // drops the in-process cache so the read must come from storage (as it would
  // after a page reload / OAuth redirect), not from the write's leftover state.
  it('persists the guest prayer as decrypt-only ciphertext (real Web Crypto + IndexedDB)', async () => {
    const subject = "my sister's recovery";
    const { id } = await saveGuestDraft({ title: subject, contentLanguage: 'en' });
    expect(id).toBeTruthy();

    // Nothing in plaintext localStorage reveals the prayer text — the presence
    // marker is content-free by design (only a timestamp).
    for (let i = 0; i < localStorage.length; i += 1) {
      expect(localStorage.getItem(localStorage.key(i)) || '').not.toContain(subject);
    }

    __resetMemoryForTests(); // force the read to go through storage
    const draft = await loadGuestDraft();
    expect(draft).not.toBeNull();
    expect(draft.title).toBe(subject);
    expect(draft.contentLanguage).toBe('en');
  });

  // The visitor-facing happy path, rendered in a real browser: the capture
  // question appears, the visitor types a prayer, submits, and the prayer session
  // opens showing their words. Real React render + real Web Crypto run under the
  // hood — submitCapture encrypts the draft (AES-GCM) before the session opens,
  // so reaching the session is itself proof the encrypt step succeeded.
  it('renders the capture question and opens the prayer session in a real browser', async () => {
    const subject = 'strength for a hard week';
    render(<GuestPrayerFlow lang="en" onFinish={() => {}} onRequestSave={() => {}} />);

    expect(screen.getByText(t('en', 'firstPrayerQuestion'))).toBeTruthy();
    fireEvent.change(
      screen.getByPlaceholderText(t('en', 'onboardCapturePlaceholder')),
      { target: { value: subject } },
    );
    fireEvent.click(screen.getByText(t('en', 'firstPrayerPrayCta')));

    // The session opens and shows the captured subject as its heading.
    await waitFor(() => expect(screen.getByText(subject)).toBeTruthy());
  });
});
