// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import PlanCompletionCard from '../PlanCompletionCard';
import { t } from '../../i18n';

afterEach(cleanup);

// The next-step action is router navigation, not a bare href: a full document
// load would re-run the PWA's splash and refetch at the moment someone has just
// finished the plan. Rendering inside a router is what pins that.
const renderCard = (props) => render(
  <MemoryRouter><PlanCompletionCard lang="en" onContinue={vi.fn()} {...props} /></MemoryRouter>,
);

describe('relationship plan completion actions', () => {
  it('offers an engaged user an explicit path to the marriage plan catalogue', () => {
    const onRelationshipNext = vi.fn();
    renderCard({
      plan: { id: 'covenant21', count: 21, lifeStage: 'engaged', completion: { en: 'Finished.' } },
      onRelationshipNext,
    });
    const link = screen.getByRole('link', { name: t('en', 'planCoupleContinueMarriage') });
    expect(link.getAttribute('href')).toBe('/plan');
    expect(link.getAttribute('data-emphasis')).toBe('primary');
    fireEvent.click(link);
    expect(onRelationshipNext).toHaveBeenCalledTimes(1);
  });

  it('offers a renewable married rhythm without rewriting the completed run', () => {
    renderCard({
      plan: { id: 'marriage30', count: 30, lifeStage: 'married', renewable: true, completion: { en: 'Finished.' } },
    });
    expect(screen.getByRole('link', { name: t('en', 'planCoupleRepeat') }).getAttribute('href')).toBe('/plan');
  });

  it('leaves the next step out for a plan that has no follow-on', () => {
    renderCard({ plan: { id: 'preparing21', count: 21, lifeStage: 'single', completion: { en: 'Finished.' } } });
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('does not opt the reader into any recurring prayer theme', () => {
    const themes = [
      { id: 'spouse', titleKey: 'planPrayForSpouse' },
      { id: 'self', titleKey: 'planPrayForYourself' },
    ];
    const onContinue = vi.fn();
    renderCard({
      plan: {
        id: 'preparing21', count: 21, lifeStage: 'single', completion: { en: 'Finished.' }, continueThemes: themes,
      },
      onContinue,
    });

    const choices = screen.getAllByRole('checkbox');
    expect(choices).toHaveLength(2);
    expect(choices.every((choice) => choice.getAttribute('aria-checked') === 'false')).toBe(true);
    const add = screen.getByRole('button', { name: t('en', 'planContinueCta') });
    expect(add.disabled).toBe(true);

    fireEvent.click(choices[0]);
    expect(choices[0].getAttribute('aria-checked')).toBe('true');
    expect(choices[1].getAttribute('aria-checked')).toBe('false');
    expect(add.disabled).toBe(false);
    fireEvent.click(add);
    expect(onContinue).toHaveBeenCalledWith([themes[0]]);
  });

  it('keeps a relationship path secondary while a continuation choice is active', async () => {
    renderCard({
      plan: {
        id: 'combined', count: 21, lifeStage: 'engaged', completion: { en: 'Finished.' },
        continueThemes: [{ id: 'self', titleKey: 'planPrayForYourself' }],
      },
      onContinue: vi.fn(),
    });
    const link = screen.getByRole('link', { name: t('en', 'planCoupleContinueMarriage') });
    expect(link.getAttribute('data-emphasis')).toBe('secondary');

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: t('en', 'planContinueCta') }));
    await waitFor(() => expect(link.getAttribute('data-emphasis')).toBe('primary'));
  });
});
