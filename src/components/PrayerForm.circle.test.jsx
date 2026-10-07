// @vitest-environment jsdom
//
// "Where are you carrying this?" is optional and sits right under the prayer's
// own words: nothing is required, nothing is preselected unless the person
// came from a circle, and it is offered only where the circle can live inside
// the prayer's ciphertext (lib/circles.js, lib/crypto/prayerCrypto.js).
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

describe('PrayerForm — where are you carrying this?', () => {
  it('asks what to bring before God, and offers all seven circles with none chosen', async () => {
    render(<PrayerForm onClose={() => {}} />);
    await settled();
    expect(screen.getByLabelText(t(lang, 'prayerFieldLabel'))).toBeTruthy();
    // In view at once — not folded behind Organize.
    const group = screen.getByRole('group', { name: t(lang, 'circleQuestion') });
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
    expect(screen.queryByRole('group', { name: t(lang, 'circleQuestion') })).toBeNull();
    openOrganize();
    expect(screen.queryByRole('group', { name: t(lang, 'circleQuestion') })).toBeNull();
  });
});

describe('PrayerForm — arriving from a circle', () => {
  it('asks the circle’s own question and preselects it, still free to change', async () => {
    render(<PrayerForm onClose={() => {}} context={{ circle: 'church' }} />);
    await settled();
    const field = screen.getByLabelText(t(lang, 'circlePrompt_church'));
    expect(field.value).toBe(''); // the words are always the person's own
    const church = screen.getByRole('button', { name: new RegExp(t(lang, 'circle_church')) });
    expect(church.getAttribute('aria-pressed')).toBe('true');

    fireEvent.change(field, { target: { value: 'Pour nos anciens' } });
    fireEvent.click(church); // cleared — the circle is never required
    await save();
    expect(addPrayer).toHaveBeenCalledWith(expect.objectContaining({ title: 'Pour nos anciens', circle: null }));
  });

  it('ignores a context that is not a circle', async () => {
    render(<PrayerForm onClose={() => {}} context={{ circle: 'galaxies' }} />);
    await settled();
    expect(screen.getByLabelText(t(lang, 'prayerFieldLabel'))).toBeTruthy();
    const pressed = screen.getByRole('group', { name: t(lang, 'circleQuestion') }).querySelectorAll('[aria-pressed="true"]');
    expect(pressed).toHaveLength(0);
  });

  it('keeps a saved prayer’s circle in view when editing it', async () => {
    const editPrayer = { id: 'p1', title: 'Ma famille', circle: 'household', prayer_categories: [], schedule: null };
    const updatePrayer = vi.fn();
    usePrayerStore.setState({ updatePrayer });
    render(<PrayerForm onClose={() => {}} editPrayer={editPrayer} />);
    await settled();
    expect(screen.getByRole('button', { name: new RegExp(t(lang, 'circle_household')) }).getAttribute('aria-pressed')).toBe('true');
    // Organize stays folded: the circle no longer lives there.
    expect(screen.getByRole('button', { name: new RegExp(t(lang, 'organizeLabel')) }).getAttribute('aria-expanded')).toBe('false');
  });
});
