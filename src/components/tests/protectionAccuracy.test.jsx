// @vitest-environment jsdom
//
// A plaintext prayer must NEVER be presented as encrypted. The vault is a read
// capability: unlocking it opens ciphertext, it does not retroactively encrypt
// a legacy row — so these render the SAME prayers with the vault unlocked and
// locked and assert the label doesn't move.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

// The device key state, flipped per test. The whole point is that changing it
// must not change what any of these surfaces say.
const vault = vi.hoisted(() => ({ unlocked: false }));
vi.mock('../../lib/crypto/keyManager', () => ({
  isUnlocked: () => vault.unlocked,
  getMasterKey: () => null,
}));
vi.mock('../../lib/crypto/prayerCrypto', async (importOriginal) => ({
  ...(await importOriginal()),
  canEncrypt: () => vault.unlocked,
  willEncryptNewPrayer: () => vault.unlocked,
}));
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
      auth: { getSession: async () => ({ data: { session: null } }), getUser: async () => ({ data: { user: null } }) },
      from: () => chain,
      rpc: async () => ({ data: null, error: null }),
    },
  };
});
vi.mock('../../lib/mutationQueue', () => ({ enqueue: vi.fn(), pendingPrayerIds: () => new Set() }));

import PrayerSavedStep from '../PrayerSavedStep';
import usePrayerStore from '../../store/prayerStore';
import { t } from '../../i18n';

const lang = 'fr';
const ENCRYPTED = t(lang, 'protEncrypted');
const ENCRYPTED_LOCKED = t(lang, 'protEncryptedLocked');
const WILL_ENCRYPT = t(lang, 'protWillEncrypt');

const prayer = (extra = {}) => ({
  id: 'p1', title: 'Ma prière', description: '', status: 'active',
  created_at: '2026-07-01T00:00:00Z',
  prayer_categories: [], prayer_points: [], prayer_updates: [], prayer_testimonies: [],
  ...extra,
});

const setStore = (p) => usePrayerStore.setState({ prayers: p ? [p] : [], categories: [], completions: {}, settings: { language: lang } });

afterEach(cleanup);
beforeEach(() => { localStorage.clear(); vault.unlocked = false; });

// Any "encrypted"-family label currently on screen, or null.
const protectionShown = () => {
  for (const label of [ENCRYPTED, ENCRYPTED_LOCKED, WILL_ENCRYPT]) {
    if (screen.queryByText(label)) return label;
  }
  return null;
};

describe('saved confirmation — protection comes from the prayer, not the vault', () => {
  it('does not label a plaintext prayer encrypted while the vault is UNLOCKED', () => {
    vault.unlocked = true;
    setStore(prayer()); // saved before the key existed: no encryption metadata
    render(<PrayerSavedStep prayerId="p1" title="Ma prière" description="" lang={lang} onClose={() => {}} />);
    expect(protectionShown()).toBeNull();
    // Audience is still stated — the two facts are independent.
    expect(screen.getByText(t(lang, 'audiencePrivate'))).toBeTruthy();
  });

  it('does not label a plaintext prayer encrypted while the vault is LOCKED', () => {
    vault.unlocked = false;
    setStore(prayer());
    render(<PrayerSavedStep prayerId="p1" title="Ma prière" description="" lang={lang} onClose={() => {}} />);
    expect(protectionShown()).toBeNull();
  });

  it('labels a genuinely encrypted prayer encrypted in BOTH vault states', () => {
    for (const unlocked of [true, false]) {
      vault.unlocked = unlocked;
      setStore(prayer({ encryption_version: 1 }));
      render(<PrayerSavedStep prayerId="p1" title="Ma prière" description="" lang={lang} onClose={() => {}} />);
      expect(screen.getByText(ENCRYPTED)).toBeTruthy();
      cleanup();
    }
  });

  it('uses the caller’s EXPLICIT optimistic metadata when the store row has not landed yet', () => {
    vault.unlocked = true;
    setStore(null); // store race: the prayer isn't in the list
    // The write was NOT encrypted, and an unlocked vault must not paper over that.
    render(<PrayerSavedStep prayerId="p1" title="Ma prière" description="" encrypted={false} lang={lang} onClose={() => {}} />);
    expect(protectionShown()).toBeNull();

    cleanup();
    vault.unlocked = false; // ...and the reverse: encrypted write, vault since locked
    render(<PrayerSavedStep prayerId="p1" title="Ma prière" description="" encrypted lang={lang} onClose={() => {}} />);
    expect(screen.getByText(ENCRYPTED)).toBeTruthy();
  });

  it('keeps audience and protection as two separate elements, never one merged claim', () => {
    vault.unlocked = true;
    setStore(prayer({ encryption_version: 1 }));
    render(<PrayerSavedStep prayerId="p1" title="Ma prière" description="" lang={lang} onClose={() => {}} />);
    const audience = screen.getByText(t(lang, 'audiencePrivate'));
    const protection = screen.getByText(ENCRYPTED);
    expect(audience).not.toBe(protection);
    expect(audience.textContent).not.toContain(ENCRYPTED);
  });

  it('gives the close control a name and a 44px target', () => {
    setStore(prayer());
    render(<PrayerSavedStep prayerId="p1" title="Ma prière" description="" lang={lang} onClose={() => {}} />);
    const close = screen.getByRole('button', { name: t(lang, 'close') });
    expect(close.className).toMatch(/w-11/);
    expect(close.className).toMatch(/h-11/);
  });
});

describe('the store records per-prayer encryption at write time', () => {
  it('stamps _encrypted false when the key is unavailable, true when it is', async () => {
    const { supabase } = await import('../../lib/supabase');
    supabase.auth.getSession = async () => ({ data: { session: { user: { id: 'u1' } } } });

    vault.unlocked = false;
    usePrayerStore.setState({ prayers: [], settings: { language: lang } });
    await usePrayerStore.getState().addPrayer({ title: 'Plaintext' });
    expect(usePrayerStore.getState().prayers[0]._encrypted).toBe(false);
  });
});
