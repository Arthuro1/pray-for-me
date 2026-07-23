// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const loads = vi.hoisted(() => ({
  authenticated: 0,
  guest: 0,
}));

vi.mock('./pages/LandingPage', () => ({
  default: ({ onBeginPrayer, onSignIn }) => (
    <div>
      <button onClick={onBeginPrayer}>begin-test-prayer</button>
      <button onClick={onSignIn}>sign-in-test</button>
    </div>
  ),
}));

vi.mock('./components/GuestPrayerFlow', () => {
  loads.guest += 1;
  return { default: () => <div>guest-prayer-shell</div> };
});

vi.mock('./AuthenticatedApp', () => {
  loads.authenticated += 1;
  return { default: () => <div>authenticated-shell</div> };
});

import App from './App';

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  loads.authenticated = 0;
  loads.guest = 0;
  window.history.replaceState({}, '', '/');
});

describe('anonymous application boundary', () => {
  it('does not import the authenticated app during a clean landing visit', async () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(await screen.findByText('begin-test-prayer')).toBeTruthy();
    expect(loads.authenticated).toBe(0);
    expect(loads.guest).toBe(0);

    fireEvent.click(screen.getByText('sign-in-test'));
    expect(await screen.findByText('authenticated-shell')).toBeTruthy();
    expect(loads.authenticated).toBe(1);
  });

  it('opens the guest prayer shell without crossing the authenticated boundary', async () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    fireEvent.click(await screen.findByText('begin-test-prayer'));
    expect(await screen.findByText('guest-prayer-shell')).toBeTruthy();
    expect(loads.guest).toBe(1);
    expect(loads.authenticated).toBe(0);
  });
});
