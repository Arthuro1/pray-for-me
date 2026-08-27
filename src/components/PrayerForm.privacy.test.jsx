// @vitest-environment jsdom
//
// Pray4Me is right to be explicit about privacy — but saying the same thing
// three times around one private note makes it feel riskier, not safer. Each
// place now has ONE job:
//
//   the form   — who can see this (and, quietly, that it will be encrypted)
//   the toast  — that it was saved, privately
//   the panel  — the prayer, and praying it
//
// What must NOT change: the audience is still stated before saving, sharing
// still names exactly who will receive a prayer, and the encryption status
// stays factually accurate everywhere it appears.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

vi.mock('../lib/prayerFormDrafts', async (orig) => ({
  ...(await orig()),
  saveFormDraft: vi.fn(async () => 'saved'),
  loadFormDraft: vi.fn(async () => null),
  clearFormDraft: vi.fn(async () => {}),
}));

const willEncrypt = vi.hoisted(() => ({ value: true }));
vi.mock('../lib/crypto/prayerCrypto', async (orig) => ({
  ...(await orig()),
  willEncryptNewPrayer: () => willEncrypt.value,
}));

import PrayerForm from './PrayerForm';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import useToastStore from '../store/toastStore';
import { t } from '../i18n';

const lang = 'fr';
const addPrayer = vi.fn(async () => 'new-prayer-id');
const updatePrayer = vi.fn();

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  willEncrypt.value = true;
  useToastStore.setState({ toasts: [] });
  useCommunityStore.setState({ prayerShares: {} });
  usePrayerStore.setState({
    prayers: [], categories: [], settings: { language: lang }, addPrayer, updatePrayer,
  });
});

const renderForm = (props = {}) => render(<PrayerForm onClose={() => {}} {...props} />);
const settled = () => act(async () => { await Promise.resolve(); });
const submit = async () => {
  await act(async () => {
    fireEvent.submit(screen.getByLabelText(t(lang, 'prayerFieldLabel')).closest('form'));
  });
};
const toastMessages = () => useToastStore.getState().toasts.map((toast) => toast.message);

describe('before saving — the form answers "who can see this?"', () => {
  it('states the audience, and that it will be encrypted', async () => {
    renderForm();
    await settled();
    expect(screen.getByText(t(lang, 'audiencePrivate'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'protWillEncrypt'))).toBeTruthy();
  });

  it('promises no encryption it cannot deliver', async () => {
    willEncrypt.value = false;
    renderForm();
    await settled();
    expect(screen.getByText(t(lang, 'audiencePrivate'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'protWillEncrypt'))).toBeNull();
  });

  it('does not claim an audience for a community request — sharing states its own', async () => {
    renderForm({ communityMode: true, onCommunitySubmit: vi.fn() });
    await settled();
    expect(screen.queryByText(t(lang, 'audiencePrivate'))).toBeNull();
  });
});

describe('after saving — one confirmation, not three', () => {
  it('confirms the save once, without re-explaining the encryption', async () => {
    renderForm();
    await settled();
    fireEvent.change(screen.getByLabelText(t(lang, 'prayerFieldLabel')), {
      target: { value: 'Pour la santé de ma sœur' },
    });
    await submit();

    expect(toastMessages()).toEqual([t(lang, 'savedPrivately')]);
    // The longer "· Encrypted on this device" belongs to the edit path, where
    // the toast is the only confirmation there is.
    expect(toastMessages()).not.toContain(t(lang, 'savedEncrypted'));
  });

  it('leaves the saved panel about the prayer, with privacy stated once and quietly', async () => {
    renderForm();
    await settled();
    fireEvent.change(screen.getByLabelText(t(lang, 'prayerFieldLabel')), {
      target: { value: 'Pour la santé de ma sœur' },
    });
    await submit();

    expect(screen.getByText(t(lang, 'prayerSavedTitle'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'prayNowCta'))).toBeTruthy();
    // The badge remains — the fact, not the sermon.
    expect(screen.getByText(t(lang, 'audiencePrivate'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'savedPrivately'))).toBeNull();
  });

  it('keeps the full wording on an edit, where nothing else confirms it', async () => {
    renderForm({
      editPrayer: {
        id: 'p1', title: 'Une prière', description: '', prayer_categories: [], category_ids: [],
      },
    });
    await settled();
    await submit();

    expect(updatePrayer).toHaveBeenCalled();
    expect(toastMessages()).toEqual([t(lang, 'savedEncrypted')]);
  });

  it('still says plainly where an offline prayer lives', async () => {
    const onLine = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
    try {
      renderForm();
      await settled();
      fireEvent.change(screen.getByLabelText(t(lang, 'prayerFieldLabel')), { target: { value: 'Hors ligne' } });
      await submit();
      expect(toastMessages()).toEqual([t(lang, 'savedOffline')]);
    } finally {
      if (onLine) Object.defineProperty(window.navigator, 'onLine', onLine);
    }
  });
});
