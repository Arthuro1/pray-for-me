// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PlanDayBody from '../PlanDayBody';
import { DISCERNING_BEFORE_COMMITMENT as plan } from '../../content/plans/discerningBeforeCommitment';
import { loadPlanTranslations, mergePlan } from '../../content/plans/translations';
import { LANG_CODES, loadLocale, t } from '../../i18n';

vi.mock('../shared/VersePill', () => ({ default: ({ reference }) => <span>{reference}</span> }));
afterEach(cleanup);

describe('the complete discernment prayer day', () => {
  it('displays meditation, full prayer, listening and three questions with the existing note action', () => {
    const onAddNote = vi.fn();
    render(<PlanDayBody day={plan.days[0]} lang="fr" onAddNote={onAddNote} />);
    for (const key of ['planDiscernmentReading', 'planDiscernmentReflection', 'planDiscernmentPrayer', 'planDiscernmentListening', 'planDiscernmentJournal']) {
      expect(screen.getByRole('heading', { name: t('fr', key) })).toBeTruthy();
    }
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText(/Que mon désir de mariage reste soumis à toi/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: t('fr', 'studyAddNote') }));
    expect(onAddNote).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('heading', { name: t('fr', 'planPrayerPrompts') })).toBeNull();
  });

  it('keeps the second main reading visible and the final assessment available in a disclosure', () => {
    const { rerender, container } = render(<PlanDayBody day={plan.days[21]} lang="fr" />);
    expect(screen.getByText('1 John 4:1-3')).toBeTruthy();
    rerender(<PlanDayBody day={plan.days[27]} lang="fr" />);
    const summary = screen.getByText(t('fr', 'planDiscernmentReview'));
    expect(summary.tagName).toBe('SUMMARY');
    expect(summary.parentElement.textContent).toContain('Renoncer à la relation');
    expect(container.querySelector('input, textarea')).toBeNull();
  });

  it.each(LANG_CODES)('renders the actual %s prose without falling back to French or English', async (lang) => {
    await loadLocale(lang);
    const localized = ['fr', 'en'].includes(lang) ? plan : mergePlan(plan, await loadPlanTranslations(lang, plan.id), lang);
    const day = localized.days[18];
    const { container } = render(<main dir={['ar', 'fa'].includes(lang) ? 'rtl' : 'ltr'}><PlanDayBody day={day} lang={lang} /></main>);
    expect(container.textContent).toContain(day.discernment.prayer[lang]);
    for (const question of day.discernment.questions) expect(container.textContent).toContain(question[lang]);
    if (lang !== 'fr') expect(container.textContent).not.toContain(plan.days[18].discernment.prayer.fr);
    if (!['en', 'fr'].includes(lang)) expect(container.textContent).not.toContain(plan.days[18].discernment.prayer.en);
    expect(container.querySelectorAll('[dir="auto"]').length).toBeGreaterThan(5);
  });
});
