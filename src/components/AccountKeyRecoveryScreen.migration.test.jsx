// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
const state = vi.hoisted(() => ({ newOrigin: true }));
vi.mock('../store/authStore', () => ({ default: () => ({ user: { id: 'user-1' }, signOut: vi.fn() }) }));
vi.mock('../lib/crypto/accountKey', () => ({ startFreshEncryption: vi.fn() }));
vi.mock('../lib/originMigration', () => ({
  isNewAppOrigin: () => state.newOrigin,
  ORIGINAL_APP_URL: 'https://praystead.com/', ORIGINAL_WWW_APP_URL: 'https://www.praystead.com/',
}));
import AccountKeyRecoveryScreen from './AccountKeyRecoveryScreen';
import { originMigrationCopy } from '../lib/originMigrationCopy';
const { copy } = originMigrationCopy('en');
afterEach(cleanup);

describe('old-origin recovery destinations', () => {
  it('offers both original origins because www has independent browser key storage', () => {
    state.newOrigin = true;
    render(<AccountKeyRecoveryScreen lang="en" />);
    const apex = screen.getByRole('link', { name: copy.return });
    const www = screen.getByRole('link', { name: copy.returnWww });
    expect(apex.getAttribute('href')).toBe('https://praystead.com/');
    expect(www.getAttribute('href')).toBe('https://www.praystead.com/');
    for (const link of [apex, www]) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });

  it('does not suggest leaving the old origin when it is already open', () => {
    state.newOrigin = false;
    render(<AccountKeyRecoveryScreen lang="en" />);
    expect(screen.queryByRole('link', { name: copy.return })).toBeNull();
    expect(screen.queryByRole('link', { name: copy.returnWww })).toBeNull();
  });
});
