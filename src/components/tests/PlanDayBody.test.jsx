// @vitest-environment jsdom
//
// A rich plan day, as it is actually rendered. What is being defended:
//   • the resource hierarchy — Scripture, then reflection, then prayer, then an
//     optional practice, and only then anything external;
//   • husband/wife reflections appear ONLY when the reader asked for them;
//   • "Go deeper" is absent (not apologetic) when nothing is approved;
//   • a resource card always names its type AND its language, and its link says
//     out loud that it leaves the app.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null),
  fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
const trackMock = vi.hoisted(() => vi.fn());
vi.mock('../../lib/analytics', () => ({
  track: trackMock,
  EVENTS: { RESOURCE_OPENED: 'resource_opened' },
}));

import PlanDayBody from '../PlanDayBody';
import { t } from '../../i18n';

const lang = 'fr'; // the always-loaded fallback locale
const afterPrayerLabel = () => {
  const requested = t(lang, 'planAfterPrayer');
  return requested === 'planAfterPrayer' ? t(lang, 'moreOptionsLabel') : requested;
};
afterEach(() => { cleanup(); trackMock.mockClear(); localStorage.clear(); });

const day = {
  ref: 'Colossians 1:9-12',
  related: ['Philippians 1:9-11'],
  reflection: { fr: 'La réflexion du jour', en: 'The day’s reflection' },
  prompts: [
    { fr: 'Premier sujet', en: 'First prompt' },
    { fr: 'Deuxième sujet', en: 'Second prompt' },
  ],
  selfPrompt: { fr: 'Prie-le pour toi aussi', en: 'Pray it for yourself too' },
  practice: { fr: 'Une petite mise en pratique', en: 'A small practice' },
  roles: {
    husband: { fr: 'Réflexion pour le mari', en: 'Husband reflection', ref: 'Mark 10:42-45' },
    wife: { fr: 'Réflexion pour l’épouse', en: 'Wife reflection' },
  },
  resourceTopics: ['marriage'],
};

const resource = {
  id: 'r1',
  type: 'book',
  lang: 'en',
  isFallback: true,
  description: { fr: 'Pourquoi cette ressource', en: 'Why this resource' },
  edition: { title: 'A verified title', author: 'An author', url: 'https://example.org' },
};

describe('the day body', () => {
  it('keeps reflection and prayer directions prominent while practice stays optional', () => {
    render(<PlanDayBody day={day} lang={lang} />);
    expect(screen.getByText('La réflexion du jour')).toBeTruthy();
    expect(screen.getByText('Premier sujet')).toBeTruthy();
    expect(screen.getByText('Deuxième sujet')).toBeTruthy();
    expect(screen.getByText('Prie-le pour toi aussi')).toBeTruthy();
    expect(screen.getByText(t(lang, 'planPrayForYourself'))).toBeTruthy();
    expect(screen.queryByText('Une petite mise en pratique')).toBeNull();

    const trigger = screen.getByRole('button', { name: afterPrayerLabel() });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe('plan-day-after-prayer');
    fireEvent.click(trigger);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Une petite mise en pratique')).toBeTruthy();
    expect(screen.getByText(t(lang, 'planPracticeToday'))).toBeTruthy();
  });

  it('keeps related passages in the same after-prayer disclosure', () => {
    render(<PlanDayBody day={day} lang={lang} />);
    expect(screen.queryByText(/Philippiens 1:9-11|Philippians 1:9-11/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: afterPrayerLabel() }));
    expect(screen.getByText(t(lang, 'planRelatedScripture'))).toBeTruthy();
    expect(screen.getByText(/Philippiens 1:9-11|Philippians 1:9-11/)).toBeTruthy();
  });

  it('renders nothing at all for a plain theme-and-verse day', () => {
    const { container } = render(<PlanDayBody day={{ ref: 'Psalm 23' }} lang={lang} />);
    expect(container.textContent).toBe('');
  });
});

