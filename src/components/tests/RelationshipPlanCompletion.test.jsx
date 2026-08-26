// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
});
