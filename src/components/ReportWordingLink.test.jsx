// @vitest-environment jsdom
import { afterEach, beforeEach, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { loadLocale } from '../i18n';
import useAuthStore from '../store/authStore';
import ReportWordingLink from './ReportWordingLink';

beforeEach(() => loadLocale('en'));
afterEach(() => { cleanup(); useAuthStore.setState({ user: null }); });

it('is offered to signed-in readers only: reports are stored per account', () => {
  useAuthStore.setState({ user: { id: 'u1', is_anonymous: true } });
  render(<ReportWordingLink lang="en" surface="guides/acts" />);
  expect(screen.queryByRole('button', { name: /Report wording/ })).toBeNull();
  cleanup();
  useAuthStore.setState({ user: { id: 'u1' } });
  render(<ReportWordingLink lang="en" surface="guides/acts" />);
  expect(screen.getByRole('button', { name: /Report wording/ })).toBeTruthy();
});
