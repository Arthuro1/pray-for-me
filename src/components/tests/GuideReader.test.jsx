// @vitest-environment jsdom
//
// GuideReader: authored duration on the intro; the optional "Why this step?"
// disclosure appears ONLY when authored, is keyboard/screen-reader operable
// (real button, aria-expanded/aria-controls), and never blocks Continue.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));

import GuideReader from '../GuideReader';
import { t } from '../../i18n';

const lang = 'fr';

const guide = {
  id: 'g-test',
  emoji: '🙌',
  minutes: 8,
  title: { en: 'Test guide', fr: 'Guide de test' },
  intro: { en: 'Intro.', fr: 'Intro.' },
  steps: [
    {
      title: { en: 'With why', fr: 'Avec pourquoi' },
      prompt: { en: 'Pray.', fr: 'Prie.' },
      why: { en: 'Because Scripture starts here.', fr: 'Parce que l\'Écriture commence ici.' },
    },
    {
      title: { en: 'Without why', fr: 'Sans pourquoi' },
      prompt: { en: 'Pray more.', fr: 'Prie encore.' },
    },
  ],
};

afterEach(cleanup);

const open = () => {
  render(<GuideReader guide={guide} lang={lang} onClose={() => {}} />);
  fireEvent.click(screen.getByText(t(lang, 'guideBegin'))); // intro → step 1
};

describe('GuideReader — duration', () => {
  it('shows the authored duration on the intro screen', () => {
    render(<GuideReader guide={guide} lang={lang} onClose={() => {}} />);
    expect(screen.getByText(t(lang, 'aboutMinutes', { n: 8 }))).toBeTruthy();
  });
});

describe('GuideReader — Why this step?', () => {
  it('renders collapsed with proper disclosure semantics, and expands on activation', () => {
    open();
    const btn = screen.getByRole('button', { name: t(lang, 'whyThisStep') });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.getAttribute('aria-controls')).toBe('guide-step-why');
    expect(screen.queryByText('Parce que l\'Écriture commence ici.')).toBeNull();
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('guide-step-why').textContent).toContain('Parce que');
  });

  it('never blocks Continue, and disappears on a step without authored content', () => {
    open();
    // Continue works with the disclosure untouched…
    fireEvent.click(screen.getByText(t(lang, 'continueBtn')));
    expect(screen.getByText('Sans pourquoi')).toBeTruthy();
    // …and the second step, with no authored why, has no disclosure at all.
    expect(screen.queryByRole('button', { name: t(lang, 'whyThisStep') })).toBeNull();
  });

  it('re-collapses when returning to an explained step', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'whyThisStep') }));
    fireEvent.click(screen.getByText(t(lang, 'continueBtn')));
    fireEvent.click(screen.getByText(t(lang, 'backBtn')));
    expect(screen.getByRole('button', { name: t(lang, 'whyThisStep') }).getAttribute('aria-expanded')).toBe('false');
  });
});
