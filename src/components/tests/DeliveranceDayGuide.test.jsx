// @vitest-environment jsdom
//
// The deliverance layer of a plan day, as it is actually rendered.
//
// What is being defended here is the difference between guiding and diagnosing:
//   • the Holy Spirit invitation appears on every such day, and "nothing came to
//     mind" is a first-class answer that never blocks anything;
//   • the certainty question is a real radiogroup, and what the reader picks is
//     what changes which reviewed prayer modules are walked;
//   • nothing the reader selects is written to storage, sent, or reported;
//   • the guided walk is one step at a time, reversible, and pausable;
//   • prayer points stay behind their own mode instead of crowding the day.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

vi.mock('../../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
const trackMock = vi.hoisted(() => vi.fn());
vi.mock('../../lib/analytics', () => ({ track: trackMock, EVENTS: { RESOURCE_OPENED: 'resource_opened' } }));

import PlanDayBody from '../PlanDayBody';
import DeliveranceDayGuide from '../deliverance/DeliveranceDayGuide';
import { FREEDOM_IN_CHRIST } from '../../content/plans/freedomInChrist';
import { t } from '../../i18n';

const lang = 'fr'; // the always-loaded fallback locale
afterEach(() => { cleanup(); trackMock.mockClear(); localStorage.clear(); });

// Day 6 (Renouncing idolatry): carries an explanation, examples, an inventory
// and a practical step — the fullest shape a day takes.
const inventoryDay = FREEDOM_IN_CHRIST.days[5];
// Day 23 (The armour of God): no inventory, no examples.
const plainDay = FREEDOM_IN_CHRIST.days[22];

const openGuided = () => fireEvent.click(screen.getByText(t(lang, 'freedomModeGuided')));

describe('the Holy Spirit invitation', () => {
  it('is offered on every deliverance day, with its supporting passages', () => {
    render(<DeliveranceDayGuide day={plainDay} lang={lang} />);
    expect(screen.getAllByText(t(lang, 'freedomStepInviteSpirit')).length).toBeGreaterThan(0);
    expect(screen.getByText(t(lang, 'freedomQuietSpace'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'freedomRemembranceQuestion'))).toBeTruthy();
    // Psalm 139:23-24 is cited, not quoted: it renders as a verse pill.
    expect(screen.getByText(/139/)).toBeTruthy();
  });

  it('treats "nothing specific" as a complete answer and reassures the reader', () => {
    render(<DeliveranceDayGuide day={plainDay} lang={lang} />);
    fireEvent.click(screen.getByText(t(lang, 'freedomRemembranceNothing')));
    expect(screen.getByText(t(lang, 'freedomNothingReassurance'))).toBeTruthy();
    // …and the reader can still pray the day normally.
    expect(screen.getByText(t(lang, 'freedomModeGuided'))).toBeTruthy();
  });

  it('never requires an answer at all before prayer is available', () => {
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} />);
    openGuided();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('hands "add a private prayer note" to the existing note composer', () => {
    const onAddNote = vi.fn();
    render(<DeliveranceDayGuide day={plainDay} lang={lang} onAddNote={onAddNote} />);
    fireEvent.click(screen.getByText(t(lang, 'freedomRemembranceNote')));
    expect(onAddNote).toHaveBeenCalledTimes(1);
    expect(screen.getByText(t(lang, 'freedomNoteHint'))).toBeTruthy();
  });
});

describe('the category explanation', () => {
  it('folds the definition and examples away until they are asked for', () => {
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} />);
    const trigger = screen.getByText(t(lang, 'freedomWhatThisMeans'));
    expect(screen.queryByText(t(lang, 'freedomExamplesHeading'))).toBeNull();
    fireEvent.click(trigger);
    expect(screen.getByText(t(lang, 'freedomExamplesHeading'))).toBeTruthy();
  });

  it('renders nothing at all for a day that has no category to define', () => {
    render(<DeliveranceDayGuide day={plainDay} lang={lang} />);
    expect(screen.queryByText(t(lang, 'freedomWhatThisMeans'))).toBeNull();
  });
});

