// @vitest-environment jsdom
//
// The Intercession Circle is optional and quiet in the composer: writing a
// prayer never means reading seven circles. One row names the circle (or "Not
// set") and opens onto the circles only when asked. Nothing is preselected
// unless the person came from a circle, and the row is offered only where the
// circle can live inside the prayer's ciphertext (lib/circles.js,
// lib/crypto/prayerCrypto.js).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, within } from '@testing-library/react';

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
const circleRow = () => screen.queryByRole('button', { name: new RegExp(t(lang, 'circleFieldLabel')) });
const circleChoices = () => screen.queryByRole('group', { name: t(lang, 'circleFieldLabel') });
const chip = (circle) => within(circleChoices()).getByRole('button', { name: t(lang, `circle_${circle}`) });

describe('PrayerForm — the Intercession Circle row', () => {
  it('asks only what to bring before God; the seven circles wait behind one quiet row', async () => {
    render(<PrayerForm onClose={() => {}} />);
    await settled();
    expect(screen.getByLabelText(t(lang, 'prayerFieldLabel'))).toBeTruthy();
    // No circle chips while writing — one row saying none is set.
    expect(circleChoices()).toBeNull();
    expect(circleRow().getAttribute('aria-expanded')).toBe('false');
    expect(circleRow().textContent).toContain(t(lang, 'circleNotSet'));

    fireEvent.click(circleRow());
    expect(circleRow().getAttribute('aria-expanded')).toBe('true');
    const chips = circleChoices().querySelectorAll('button[aria-pressed]');
    expect(chips).toHaveLength(CIRCLES.length);
    for (const each of chips) expect(each.getAttribute('aria-pressed')).toBe('false');
  });

  it('saves without a circle when none is chosen — the circle is never required', async () => {
    render(<PrayerForm onClose={() => {}} />);
    await settled();
    write('Paix');
    await save();
    expect(addPrayer).toHaveBeenCalledWith(expect.objectContaining({ title: 'Paix', circle: null }));
  });

  it('choosing folds the circles away, names the choice on the row and returns focus to it', async () => {
    render(<PrayerForm onClose={() => {}} />);
    await settled();
    write('Pour mes enfants');
    fireEvent.click(circleRow());
    fireEvent.click(chip('household'));

    expect(circleChoices()).toBeNull();
    expect(circleRow().textContent).toContain(t(lang, 'circle_household'));
    expect(document.activeElement).toBe(circleRow());
    await save();
    expect(addPrayer).toHaveBeenCalledWith(expect.objectContaining({ circle: 'household' }));
  });

  it('pressing the chosen circle again clears it', async () => {
    render(<PrayerForm onClose={() => {}} />);
    await settled();
    write('Pour mes enfants');
    fireEvent.click(circleRow());
    fireEvent.click(chip('household'));
    fireEvent.click(circleRow());
    expect(chip('household').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(chip('household'));
    expect(circleRow().textContent).toContain(t(lang, 'circleNotSet'));
    await save();
    expect(addPrayer).toHaveBeenCalledWith(expect.objectContaining({ circle: null }));
  });

  it('is not offered when the prayer could not keep it encrypted', async () => {
    crypto.canHold = false;
    render(<PrayerForm onClose={() => {}} />);
    await settled();
    expect(circleRow()).toBeNull();
    openOrganize();
    expect(circleRow()).toBeNull();
  });
});

describe('PrayerForm — arriving from a circle', () => {
  it('asks the circle’s own question and preselects it, still free to change', async () => {
    render(<PrayerForm onClose={() => {}} context={{ circle: 'church' }} />);
    await settled();
    const field = screen.getByLabelText(t(lang, 'circlePrompt_church'));
    expect(field.value).toBe(''); // the words are always the person's own
    // Preselected, named on the row — no explanation, no chips in the way.
    expect(circleChoices()).toBeNull();
    expect(circleRow().textContent).toContain(t(lang, 'circle_church'));

    fireEvent.change(field, { target: { value: 'Pour nos anciens' } });
    fireEvent.click(circleRow());
    expect(chip('church').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(chip('church')); // cleared — the circle is never required
    await save();
    expect(addPrayer).toHaveBeenCalledWith(expect.objectContaining({ title: 'Pour nos anciens', circle: null }));
  });

  it('shows a "Pray this" prompt above the empty field as a starting point, never inside it', async () => {
    const prompt = 'Donne-nous des ouvriers pour la moisson.';
    render(<PrayerForm onClose={() => {}} context={{ circle: 'kingdom', prompt }} />);
    await settled();
    const field = screen.getByLabelText(t(lang, 'circlePrompt_kingdom'));
    expect(field.value).toBe('');
    expect(field.getAttribute('aria-describedby')).toBe('prayer-starting-point');
    expect(document.getElementById('prayer-starting-point').textContent).toBe(prompt);

    fireEvent.change(field, { target: { value: 'Pour Marc, en mission' } });
    await save();
    expect(addPrayer).toHaveBeenCalledWith(expect.objectContaining({ title: 'Pour Marc, en mission', circle: 'kingdom' }));
    expect(JSON.stringify(addPrayer.mock.calls[0][0])).not.toContain(prompt);
  });

  it('ignores a context that is not a circle', async () => {
    render(<PrayerForm onClose={() => {}} context={{ circle: 'galaxies' }} />);
    await settled();
    expect(screen.getByLabelText(t(lang, 'prayerFieldLabel'))).toBeTruthy();
    expect(circleRow().textContent).toContain(t(lang, 'circleNotSet'));
  });

  it('names a saved prayer’s circle on the row when editing it', async () => {
    const editPrayer = { id: 'p1', title: 'Ma famille', circle: 'household', prayer_categories: [], schedule: null };
    const updatePrayer = vi.fn();
    usePrayerStore.setState({ updatePrayer });
    render(<PrayerForm onClose={() => {}} editPrayer={editPrayer} />);
    await settled();
    expect(circleRow().textContent).toContain(t(lang, 'circle_household'));
    // Organize stays folded: the circle does not live there.
    expect(screen.getByRole('button', { name: new RegExp(t(lang, 'organizeLabel')) }).getAttribute('aria-expanded')).toBe('false');
  });
});
