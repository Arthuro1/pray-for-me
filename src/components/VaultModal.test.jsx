// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const vault = vi.hoisted(() => ({
  createVault: vi.fn(),
  setUpRecovery: vi.fn(),
  unlock: vi.fn(),
  resetPassphrase: vi.fn(),
  changePassphrase: vi.fn(),
  rotateRecoveryCode: vi.fn(),
  unlocked: false,
}));

vi.mock('../store/vaultStore', () => ({ default: () => vault }));
vi.mock('../store/toastStore', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import VaultModal from './VaultModal';
import { t } from '../i18n';

const lang = 'fr';

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  vault.unlocked = false;
  vault.unlock.mockResolvedValue(true);
  vault.changePassphrase.mockResolvedValue(true);
});

describe('VaultModal actions', () => {
  it('unlocks the active account and closes only after success', async () => {
    const onClose = vi.fn();
    render(<VaultModal lang={lang} initialMode="unlock" userId="user-1" onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText(t(lang, 'vaultPassphrase')), { target: { value: 'correct passphrase' } });

    fireEvent.click(screen.getByRole('button', { name: t(lang, 'vaultUnlock') }));

    await waitFor(() => expect(vault.unlock).toHaveBeenCalledWith('correct passphrase', 'user-1'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('changes the passphrase with the current and new values in the right order', async () => {
    const onClose = vi.fn();
    render(<VaultModal lang={lang} initialMode="change" userId="user-1" onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText(t(lang, 'vaultCurrentPassphrase')), { target: { value: 'current passphrase' } });
    fireEvent.change(screen.getByPlaceholderText(t(lang, 'vaultNewPassphrase')), { target: { value: 'new passphrase' } });

    fireEvent.click(screen.getByRole('button', { name: t(lang, 'vaultChangeSave') }));

    await waitFor(() => expect(vault.changePassphrase).toHaveBeenCalledWith('current passphrase', 'new passphrase', 'user-1'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('recovers from an unexpected crypto failure instead of leaving the button busy', async () => {
    vault.unlock.mockRejectedValue(new Error('crypto unavailable'));
    render(<VaultModal lang={lang} initialMode="unlock" userId="user-1" onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(t(lang, 'vaultPassphrase')), { target: { value: 'correct passphrase' } });
    const button = screen.getByRole('button', { name: t(lang, 'vaultUnlock') });

    fireEvent.click(button);

    expect(await screen.findByText(t(lang, 'errorGeneric'))).toBeTruthy();
    await waitFor(() => expect(button.disabled).toBe(false));
  });
});