describe('husband / wife reflections', () => {
  it('are hidden unless the reader explicitly chose a role', () => {
    render(<PlanDayBody day={day} lang={lang} role="general" />);
    expect(screen.queryByText('Réflexion pour le mari')).toBeNull();
    expect(screen.queryByText('Réflexion pour l’épouse')).toBeNull();
  });

  it('show only the chosen role, with its own passage', () => {
    render(<PlanDayBody day={day} lang={lang} role="husband" />);
    expect(screen.getByText('Réflexion pour le mari')).toBeTruthy();
    expect(screen.queryByText('Réflexion pour l’épouse')).toBeNull();
    expect(screen.getByText(t(lang, 'planPrepRoleHusbandHeading'))).toBeTruthy();
    expect(screen.getByText(/Marc 10:42-45|Mark 10:42-45/)).toBeTruthy();
  });

  it('show the wife reflection when that is the choice', () => {
    render(<PlanDayBody day={day} lang={lang} role="wife" />);
    expect(screen.getByText('Réflexion pour l’épouse')).toBeTruthy();
    expect(screen.getByText(t(lang, 'planPrepRoleWifeHeading'))).toBeTruthy();
  });
});

describe('Go deeper', () => {
  it('is omitted entirely when no approved resource matched', () => {
    render(<PlanDayBody day={day} lang={lang} resources={[]} />);
    fireEvent.click(screen.getByRole('button', { name: afterPrayerLabel() }));
    expect(screen.queryByText(t(lang, 'goDeeper'))).toBeNull();
    // …and never explains its own absence.
    expect(document.body.textContent).not.toMatch(/aucune ressource|no resources/i);
  });

  it('is a collapsed disclosure that announces its state', () => {
    render(<PlanDayBody day={day} lang={lang} resources={[resource]} />);
    expect(screen.queryByRole('button', { name: t(lang, 'goDeeper') })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: afterPrayerLabel() }));
    const trigger = screen.getByRole('button', { name: t(lang, 'goDeeper') });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('A verified title')).toBeNull();
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('A verified title')).toBeTruthy();
  });

  it('names the resource type and its language on the card', () => {
    render(<PlanDayBody day={day} lang={lang} resources={[resource]} />);
    fireEvent.click(screen.getByRole('button', { name: afterPrayerLabel() }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'goDeeper') }));
    expect(screen.getByText(`${t(lang, 'resourceTypeBook')} · English`)).toBeTruthy();
    expect(screen.getByText('An author')).toBeTruthy();
    expect(screen.getByText('Pourquoi cette ressource')).toBeTruthy();
  });

  it('says out loud that the link leaves the app, not just with an icon', () => {
    render(<PlanDayBody day={day} lang={lang} resources={[resource]} />);
    fireEvent.click(screen.getByRole('button', { name: afterPrayerLabel() }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'goDeeper') }));
    const link = screen.getByRole('link');
    expect(link.getAttribute('aria-label')).toContain(t(lang, 'resourceOpensExternally'));
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('reports only THAT a resource was opened — no id, title, topic or language', () => {
    render(<PlanDayBody day={day} lang={lang} resources={[resource]} />);
    fireEvent.click(screen.getByRole('button', { name: afterPrayerLabel() }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'goDeeper') }));
    fireEvent.click(screen.getByRole('link'));
    expect(trackMock).toHaveBeenCalledWith('resource_opened');
    expect(trackMock.mock.calls[0]).toHaveLength(1);
  });

  it('carries a cover tile on every card, with or without a cover file', () => {
    const withCover = { ...resource, edition: { ...resource.edition, thumbnail: '/resources/covers/r1.webp' } };
    const { container } = render(<PlanDayBody day={day} lang={lang} resources={[withCover, { ...resource, id: 'r2' }]} />);
    fireEvent.click(screen.getByRole('button', { name: afterPrayerLabel() }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'goDeeper') }));
    expect(container.querySelectorAll('img')).toHaveLength(1);
    // The second card has no cover file, so it draws its tile instead.
    expect(container.querySelectorAll('li div[aria-hidden="true"]')).toHaveLength(2);
  });

  it('skips cover files in low data mode — a cover is decoration, not content', () => {
    localStorage.setItem('pfm_settings', JSON.stringify({ lowDataMode: true }));
    const withCover = { ...resource, edition: { ...resource.edition, thumbnail: '/resources/covers/r1.webp' } };
    const { container } = render(<PlanDayBody day={day} lang={lang} resources={[withCover]} />);
    fireEvent.click(screen.getByRole('button', { name: afterPrayerLabel() }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'goDeeper') }));
    expect(container.querySelector('img')).toBeNull();
    // …and the card still shows everything that actually matters.
    expect(screen.getByText('A verified title')).toBeTruthy();
  });
});
