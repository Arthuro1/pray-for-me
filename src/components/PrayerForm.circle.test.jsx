// @vitest-environment jsdom
//
// "Place on your altar" is optional: nothing is preselected, nothing is
// required, and it is offered only where the circle can live inside the
// prayer's ciphertext (lib/circles.js, lib/crypto/prayerCrypto.js).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

vi.mock('../lib/prayerFormDrafts', async (orig) => ({
  ...(await orig()),
  saveFormDraft: vi.fn(async () => 'saved'),
  loadFormDraft: vi.fn(async () => null),
  clearFormDraft: vi.fn(async () => {}),
}));

const crypto = vi.hoisted(() => ({ canHold: true }));
vi.mock('../lib/crypto/prayerCrypto', async (orig) => ({
  ...(await orig()),
  canHoldPrivateMetadata: () => crypto.canHold,
  willEncryptNewPrayer: () => crypto.canHold,
}));

import PrayerForm from './PrayerForm';
import usePrayerStore from '../store/prayerStore';
import useCommunityStore from '../store/communityStore';
import { CIRCLES } from '../lib/circles';
import { t } from '../i18n';

const lang = 'fr';
const addPrayer = vi.fn(async () => 'new-id');

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  crypto.canHold = true;
  useCommunityStore.setState({ prayerShares: {} });
  usePrayerStore.setState({ prayers: [], categories: [], settings: { language: lang }, addPrayer, updatePrayer: vi.fn() });
});

const settled = () => act(async () => { await Promise.resolve(); });
const openOrganize = () => fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'organizeLabel')) }));
const write = (title) => fireEvent.change(screen.getByLabelText(t(lang, 'prayerFieldLabel')), { target: { value: title } });
const save = () => act(async () => { fireEvent.click(screen.getByRole('button', { name: t(lang, 'savePrayer') })); });

describe('PrayerForm — place on your altar', () => {
  it('asks what to bring before God, and offers all seven circles with none chosen', async () => {
    render(<PrayerForm onClose={() => {}} />);
    await settled();
    expect(screen.getByLabelText(t(lang, 'prayerFieldLabel'))).toBeTruthy();
    openOrganize();
    const group = screen.getByRole('group', { name: t(lang, 'placeOnAltarLabel') });
    const chips = group.querySelectorAll('button[aria-pressed]');
    expect(chips).toHaveLength(CIRCLES.length);
    for (const chip of chips) expect(chip.getAttribute('aria-pressed')).toBe('false');
  });

  it('saves without a circle when none is chosen — the circle is never required', async () => {
    render(<PrayerForm onClose={() => {}} />);
    await settled();
    write('Paix');
    await save();
    expect(addPrayer).toHaveBeenCalledWith(expect.objectContaining({ title: 'Paix', circle: null }));
  });

  it('saves the circle chosen, and a second press takes it back', async () => {
    render(<PrayerForm onClose={() => {}} />);
    await settled();
    write('Pour mes enfants');
    openOrganize();
    const house = screen.getByRole('button', { name: new RegExp(t(lang, 'circle_household')) });
    fireEvent.click(house);
    expect(house.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(house);
    expect(house.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(house);
    await save();
    expect(addPrayer).toHaveBeenCalledWith(expect.objectContaining({ circle: 'household' }));
  });

  it('is not offered when the prayer could not keep it encrypted', async () => {
    crypto.canHold = false;
    render(<PrayerForm onClose={() => {}} />);
    await settled();
    openOrganize();
    expect(screen.queryByRole('group', { name: t(lang, 'placeOnAltarLabel') })).toBeNull();
  });
});
