// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PlanPersonalizeModal from '../PlanPersonalizeModal';
import { MAX_PLAN_CHILDREN } from '../../lib/planPersonalization';
import { t } from '../../i18n';

const lang = 'fr';
const engaged = { id: 'covenant21', lifeStage: 'engaged' };
const married = { id: 'marriage30', lifeStage: 'married' };
afterEach(() => { cleanup(); localStorage.clear(); });

describe('couple plan personalization', () => {
  it('lets an engaged user link an existing person, but never requires a name', () => {
    const onSave = vi.fn();
    render(<PlanPersonalizeModal plan={engaged} lang={lang} people={[{ id: 'p1', prayerId: 'prayer-1', name: 'Anna' }]} onSave={onSave} onClose={vi.fn()} />);
    expect(screen.getByText(t(lang, 'planCoupleFianceQ'))).toBeTruthy();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Anna' } });
    expect(screen.getByLabelText(t(lang, 'planCoupleDisplayName')).value).toBe('Anna');
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'save') }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      partner: expect.objectContaining({ name: 'Anna', prayerId: 'prayer-1' }), mode: 'private',
    }));
  });

  it('saves the engaged plan without personal information', () => {
    const onSave = vi.fn();
    render(<PlanPersonalizeModal plan={engaged} lang={lang} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'save') }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ partner: null, children: [] }));
  });

  it('only collects children after the optional children layer is selected', () => {
    const onSave = vi.fn();
    render(<PlanPersonalizeModal plan={married} lang={lang} onSave={onSave} onClose={vi.fn()} />);
    expect(screen.queryByLabelText(t(lang, 'planCoupleChildName'))).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(t(lang, 'planCoupleIncludeQ')) }));
    fireEvent.click(screen.getByRole('checkbox', { name: t(lang, 'planCoupleIncludeChildren') }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'planCoupleAddChild') }));
    fireEvent.change(screen.getByLabelText(t(lang, 'planCoupleChildName')), { target: { value: 'Emma' } });
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'planCoupleModeTogether') }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'save') }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'together', children: [expect.objectContaining({ name: 'Emma' })],
    }));
  });

  it('states that adding a name does not invite anyone or share private notes', () => {
    render(<PlanPersonalizeModal plan={married} lang={lang} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(t(lang, 'planCouplePrivacy'))).toBeTruthy();
  });

  // Reopened on a RUNNING plan so a mistyped name can be corrected or a child
  // added, instead of deleting the prayer and losing its history.
  it('reopens on an existing run with the answers already given', () => {
    const onSave = vi.fn();
    render(<PlanPersonalizeModal
      plan={married}
      lang={lang}
      initial={{ partner: { name: 'Ana' }, mode: 'together', role: 'wife', includes: ['children'], children: [{ id: 'c1', name: 'Emma' }] }}
      onSave={onSave}
      onClose={vi.fn()}
    />);
    expect(screen.getByLabelText(t(lang, 'planCoupleDisplayName')).value).toBe('Ana');
    expect(screen.getByLabelText(t(lang, 'planCoupleChildName')).value).toBe('Emma');
    expect(screen.getByRole('radio', { name: t(lang, 'planCoupleModeTogether') }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: t(lang, 'planCoupleRoleWife') }).getAttribute('aria-checked')).toBe('true');

    fireEvent.change(screen.getByLabelText(t(lang, 'planCoupleDisplayName')), { target: { value: 'Anaïs' } });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'save') }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      partner: expect.objectContaining({ name: 'Anaïs' }),
      mode: 'together',
      role: 'wife',
      children: [expect.objectContaining({ name: 'Emma' })],
    }));
  });

  it('stops offering "add a child" at the cap instead of dropping the extras', () => {
    const children = Array.from({ length: MAX_PLAN_CHILDREN }, (_, i) => ({ id: `c${i}`, name: `Child ${i}` }));
    render(<PlanPersonalizeModal
      plan={married}
      lang={lang}
      initial={{ includes: ['children'], children }}
      onSave={vi.fn()}
      onClose={vi.fn()}
    />);
    expect(screen.getAllByLabelText(t(lang, 'planCoupleChildName'))).toHaveLength(MAX_PLAN_CHILDREN);
    expect(screen.queryByRole('button', { name: t(lang, 'planCoupleAddChild') })).toBeNull();
  });
});