describe('the certainty inventory', () => {
  it('offers all five levels as an accessible radiogroup, and none is preselected', () => {
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} />);
    const group = screen.getByRole('radiogroup', { name: t(lang, 'freedomCertaintyQuestion') });
    const radios = within(group).getAllByRole('radio');
    expect(radios).toHaveLength(5);
    for (const radio of radios) expect(radio.getAttribute('aria-checked')).toBe('false');
  });

  it('announces the selected level to a screen reader', () => {
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} />);
    const personal = screen.getByRole('radio', { name: t(lang, 'freedomCertaintyPersonal') });
    fireEvent.click(personal);
    expect(personal.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: t(lang, 'freedomCertaintyNone') }).getAttribute('aria-checked')).toBe('false');
  });

  it('says out loud that the answer is never stored or sent', () => {
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} />);
    expect(screen.getByText(t(lang, 'freedomCertaintyPrivacy'))).toBeTruthy();
  });

  it('does not appear on a day that has no inventory', () => {
    render(<DeliveranceDayGuide day={plainDay} lang={lang} />);
    expect(screen.queryByRole('radiogroup', { name: t(lang, 'freedomCertaintyQuestion') })).toBeNull();
  });
});

describe('what the certainty actually changes', () => {
  it('gives personal participation a repentance step', () => {
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} />);
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'freedomCertaintyPersonal') }));
    openGuided();
    const dialog = screen.getByRole('dialog');
    // Walk to the end collecting the step headings.
    const headings = [];
    for (let i = 0; i < 12; i += 1) {
      headings.push(within(dialog).getByRole('heading', { level: 2 }).textContent);
      const next = within(dialog).queryByText(t(lang, 'freedomNextStep'));
      if (!next) break;
      fireEvent.click(next);
    }
    expect(headings).toContain(t(lang, 'freedomStepRepent'));
    expect(headings).toContain(t(lang, 'freedomStepRenounce'));
  });

  it('gives a reported family story neither repentance nor a personal renunciation', () => {
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} />);
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'freedomCertaintyReportedFamily') }));
    openGuided();
    const dialog = screen.getByRole('dialog');
    const headings = [];
    for (let i = 0; i < 12; i += 1) {
      headings.push(within(dialog).getByRole('heading', { level: 2 }).textContent);
      const next = within(dialog).queryByText(t(lang, 'freedomNextStep'));
      if (!next) break;
      fireEvent.click(next);
    }
    expect(headings).toContain(t(lang, 'freedomStepBringReported'));
    expect(headings).not.toContain(t(lang, 'freedomStepRepent'));
    expect(headings).not.toContain(t(lang, 'freedomStepRenounce'));
  });
});

