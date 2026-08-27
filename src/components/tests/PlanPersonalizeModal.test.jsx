// @vitest-environment jsdom
//
// The sheet that tailors a plan a reader is ALREADY praying. What is being
// defended: every question left changes something the reader can see, the
// husband/wife question is ASKED rather than guessed, it defaults to keeping the
// plan general, and nothing is required.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

import PlanPersonalizeModal from '../PlanPersonalizeModal';
import { PREPARING_IN_PRAYER } from '../../content/plans/preparingInPrayer';
import { GROWTH_AREAS, savePlanPrefs } from '../../lib/planPrefs';
import { t } from '../../i18n';

const lang = 'fr'; // the always-loaded fallback locale
afterEach(() => { cleanup(); localStorage.clear(); });

const open = (onSave = vi.fn()) => {
  render(<PlanPersonalizeModal plan={PREPARING_IN_PRAYER} lang={lang} onSave={onSave} onClose={vi.fn()} />);
  return onSave;
};

const submit = () => fireEvent.click(screen.getByRole('button', { name: t(lang, 'save') }));

describe('the questions', () => {
  // The season and the emphasis used to be asked here too. A season was stored
  // and read by nothing at all; an emphasis only pre-ticked the completion card
  // three weeks later, which is where it is asked now. Neither comes back.
  it('asks about the role and growth areas — and no more', () => {
    open();
    expect(screen.getByText(t(lang, 'planPrepRoleQ'))).toBeTruthy();
    expect(screen.getByText(new RegExp(t(lang, 'planPrepGrowthQ')))).toBeTruthy();
    // The role is the only single-choice question left.
    expect(screen.getAllByRole('radiogroup')).toHaveLength(1);
  });

  it('never asks for a person, a name or anything free-text', () => {
    const { container } = render(
      <PlanPersonalizeModal plan={PREPARING_IN_PRAYER} lang={lang} onSave={vi.fn()} onClose={vi.fn()} />,
    );
    expect(container.querySelectorAll('input, textarea')).toHaveLength(0);
  });

  it('says where the answers are kept', () => {
    open();
    expect(screen.getByText(t(lang, 'planPrepOnboardingPrivacy'))).toBeTruthy();
  });
});

describe('defaults', () => {
  it('defaults the husband/wife question to keeping the plan general', () => {
    const onSave = open();
    const general = screen.getByRole('radio', { name: t(lang, 'planPrepRoleGeneral') });
    expect(general.getAttribute('aria-checked')).toBe('true');
    submit();
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ role: 'general' }));
  });

  it('saves with nothing chosen — no answer is required', () => {
    const onSave = open();
    submit();
    expect(onSave).toHaveBeenCalledWith({ role: 'general', growth: [] });
  });
});

describe('choosing', () => {
  it('asks for the role out loud, and passes on the explicit answer', () => {
    const onSave = open();
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'planPrepRoleWife') }));
    submit();
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ role: 'wife' }));
  });

  it('keeps the long growth-area list folded away until it is asked for', () => {
    const onSave = open();
    const disclosure = screen.getByRole('button', { name: new RegExp(t(lang, 'planPrepGrowthQ')) });
    expect(disclosure.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('checkbox', { name: t(lang, GROWTH_AREAS[0].labelKey) })).toBeNull();

    fireEvent.click(disclosure);
    expect(disclosure.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('checkbox', { name: t(lang, GROWTH_AREAS[0].labelKey) }));
    submit();
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ growth: [GROWTH_AREAS[0].id] }));
  });
});

// The sheet can be reopened for the life of a run, so it has to come back
// holding the answers already given: a reader with nothing to change closes it,
// and one who wants a different reflection can say so.
describe('reopening', () => {
  it('reopens holding the answers already on the device', () => {
    savePlanPrefs(PREPARING_IN_PRAYER.id, { role: 'husband', growth: [GROWTH_AREAS[1].id] });
    const onSave = open();

    expect(screen.getByRole('radio', { name: t(lang, 'planPrepRoleHusband') }).getAttribute('aria-checked')).toBe('true');
    // Growth areas were answered, so the disclosure opens already unfolded.
    expect(screen.getByRole('checkbox', { name: t(lang, GROWTH_AREAS[1].labelKey) }).getAttribute('aria-checked')).toBe('true');

    submit();
    expect(onSave).toHaveBeenCalledWith({ role: 'husband', growth: [GROWTH_AREAS[1].id] });
  });

  it('lets an answer be changed later in the run', () => {
    savePlanPrefs(PREPARING_IN_PRAYER.id, { role: 'husband' });
    const onSave = open();
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'planPrepRoleGeneral') }));
    submit();
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ role: 'general' }));
  });
});
