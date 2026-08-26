// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import PlanCompletionCard from '../PlanCompletionCard';
import { t } from '../../i18n';

afterEach(cleanup);

describe('relationship plan completion actions', () => {
  it('offers an engaged user an explicit path to the marriage plan catalogue', () => {
    const onRelationshipNext = vi.fn((event) => event.preventDefault());
    render(<PlanCompletionCard
      plan={{ id: 'covenant21', count: 21, lifeStage: 'engaged', completion: { en: 'Finished.' } }}
      lang="en"
      onRelationshipNext={onRelationshipNext}
      onContinue={vi.fn()}
    />);
    const link = screen.getByRole('link', { name: t('en', 'planCoupleContinueMarriage') });
    expect(link.getAttribute('href')).toBe('/plan');
    fireEvent.click(link);
    expect(onRelationshipNext).toHaveBeenCalledTimes(1);
  });

  it('offers a renewable married rhythm without rewriting the completed run', () => {
    render(<PlanCompletionCard
      plan={{ id: 'marriage30', count: 30, lifeStage: 'married', renewable: true, completion: { en: 'Finished.' } }}
      lang="en"
      onRelationshipNext={(event) => event.preventDefault()}
      onContinue={vi.fn()}
    />);
    expect(screen.getByRole('link', { name: t('en', 'planCoupleRepeat') }).getAttribute('href')).toBe('/plan');
  });
});
