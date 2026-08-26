// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PlanOnboardingModal from '../PlanOnboardingModal';
import { t } from '../../i18n';

const lang = 'fr';
const engaged = { id: 'covenant21', lifeStage: 'engaged' };
const married = { id: 'marriage30', lifeStage: 'married' };
afterEach(() => { cleanup(); localStorage.clear(); });

describe('couple plan onboarding', () => {
  it('lets an engaged user link an existing person, but never requires a name', () => {
    const onStart = vi.fn();
    render(<PlanOnboardingModal plan={engaged} lang={lang} people={[{ id: 'p1', prayerId: 'prayer-1', name: 'Anna' }]} onStart={onStart} onClose={vi.fn()} />);
    expect(screen.getByText(t(lang, 'planCoupleFianceQ'))).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'prayer-1' } });
    expect(screen.getByLabelText(t(lang, 'planCoupleDisplayName')).value).toBe('Anna');
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'planPrepOnboardingCta') }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({
      partner: expect.objectContaining({ name: 'Anna', prayerId: 'prayer-1' }), mode: 'private',
    }));
  });

  it('starts the engaged plan without personal information', () => {
    const onStart = vi.fn();
    render(<PlanOnboardingModal plan={engaged} lang={lang} onStart={onStart} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'planPrepOnboardingCta') }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ partner: null, children: [] }));
  });

  it('only collects children after the optional children layer is selected', () => {
    const onStart = vi.fn();
    render(<PlanOnboardingModal plan={married} lang={lang} onStart={onStart} onClose={vi.fn()} />);
    expect(screen.queryByLabelText(t(lang, 'planCoupleChildName'))).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: t(lang, 'planCoupleIncludeChildren') }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'planCoupleAddChild') }));
    fireEvent.change(screen.getByLabelText(t(lang, 'planCoupleChildName')), { target: { value: 'Emma' } });
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'planCoupleModeTogether') }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'planPrepOnboardingCta') }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'together', children: [expect.objectContaining({ name: 'Emma' })],
    }));
  });

  it('states that adding a name does not invite anyone or share private notes', () => {
    render(<PlanOnboardingModal plan={married} lang={lang} onStart={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(t(lang, 'planCouplePrivacy'))).toBeTruthy();
  });
});
