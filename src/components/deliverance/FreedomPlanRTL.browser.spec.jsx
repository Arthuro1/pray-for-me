import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import DeliveranceDayGuide from './DeliveranceDayGuide';
import { FREEDOM_IN_CHRIST } from '../../content/plans/freedomInChrist';
import { loadLocale, t } from '../../i18n';

// The deliverance day and its guided walk in a REAL right-to-left browser.
//
// jsdom reports whatever `direction` it is told; only a real engine resolves
// `dir="rtl"` inheritance, logical properties and RTL text flow. This spec walks
// the whole flow in Arabic — disclosure, the Holy Spirit invitation, the
// certainty radiogroup, the mode choice, and Back/Next inside the step dialog —
// because that flow is the one place this plan asks a reader to make a
// consequential choice, and it has to be operable in every language we ship.
afterEach(cleanup);

const lang = 'ar';
const day = FREEDOM_IN_CHRIST.days[5]; // Renouncing idolatry: explanation, examples, inventory

beforeAll(async () => { await loadLocale(lang); });

describe('the freedom plan day in a real RTL browser', () => {
  it('inherits RTL direction through the day guidance', () => {
    render(<main dir="rtl"><DeliveranceDayGuide day={day} lang={lang} /></main>);
    const group = screen.getByRole('radiogroup', { name: t(lang, 'freedomCertaintyQuestion') });
    expect(getComputedStyle(group).direction).toBe('rtl');
  });

  it('keeps the definition and examples behind a working disclosure', () => {
    render(<main dir="rtl"><DeliveranceDayGuide day={day} lang={lang} /></main>);
    const trigger = screen.getByRole('button', { name: t(lang, 'freedomWhatThisMeans') });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(t(lang, 'freedomExamplesHeading'))).toBeTruthy();
  });

  it('keeps the certainty radios operable and announced', () => {
    render(<main dir="rtl"><DeliveranceDayGuide day={day} lang={lang} /></main>);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'freedomCertaintyKnownFamily') }));
    expect(screen.getByRole('radio', { name: t(lang, 'freedomCertaintyKnownFamily') }).getAttribute('aria-checked')).toBe('true');
  });

  it('walks the guided prayer forwards and backwards, in RTL, with long Arabic prayers', () => {
    render(<main dir="rtl"><DeliveranceDayGuide day={day} lang={lang} /></main>);
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'freedomCertaintyPersonal') }));
    fireEvent.click(screen.getByText(t(lang, 'freedomModeGuided')));

    const dialog = screen.getByRole('dialog');
    expect(getComputedStyle(dialog).direction).toBe('rtl');

    const heading = () => within(dialog).getByRole('heading', { level: 2 }).textContent;
    const first = heading();
    expect(first).toBe(t(lang, 'freedomStepInviteSpirit'));

    fireEvent.click(within(dialog).getByText(t(lang, 'freedomNextStep')));
    expect(heading()).not.toBe(first);
    fireEvent.click(within(dialog).getByText(t(lang, 'backBtn')));
    expect(heading()).toBe(first);

    // A long translated prayer must not push the page sideways: the dialog's
    // own scroller takes it instead.
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
  });

  it('can be paused from the RTL dialog', () => {
    render(<main dir="rtl"><DeliveranceDayGuide day={day} lang={lang} /></main>);
    fireEvent.click(screen.getByText(t(lang, 'freedomModeGuided')));
    fireEvent.click(screen.getByLabelText(t(lang, 'freedomPausePrayer')));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('stores nothing at all while the reader walks the whole flow', () => {
    // The browser's localStorage is shared with the test harness, so compare the
    // key set before and after rather than expecting it to be empty. What must
    // hold is that walking this flow adds NOTHING: the certainty, the "did
    // anything come to mind" answer and the chosen mode live in React state and
    // are gone the moment the day is left.
    const before = new Set(Object.keys(localStorage));
    render(<main dir="rtl"><DeliveranceDayGuide day={day} lang={lang} /></main>);
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'freedomCertaintyPersonal') }));
    fireEvent.click(screen.getByText(t(lang, 'freedomRemembranceNothing')));
    fireEvent.click(screen.getByText(t(lang, 'freedomModeGuided')));
    const added = Object.keys(localStorage).filter((k) => !before.has(k));
    expect(added).toEqual([]);
  });
});
