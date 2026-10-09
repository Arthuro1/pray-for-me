// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

const vaultState = vi.hoisted(() => ({ initialized: false }));
const readUnassignedLegacyVaultRecord = vi.hoisted(() => vi.fn());
vi.mock('../../store/authStore', () => ({ default: () => ({ user: { id: 'account-a' }, signOut: vi.fn() }) }));
vi.mock('../../store/vaultStore', () => ({ default: (selector) => selector(vaultState) }));
vi.mock('../../lib/crypto/keyManager', () => ({ readUnassignedLegacyVaultRecord }));
vi.mock('../AccountGate', () => ({ default: ({ title, body, reassure, children }) => <main><h1>{title}</h1><p>{body}</p><p>{reassure}</p>{children}</main> }));
vi.mock('../PrayerProtection', () => ({ PrayerRecoveryChoices: () => <button>Use passkey</button> }));
vi.mock('../VaultModal', () => ({ default: ({ userId, initialMode, embedded }) => <div data-testid="legacy-unlock" data-account={userId} data-mode={initialMode} data-embedded={String(embedded)}>Legacy recovery</div> }));

import VaultLockScreen from '../VaultLockScreen';
import { t } from '../../i18n';

beforeEach(() => {
  vaultState.initialized = false;
  readUnassignedLegacyVaultRecord.mockReset();
  readUnassignedLegacyVaultRecord.mockResolvedValue(null);
});
afterEach(cleanup);

describe('VaultLockScreen', () => {
  it('makes passkey recovery primary and keeps old access collapsed', async () => {
    vaultState.initialized = true;
    render(<VaultLockScreen lang="fr" />);
    expect(screen.getByRole('button', { name: 'Use passkey' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: t('fr', 'keyMissingHeading') })).toBeTruthy();
    expect(screen.queryByText(t('fr', 'vaultLockedReassure'))).toBeNull();
    const summary = screen.getByText(t('fr', 'protectionLegacyAccess'));
    const details = summary.closest('details');
    expect(details.open).toBe(false);
    fireEvent.click(summary);
    expect(details.open).toBe(true);
    const legacy = screen.getByTestId('legacy-unlock');
    expect(legacy.getAttribute('data-account')).toBe('account-a');
    expect(legacy.getAttribute('data-mode')).toBe('unlock');
    expect(legacy.getAttribute('data-embedded')).toBe('true');
    await waitFor(() => expect(readUnassignedLegacyVaultRecord).toHaveBeenCalled());
  });

  it('preserves access to an unassigned old vault without adding it for new accounts', async () => {
    const { unmount } = render(<VaultLockScreen lang="fr" />);
    await waitFor(() => expect(readUnassignedLegacyVaultRecord).toHaveBeenCalled());
    expect(screen.queryByTestId('legacy-unlock')).toBeNull();
    unmount();
    readUnassignedLegacyVaultRecord.mockResolvedValue({ version: 1 });
    render(<VaultLockScreen lang="fr" />);
    await screen.findByTestId('legacy-unlock');
    expect(screen.getByText(t('fr', 'protectionLegacyAccess')).closest('details').open).toBe(false);
  });
});