describe('the guided walk', () => {
  it('opens on step 1, labels the prayer as ours rather than as Scripture, and can be paused', () => {
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} />);
    openGuided();
    const dialog = screen.getByRole('dialog');
    // The progress line opens at step 1 and is announced politely, so a screen
    // reader hears the move without the whole panel being re-read.
    const progress = dialog.querySelector('[aria-live="polite"]');
    expect(progress).toBeTruthy();
    expect(progress.textContent).toContain('1');
    // The prayer is labelled as ours, never as Scripture.
    expect(within(dialog).getByText(t(lang, 'freedomGuidedPrayerLabel'))).toBeTruthy();
    // Pausing simply closes: nothing is recorded and nothing is marked incomplete.
    fireEvent.click(within(dialog).getByLabelText(t(lang, 'freedomPausePrayer')));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('lets the reader move backwards to reread a step', () => {
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} />);
    openGuided();
    const dialog = screen.getByRole('dialog');
    const first = within(dialog).getByRole('heading', { level: 2 }).textContent;
    fireEvent.click(within(dialog).getByText(t(lang, 'freedomNextStep')));
    expect(within(dialog).getByRole('heading', { level: 2 }).textContent).not.toBe(first);
    fireEvent.click(within(dialog).getByText(t(lang, 'backBtn')));
    expect(within(dialog).getByRole('heading', { level: 2 }).textContent).toBe(first);
  });

  it('starts by inviting the Holy Spirit and ends with an Amen rather than a Next', () => {
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} />);
    openGuided();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { level: 2 }).textContent).toBe(t(lang, 'freedomStepInviteSpirit'));
    for (let i = 0; i < 12; i += 1) {
      const next = within(dialog).queryByText(t(lang, 'freedomNextStep'));
      if (!next) break;
      fireEvent.click(next);
    }
    expect(within(dialog).getByText(t(lang, 'freedomAmenFinish'))).toBeTruthy();
    fireEvent.click(within(dialog).getByText(t(lang, 'freedomAmenFinish')));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('the prayer-mode choice', () => {
  it('marks "guide me" as the recommended path', () => {
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} />);
    expect(screen.getByText(t(lang, 'freedomModeRecommended'))).toBeTruthy();
  });

  it('keeps the prayer points behind their own mode', () => {
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} prompts={['Premier sujet', 'Deuxième sujet']} />);
    expect(screen.queryByText('Premier sujet')).toBeNull();
    fireEvent.click(screen.getByText(t(lang, 'freedomModePoints')));
    expect(screen.getByText('Premier sujet')).toBeTruthy();
    expect(screen.getByText('Deuxième sujet')).toBeTruthy();
  });

  it('says nothing more than it has to in the free path', () => {
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} prompts={['Premier sujet']} />);
    fireEvent.click(screen.getByText(t(lang, 'freedomModeFree')));
    expect(screen.getByText(t(lang, 'freedomModeFreeHint'))).toBeTruthy();
    expect(screen.queryByText('Premier sujet')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('privacy', () => {
  it('writes nothing to storage, whatever the reader selects', () => {
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} />);
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'freedomCertaintyPersonal') }));
    fireEvent.click(screen.getByText(t(lang, 'freedomRemembranceNothing')));
    openGuided();
    expect(localStorage.length).toBe(0);
  });

  it('reports nothing to analytics — not the day, not the mode, not the category', () => {
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} />);
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'freedomCertaintyKnownFamily') }));
    fireEvent.click(screen.getByText(t(lang, 'freedomRemembranceUnsure')));
    openGuided();
    expect(trackMock).not.toHaveBeenCalled();
  });

  it('forgets the selection when the day is left', () => {
    const { unmount } = render(<DeliveranceDayGuide day={inventoryDay} lang={lang} />);
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'freedomCertaintyPersonal') }));
    unmount();
    render(<DeliveranceDayGuide day={inventoryDay} lang={lang} />);
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.getAttribute('aria-checked')).toBe('false');
    }
  });
});

describe('the day body hosts it rather than replacing the plan', () => {
  it('renders the deliverance guide inside the ordinary plan day', () => {
    render(<PlanDayBody day={inventoryDay} lang={lang} idPrefix="test-day" />);
    expect(screen.getByText(t(lang, 'freedomModeQuestion'))).toBeTruthy();
    // The day's own reflection still comes first, above the guidance.
    expect(screen.getByText(inventoryDay.reflection.fr)).toBeTruthy();
  });

  it('leaves a non-deliverance day exactly as it was', () => {
    const ordinary = {
      ref: 'Colossians 1:9-12',
      reflection: { fr: 'Réflexion', en: 'Reflection' },
      prompts: [{ fr: 'Un sujet', en: 'A prompt' }],
    };
    render(<PlanDayBody day={ordinary} lang={lang} idPrefix="test-ordinary" />);
    expect(screen.getByText('Un sujet')).toBeTruthy(); // shown directly, no mode gate
    expect(screen.queryByText(t(lang, 'freedomModeQuestion'))).toBeNull();
  });
});
