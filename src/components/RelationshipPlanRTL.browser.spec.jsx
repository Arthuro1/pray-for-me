import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import PlanOnboardingModal from './PlanOnboardingModal';
import { t } from '../i18n';

afterEach(cleanup);

describe('relationship plan onboarding in a real RTL browser', () => {
  it('inherits RTL direction and keeps optional child controls accessible', () => {
    const onStart = vi.fn();
    render(
      <main dir="rtl">
        <PlanOnboardingModal
          plan={{ id: 'marriage30', lifeStage: 'married' }}
          lang="ar"
          onStart={onStart}
          onClose={() => {}}
        />
      </main>,
    );

    const dialog = screen.getByRole('dialog');
    expect(getComputedStyle(dialog).direction).toBe('rtl');

    fireEvent.click(screen.getByRole('checkbox', { name: t('ar', 'planCoupleIncludeChildren') }));
    fireEvent.click(screen.getByRole('button', { name: t('ar', 'planCoupleAddChild') }));
    const childInput = screen.getByLabelText(t('ar', 'planCoupleChildName'));
    fireEvent.change(childInput, { target: { value: 'مريم' } });
    expect(screen.getByRole('button', { name: t('ar', 'planCoupleRemoveChild', { name: 'مريم' }) })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: t('ar', 'planPrepOnboardingCta') }));
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({
      children: [expect.objectContaining({ name: 'مريم' })],
    }));
  });
});
