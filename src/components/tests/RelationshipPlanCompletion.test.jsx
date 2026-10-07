// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import PlanCompletionCard from '../PlanCompletionCard';
import { t } from '../../i18n';
import { circleContent } from '../../content/intercessionCircles';

afterEach(cleanup);

// The next-step action is router navigation, not a bare href: a full document
// load would re-run the PWA's splash and refetch at the moment someone has just
// finished the plan. Rendering inside a router is what pins that.
const renderCard = (props) => render(
  <MemoryRouter><PlanCompletionCard lang="en" onKeepCarrying={vi.fn()} {...props} /></MemoryRouter>,
);

describe('relationship plan completion actions', () => {
  it('offers an engaged user an explicit path to the marriage plan catalogue', () => {
    const onRelationshipNext = vi.fn();
    renderCard({
      plan: { id: 'covenant21', count: 21, lifeStage: 'engaged', completion: { en: 'Finished.' } },
      onRelationshipNext,
    });
    const link = screen.getByRole('link', { name: t('en', 'planCoupleContinueMarriage') });
    expect(link.getAttribute('href')).toBe('/plans');
    expect(link.getAttribute('data-emphasis')).toBe('primary');
    fireEvent.click(link);
    expect(onRelationshipNext).toHaveBeenCalledTimes(1);
  });

  it('offers a renewable married rhythm without rewriting the completed run', () => {
    renderCard({
      plan: { id: 'marriage30', count: 30, lifeStage: 'married', renewable: true, completion: { en: 'Finished.' } },
    });
    expect(screen.getByRole('link', { name: t('en', 'planCoupleRepeat') }).getAttribute('href')).toBe('/plans');
  });

  it('leaves the next step out for a plan that has no follow-on', () => {
    renderCard({ plan: { id: 'preparing21', count: 21, lifeStage: 'single', completion: { en: 'Finished.' } } });
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('asks what to keep carrying, and creates nothing on the reader\'s behalf', () => {
    const themes = [
      { id: 'spouse', titleKey: 'planPrayForSpouse' },
      { id: 'self', titleKey: 'planPrayForYourself' },
    ];
    const onKeepCarrying = vi.fn();
    renderCard({
      plan: {
        id: 'preparing21', count: 21, lifeStage: 'single', primaryCircle: 'self', circles: ['self', 'household'],
        completion: { en: 'Finished.' }, continueThemes: themes,
      },
      onKeepCarrying,
    });

    expect(screen.getByRole('heading', { name: t('en', 'planKeepCarryingHeading') })).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
    const choices = within(screen.getByRole('region', { name: t('en', 'planKeepCarryingHeading') })).getAllByRole('button');
    expect(choices.map((b) => b.textContent)).toEqual(themes.map((th) => t('en', th.titleKey)));
    expect(onKeepCarrying).not.toHaveBeenCalled();

    // One theme opens the composer in the plan's circle, the theme only a
    // starting point above an empty field — and another can be chosen after.
    fireEvent.click(choices[0]);
    expect(onKeepCarrying).toHaveBeenLastCalledWith({ circle: 'self', prompt: t('en', 'planPrayForSpouse') });
    fireEvent.click(choices[1]);
    expect(onKeepCarrying).toHaveBeenLastCalledWith({ circle: 'self', prompt: t('en', 'planPrayForYourself') });
  });

  it('offers the themes of the plan\'s circle when the plan has none of its own', () => {
    const onKeepCarrying = vi.fn();
    renderCard({
      plan: { id: 'kingdomCome14', count: 14, primaryCircle: 'kingdom', circles: ['kingdom'], completion: { en: 'Finished.' } },
      onKeepCarrying,
    });
    const region = screen.getByRole('region', { name: t('en', 'planKeepCarryingHeading') });
    expect(within(region).getByText(t('en', 'circle_kingdom'))).toBeTruthy();
    const titles = circleContent('kingdom').themes.map((theme) => theme.title.en);
    expect(within(region).getAllByRole('button').map((b) => b.textContent)).toEqual(titles);
    fireEvent.click(within(region).getByRole('button', { name: titles[1] }));
    expect(onKeepCarrying).toHaveBeenCalledWith({ circle: 'kingdom', prompt: titles[1] });
  });

  it('asks nothing where there is nowhere to take the answer', () => {
    render(
      <MemoryRouter>
        <PlanCompletionCard lang="en" plan={{ id: 'x', count: 7, primaryCircle: 'self', completion: { en: 'Finished.' } }} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('heading', { name: t('en', 'planKeepCarryingHeading') })).toBeNull();
  });

  it('keeps a relationship path secondary while themes to keep carrying are offered', () => {
    renderCard({
      plan: {
        id: 'combined', count: 21, lifeStage: 'engaged', primaryCircle: 'household', completion: { en: 'Finished.' },
        continueThemes: [{ id: 'self', titleKey: 'planPrayForYourself' }],
      },
    });
    expect(screen.getByRole('link', { name: t('en', 'planCoupleContinueMarriage') }).getAttribute('data-emphasis')).toBe('secondary');
  });
});
