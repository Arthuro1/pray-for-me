// @vitest-environment jsdom
//
// The short onboarding a rich plan asks for. What is being defended: it is four
// questions and no more, the husband/wife question is ASKED rather than guessed,
// it defaults to keeping the plan general, and nothing is required to begin.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

import PlanOnboardingModal from '../PlanOnboardingModal';
import { PREPARING_IN_PRAYER } from '../../content/plans/preparingInPrayer';
import { DEFAULT_EMPHASIS, GROWTH_AREAS } from '../../lib/planPrefs';
import { t } from '../../i18n';

const lang = 'fr'; // the always-loaded fallback locale
afterEach(() => { cleanup(); localStorage.clear(); });

const open = (onStart = vi.fn()) => {
  render(<PlanOnboardingModal plan={PREPARING_IN_PRAYER} lang={lang} onStart={onStart} onClose={vi.fn()} />);
  return onStart;
};

describe('the questions', () => {
  it('asks about the season, the emphasis, the role and growth areas — and no more', () => {
    open();
    expect(screen.getByText(t(lang, 'planPrepSeasonQ'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'planPrepEmphasisQ'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'planPrepRoleQ'))).toBeTruthy();
    expect(screen.getByText(new RegExp(t(lang, 'planPrepGrowthQ')))).toBeTruthy();
    // Single-choice questions are radio groups; the multi-choice one is not.
    expect(screen.getAllByRole('radiogroup')).toHaveLength(2);
  });

  it('never asks for a person, a name or anything free-text', () => {
    const { container } = render(
      <PlanOnboardingModal plan={PREPARING_IN_PRAYER} lang={lang} onStart={vi.fn()} onClose={vi.fn()} />,
    );
    expect(container.querySelectorAll('input, textarea')).toHaveLength(0);
  });

  it('says where the answers are kept', () => {
    open();
    expect(screen.getByText(t(lang, 'planPrepOnboardingPrivacy'))).toBeTruthy();
  });
});

describe('defaults', () => {
  it('pre-selects the three recommended emphases and nothing else', () => {
    const onStart = open();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'planPrepOnboardingCta') }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ emphasis: DEFAULT_EMPHASIS }));
  });

  it('defaults the husband/wife question to keeping the plan general', () => {
    const onStart = open();
    const general = screen.getByRole('radio', { name: t(lang, 'planPrepRoleGeneral') });
    expect(general.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'planPrepOnboardingCta') }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ role: 'general' }));
  });

  it('starts with no season chosen and starts anyway — nothing is required', () => {
    const onStart = open();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'planPrepOnboardingCta') }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ season: null, growth: [] }));
  });
});

describe('choosing', () => {
  it('records a season, and lets it be unset again', () => {
    const onStart = open();
    const hope = screen.getByRole('radio', { name: t(lang, 'planPrepSeasonHope') });
    fireEvent.click(hope);
    expect(hope.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(hope);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'planPrepOnboardingCta') }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ season: null }));
  });

  it('toggles emphases on and off', () => {
    const onStart = open();
    fireEvent.click(screen.getByRole('checkbox', { name: t(lang, 'planPrepEmphasisCloseness') }));
    fireEvent.click(screen.getByRole('checkbox', { name: t(lang, 'planPrepEmphasisHealing') }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'planPrepOnboardingCta') }));
    const { emphasis } = onStart.mock.calls[0][0];
    expect(emphasis).not.toContain('closeness');
    expect(emphasis).toContain('healing');
  });

  it('asks for the role out loud, and passes on the explicit answer', () => {
    const onStart = open();
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'planPrepRoleWife') }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'planPrepOnboardingCta') }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ role: 'wife' }));
  });

  it('keeps the long growth-area list folded away until it is asked for', () => {
    const onStart = open();
    const disclosure = screen.getByRole('button', { name: new RegExp(t(lang, 'planPrepGrowthQ')) });
    expect(disclosure.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('checkbox', { name: t(lang, GROWTH_AREAS[0].labelKey) })).toBeNull();

    fireEvent.click(disclosure);
    expect(disclosure.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('checkbox', { name: t(lang, GROWTH_AREAS[0].labelKey) }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'planPrepOnboardingCta') }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ growth: [GROWTH_AREAS[0].id] }));
  });
});
