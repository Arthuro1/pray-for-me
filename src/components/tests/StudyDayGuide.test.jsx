// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
vi.mock('../../lib/verseText', () => ({ fetchScriptureText: vi.fn(async () => null), fetchVerseText: vi.fn(async () => ({ data: null, error: null })) }));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../../lib/analytics', () => ({ track: vi.fn(), EVENTS: { RESOURCE_OPENED: 'resource_opened' } }));

import PlanDayBody from '../PlanDayBody';
import PlanDetailModal from '../PlanDetailModal';
import PlanCompletionCard from '../PlanCompletionCard';
import { DAVID_HEART as plan } from '../../content/plans/davidHeart';
import { t } from '../../i18n';

afterEach(() => { cleanup(); localStorage.clear(); });

describe('a study-first day on the shared plan surfaces', () => {
  it('shows analysis, questions, counterpoint and synthesis, not prayer-first directions', () => {
    const day = plan.days[0];
    render(<PlanDayBody day={day} lang="fr" />);
    expect(screen.getByText(day.reflection.fr)).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    day.study.questions.forEach((q) => expect(screen.getByText(q.fr)).toBeTruthy());
    expect(screen.getByText(day.study.tension.fr)).toBeTruthy();
    expect(screen.getByText(day.study.synthesis.fr)).toBeTruthy();
    expect(screen.getByText(t('fr', 'studyRelated'))).toBeTruthy();
    expect(screen.queryByText(t('fr', 'planAfterPrayer'))).toBeNull();
    expect(screen.queryByText(t('fr', 'planPrayerPrompts'))).toBeNull();
  });

  it('makes context and the short optional prayer collapsed native disclosures', () => {
    render(<PlanDayBody day={plan.days[0]} lang="fr" />);
    for (const key of ['studyContext', 'studyPrayer']) {
      const summary = screen.getByText(t('fr', key));
      expect(summary.tagName).toBe('SUMMARY');
      expect(summary.closest('details').open).toBe(false);
    }
    expect(screen.getByText(plan.days[0].study.context.fr).closest('details')).toBeTruthy();
  });

  it('uses the host’s existing notes action without another store or form', () => {
    const onAddNote = vi.fn();
    render(<PlanDayBody day={plan.days[0]} lang="fr" onAddNote={onAddNote} />);
    fireEvent.click(screen.getByRole('button', { name: t('fr', 'studyAddNote') }));
    expect(onAddNote).toHaveBeenCalledOnce();
  });

  it('omits an unavailable notes action and an unapproved resource shelf', () => {
    render(<PlanDayBody day={plan.days[0]} lang="fr" />);
    expect(screen.queryByRole('button', { name: t('fr', 'studyAddNote') })).toBeNull();
    expect(screen.queryByText(t('fr', 'goDeeper'))).toBeNull();
  });

  it('reuses the existing external-link shelf when approved resources are supplied', () => {
    const resource = { id: 'fixture', type: 'article', lang: 'en', description: { fr: 'Une source et ses limites' }, edition: { title: 'Tel Dan Stele', author: 'The Jewish Museum', url: 'https://thejewishmuseum.org/exhibitions/tel-dan-stele/' } };
    render(<PlanDayBody day={plan.days[9]} lang="fr" resources={[resource]} idPrefix="study-day" />);
    const button = screen.getByRole('button', { name: t('fr', 'goDeeper') });
    expect(button.getAttribute('aria-controls')).toBe('study-day-go-deeper');
    fireEvent.click(button);
    const link = screen.getByRole('link', { name: /Tel Dan Stele/ });
    expect(link.getAttribute('rel')).toContain('noreferrer');
    expect(screen.getByText('Une source et ses limites')).toBeTruthy();
  });

  it('previews its twelve studies and starts through the ordinary plan action', () => {
    const onStart = vi.fn();
    render(<PlanDetailModal plan={plan} lang="fr" onStart={onStart} onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: t('fr', plan.titleKey) })).toBeTruthy();
    expect(screen.getByText(t('fr', 'studyPace'))).toBeTruthy();
    expect(screen.queryByText(t('fr', 'planCoupleReviewPending'))).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: t('fr', 'previewAllDays') }));
    plan.days.forEach((day) => expect(screen.getByText(day.theme.fr)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: t('fr', 'journeyStartToday') }));
    expect(onStart.mock.calls[0][0]).toBe(plan);
  });

  it('closes with the study synthesis rather than automatically creating prayers', () => {
    const onContinue = vi.fn();
    render(<PlanCompletionCard plan={plan} lang="fr" onContinue={onContinue} />);
    expect(screen.getByText(plan.completion.fr)).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('does not retain previous day questions when the host advances', () => {
    const { rerender } = render(<PlanDayBody day={plan.days[0]} lang="fr" />);
    rerender(<PlanDayBody day={plan.days[1]} lang="fr" />);
    expect(screen.queryByText(plan.days[0].study.questions[0].fr)).toBeNull();
    expect(screen.getByText(plan.days[1].study.questions[0].fr)).toBeTruthy();
  });
});
