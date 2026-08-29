// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import {
  ContextualNudgeProvider,
  useContextualNudgeSlot,
} from '../shared/ContextualNudgeCoordinator';

afterEach(cleanup);

function Nudge({ id, priority, eligible = true }) {
  const { visible, complete } = useContextualNudgeSlot(id, eligible, priority);
  return visible ? <button onClick={complete}>{id}</button> : null;
}

describe('ContextualNudgeCoordinator', () => {
  it('shows only the highest-priority eligible nudge', async () => {
    render(
      <ContextualNudgeProvider>
        <Nudge id="journal" priority={40} />
        <Nudge id="recovery" priority={10} />
        <Nudge id="install" priority={30} />
      </ContextualNudgeProvider>,
    );

    expect(await screen.findByRole('button', { name: 'recovery' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'journal' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'install' })).toBeNull();
  });

  it('does not replace a handled nudge with another one on the same screen', async () => {
    render(
      <ContextualNudgeProvider>
        <Nudge id="activation" priority={20} />
        <Nudge id="install" priority={30} />
      </ContextualNudgeProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'activation' }));
    expect(screen.queryByRole('button')).toBeNull();
  });
});
