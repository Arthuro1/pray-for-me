// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('../../lib/verseText', () => ({
  fetchScriptureText: vi.fn(async () => null), fetchVerseText: vi.fn(async () => ({ data: null, error: null })),
}));
vi.mock('../../utils/bibleLink', () => ({ bibleLink: () => 'https://www.bible.com' }));
vi.mock('../../lib/analytics', () => ({ track: vi.fn(), EVENTS: { RESOURCE_OPENED: 'resource_opened' } }));

import PlanDayBody from '../PlanDayBody';
import { t } from '../../i18n';

const lang = 'fr';
afterEach(cleanup);

describe('relationship plan day sections', () => {
  it('renders spouse, self, marriage, conversation, and shared-prayer directions distinctly', () => {
    render(<PlanDayBody lang={lang} role="general" day={{
      partnerName: 'Anna',
      spousePrompt: { fr: 'Prie pour Anna' }, selfPrompt: { fr: 'Prie pour ton propre cœur' },
      marriagePrompt: { fr: 'Prie pour votre mariage' },
      conversationPrompt: { fr: 'Une question à discuter' }, prayTogether: { fr: 'Quelques mots à prier ensemble' },
    }} />);
    expect(screen.getByText('Prie pour Anna')).toBeTruthy();
    expect(screen.getByText('Prie pour ton propre cœur')).toBeTruthy();
    expect(screen.getByText('Prie pour votre mariage')).toBeTruthy();
    expect(screen.getByText(t(lang, 'planTalkTogether'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'planPrayTogether'))).toBeTruthy();
  });

  it('renders each child in an isolated section', () => {
    render(<PlanDayBody lang={lang} day={{ childPrayers: [
      { id: 'emma', name: 'Emma', prompt: { fr: 'Seulement la prière pour Emma' } },
      { id: 'liam', name: 'Liam', prompt: { fr: 'Seulement la prière pour Liam' } },
    ] }} />);
    expect(screen.getByText('Seulement la prière pour Emma')).toBeTruthy();
    expect(screen.getByText('Seulement la prière pour Liam')).toBeTruthy();
  });

  it('does not publish an optional role reflection before its separate review', () => {
    render(<PlanDayBody lang={lang} role="husband" day={{
      roles: { husband: { fr: 'Contenu de rôle non révisé' } }, roleReviewStatus: 'needs_review',
    }} />);
    expect(screen.queryByText('Contenu de rôle non révisé')).toBeNull();
    expect(screen.getByText(t(lang, 'planCoupleRoleReviewPending'))).toBeTruthy();
  });
});
