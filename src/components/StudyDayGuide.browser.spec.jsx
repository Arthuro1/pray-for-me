import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { page, userEvent } from 'vitest/browser';

vi.mock('../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));

import PlanDayBody from './PlanDayBody';
import PlanDetailModal from './PlanDetailModal';
import { DAVID_HEART as plan } from '../content/plans/davidHeart';
import { loadLocale, t } from '../i18n';
import '../index.css';

// Actual styles, native disclosures and keyboard input in Chromium. All study
// content is local; Scripture fetching is mocked, with no account or API calls.
beforeAll(async () => { await loadLocale('ar'); });
afterEach(cleanup);

describe('the David study in a real browser', () => {
  it('opens the French context by keyboard and keeps prayer optional on mobile', async () => {
    await page.viewport(390, 844);
    const onAddNote = vi.fn();
    const day = plan.days[0];
    render(
      <main className="mx-auto max-w-xl p-4" lang="fr">
        <h1 className="editorial-heading mb-4 text-2xl">{day.theme.fr}</h1>
        <PlanDayBody day={day} lang="fr" onAddNote={onAddNote} />
      </main>,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    const context = screen.getByText(t('fr', 'studyContext'));
    const prayer = screen.getByText(t('fr', 'studyPrayer'));
    expect(context.closest('details').open).toBe(false);
    expect(prayer.closest('details').open).toBe(false);
    context.focus();
    await userEvent.keyboard('{Enter}');
    expect(context.closest('details').open).toBe(true);
    expect(screen.getByText(day.study.context.fr).getBoundingClientRect().height).toBeGreaterThan(0);
    expect(prayer.closest('details').open).toBe(false);
    await page.getByRole('button', { name: t('fr', 'studyAddNote') }).click();
    expect(onAddNote).toHaveBeenCalledOnce();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
  });

  it('previews all twelve studies and starts from the existing desktop modal', async () => {
    await page.viewport(1280, 900);
    const onStart = vi.fn();
    render(<PlanDetailModal plan={plan} lang="fr" onStart={onStart} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog', { name: t('fr', plan.titleKey) });
    expect(screen.getByText(t('fr', 'studyPace'))).toBeTruthy();
    await page.getByRole('button', { name: t('fr', 'previewAllDays') }).click();
    plan.days.forEach((day) => expect(screen.getByText(day.theme.fr)).toBeTruthy());
    expect(dialog.getBoundingClientRect().width).toBeLessThanOrEqual(1280);
    await page.getByRole('button', { name: t('fr', 'journeyStartToday') }).click();
    expect(onStart.mock.calls[0][0]).toBe(plan);
  });

  it('keeps Arabic labels and long fallback prose usable in a narrow RTL layout', async () => {
    await page.viewport(360, 800);
    const day = plan.days[7];
    render(<main dir="rtl" className="mx-auto max-w-xl p-4"><PlanDayBody day={day} lang="ar" /></main>);
    const questions = screen.getByRole('list');
    expect(getComputedStyle(screen.getByRole('main')).direction).toBe('rtl');
    // Untranslated prose falls back to English, so its punctuation/list markers
    // must read left-to-right even while the interface labels remain Arabic.
    expect(getComputedStyle(questions).direction).toBe('ltr');
    const context = screen.getByText(t('ar', 'studyContext'));
    await page.getByText(t('ar', 'studyContext')).click();
    expect(context.closest('details').open).toBe(true);
    expect(getComputedStyle(context).direction).toBe('rtl');
    expect(getComputedStyle(screen.getByText(day.study.context.en)).direction).toBe('ltr');
    expect(screen.getByText(day.study.context.en)).toBeTruthy();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
  });
});
