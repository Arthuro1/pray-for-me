// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ActivationNudge from '../ActivationNudge';
import {
  ACTIVATION_STEPS,
  markActivationSessionCompleted,
  markActivationStepHandled,
} from '../../lib/activationProgress';
import { t } from '../../i18n';

const lang = 'fr';
const prayer = (id) => ({
  id,
  title: `private-${id}`,
  status: 'active',
  prayer_categories: [],
});

beforeEach(() => localStorage.clear());

describe('ActivationNudge', () => {
  it('shows the first contextual step and opens Organize without persisting prayer identity', () => {
    const onEditPrayer = vi.fn();
    const prayers = [prayer('p1')];
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
