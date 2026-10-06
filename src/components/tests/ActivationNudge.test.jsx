// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ActivationNudge from '../ActivationNudge';
import {
  ACTIVATION_STEPS,
  markActivationSessionCompleted,
  markActivationStepHandled,
  readActivationProgress,
} from '../../lib/activationProgress';
import { PLANS, STARTER_PLAN_ID } from '../../content/prayerPlans';
import { t } from '../../i18n';

const lang = 'fr';
const prayer = (id) => ({
  id,
  title: `private-${id}`,
  status: 'active',
  prayer_categories: [],
});

// Each test is its own VISIT: education is capped at one prompt per visit, so a
// card answered in the previous test must not silence the next one.
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('ActivationNudge — the prayer plan invitation', () => {
  const starter = PLANS.find((plan) => plan.id === STARTER_PLAN_ID);
  const renderInvite = (props = {}) => {
    markActivationSessionCompleted();
    return render(<ActivationNudge prayers={[prayer('p1')]} settings={{}} lang={lang} {...props} />);
  };

  it('names one real plan to someone who has prayed, one tap from its details', () => {
    const onOpenPlans = vi.fn();
    renderInvite({ onOpenPlans });
    expect(screen.getByText(t(lang, 'planStarterTitle'))).toBeTruthy();
    expect(screen.getByText(t(lang, starter.titleKey))).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'planStarterView')));
    expect(onOpenPlans).toHaveBeenCalledWith(STARTER_PLAN_ID);
    // Answered for good: it retires, and nothing replaces it in this visit.
    expect(screen.queryByText(t(lang, 'planStarterTitle'))).toBeNull();
    expect(readActivationProgress().handled).toContain(ACTIVATION_STEPS.PLANS);
  });

  it('also offers the whole catalogue, which answers the invitation too', () => {
    const onOpenPlans = vi.fn();
    renderInvite({ onOpenPlans });
    fireEvent.click(screen.getByText(t(lang, 'planStarterAll')));
    expect(onOpenPlans).toHaveBeenCalledWith();
    expect(readActivationProgress().handled).toContain(ACTIVATION_STEPS.PLANS);
  });

  it('can be dismissed for good', () => {
    renderInvite({ onOpenPlans: vi.fn() });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'onboardLater') }));
    expect(screen.queryByText(t(lang, 'planStarterTitle'))).toBeNull();
    expect(readActivationProgress().handled).toContain(ACTIVATION_STEPS.PLANS);
  });

  it('offers no plan where there is no way to open one', () => {
    const { container } = renderInvite();
    expect(container.firstChild).toBeNull();
  });
});

describe('ActivationNudge', () => {
  it('says nothing at all to someone with their first prayer', () => {
    const { container } = render(
      <ActivationNudge prayers={[prayer('p1')]} settings={{}} lang={lang} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows the first contextual step and opens Organize without persisting prayer identity', () => {
    const onEditPrayer = vi.fn();
    // Two prayers: the point at which a rhythm has something to solve.
    const prayers = [prayer('p1'), prayer('p2')];
    render(
      <ActivationNudge
        prayers={prayers}
        settings={{}}
        lang={lang}
        onEditPrayer={onEditPrayer}
      />
    );

    expect(screen.getByText(t(lang, 'activationRhythmTitle'))).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'activationRhythmCta')));
    expect(onEditPrayer).toHaveBeenCalledWith(prayers[0], { openOrganize: true });
    expect(screen.queryByText(t(lang, 'activationRhythmTitle'))).toBeNull();
    expect(localStorage.getItem('pfm_activation_progress_v1')).not.toContain('p1');
  });

  it('offers reminders only after a completion and never stacks another card', () => {
    markActivationStepHandled(ACTIVATION_STEPS.RHYTHM);
    markActivationSessionCompleted();
    const onOpenReminders = vi.fn();
    render(
      <ActivationNudge
        prayers={[prayer('p1'), prayer('p2'), prayer('p3')]}
        settings={{ dailyReminderEnabled: false }}
        lang={lang}
        onOpenReminders={onOpenReminders}
      />
    );

    expect(screen.getByText(t(lang, 'activationReminderTitle'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'activationOrganizeTitle'))).toBeNull();
    fireEvent.click(screen.getByText(t(lang, 'setReminderCta')));
    expect(onOpenReminders).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(t(lang, 'activationOrganizeTitle'))).toBeNull();
  });

  it('introduces organization only once the journal has several unorganized prayers', () => {
    markActivationStepHandled(ACTIVATION_STEPS.RHYTHM);
    render(
      <ActivationNudge
        prayers={[prayer('p1'), prayer('p2'), prayer('p3')]}
        settings={{}}
        lang={lang}
      />
    );
    expect(screen.getByText(t(lang, 'activationOrganizeTitle'))).toBeTruthy();
  });
});
