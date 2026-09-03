import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PlanDayBody from './PlanDayBody';
import PlanDetailModal from './PlanDetailModal';
import { DISCERNING_BEFORE_COMMITMENT as plan } from '../content/plans/discerningBeforeCommitment';
import { loadPlanTranslations, mergePlan } from '../content/plans/translations';
import { loadLocale, t } from '../i18n';
import { setPlanPreview } from '../lib/planReview';
import { startGuidedPlan } from '../lib/startGuidedPlan';
import '../index.css';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  setPlanPreview(false);
});

describe('discernment on narrow RTL screens', () => {
  it.each(['ar', 'fa'])('keeps %s paragraphs and the final assessment readable', async (lang) => {
    await loadLocale(lang);
    const localized = mergePlan(plan, await loadPlanTranslations(lang, plan.id), lang);
    const { container } = render(
      <main dir="rtl" style={{ width: 360, padding: 16 }}>
        <PlanDayBody day={localized.days[27]} lang={lang} />
      </main>,
    );
    const guide = screen.getByTestId('discernment-day');
    expect(getComputedStyle(guide).direction).toBe('rtl');
    expect(guide.scrollWidth).toBeLessThanOrEqual(guide.clientWidth + 1);
    const summary = screen.getByText(t(lang, 'planDiscernmentReview'));
    const disclosure = summary.closest('details');
    expect(disclosure.open).toBe(false);
    fireEvent.click(summary);
    expect(disclosure.open).toBe(true);
    expect(disclosure.textContent).toContain(localized.days[27].discernment.review[lang]);
    expect(container.querySelectorAll('ol li')).toHaveLength(3);
  });
});

it('starts the approved curriculum without preview as one 28-day prayer, without collecting relationship answers', async () => {
  vi.stubEnv('DEV', false);
  setPlanPreview(false);
  const addPrayer = vi.fn(async () => 'discernment-browser-prayer');
  const onClose = vi.fn();
  render(<PlanDetailModal plan={plan} lang="fr" onClose={onClose}
    onStart={(selected, startDate) => startGuidedPlan({ plan: selected, startDate, lang: 'fr', addPrayer })} />);
  expect(screen.getByRole('dialog').textContent).not.toContain(t('fr', 'planCoupleReviewHint'));
  expect(screen.getByRole('dialog').textContent).not.toContain(t('fr', 'planCoupleReviewPending'));
  expect(screen.queryByRole('textbox')).toBeNull();
  const startButton = screen.getByRole('button', { name: t('fr', 'journeyStartToday') });
  expect(startButton.disabled).toBe(false);
  fireEvent.click(startButton);
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  expect(addPrayer).toHaveBeenCalledOnce();
  const [prayer] = addPrayer.mock.calls[0];
  expect(prayer.title).toBe(t('fr', plan.titleKey));
  expect(prayer.schedule).toMatchObject({
    type: 'recurring', freq: 'daily', end: { kind: 'count', count: 28 },
    plan: { id: 'discernment28', version: 1 },
  });
  expect(Object.keys(prayer).sort()).toEqual(['categoryIds', 'description', 'schedule', 'title']);
});
