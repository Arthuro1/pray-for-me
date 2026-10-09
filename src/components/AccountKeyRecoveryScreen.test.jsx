// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const state = vi.hoisted(() => ({ recover: vi.fn(), startFresh: vi.fn() }));
vi.mock('../store/authStore', () => ({ default: () => ({ user: { id: 'account-a' }, signOut: vi.fn() }) }));
vi.mock('../lib/crypto/accountKey', () => ({ startFreshEncryption: state.startFresh }));
vi.mock('../lib/originMigration', () => ({ isNewAppOrigin: () => false }));
vi.mock('./PrayerProtection', () => ({
  PrayerRecoveryChoices: ({ userId, onRecovered }) => (
    <button type="button" onClick={() => { state.recover(userId); onRecovered?.(); }}>Use saved passkey</button>
  ),
}));

import AccountKeyRecoveryScreen from './AccountKeyRecoveryScreen';
import { loadLocale, t } from '../i18n';

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('account key recovery with independent passkey methods', () => {
  it.each(['en', 'fr'])('acknowledges existing recovery options on a device without a legacy wrapper (%s)', async (lang) => {
    await loadLocale(lang);
    render(<AccountKeyRecoveryScreen lang={lang} />);

    expect(screen.getByRole('heading', { name: t(lang, 'keyMissingHeading') })).toBeTruthy();
    const body = screen.getByText(t(lang, 'keyMissingBody'));
    expect(body.textContent).toMatch(/passkey|clé d['’]accès/i);
    expect(body.textContent).not.toMatch(/no recovery code was set up|aucun code de récupération n['’]a été configuré/i);
    expect(screen.getByText(t(lang, 'keyMissingReassure'))).toBeTruthy();
  });

  it('resolves the account gate after passkey recovery without replacing the encryption key', () => {
    const onResolved = vi.fn();
    render(<AccountKeyRecoveryScreen lang="fr" onResolved={onResolved} />);

    fireEvent.click(screen.getByRole('button', { name: 'Use saved passkey' }));

    expect(state.recover).toHaveBeenCalledWith('account-a');
    expect(onResolved).toHaveBeenCalledOnce();
    expect(state.startFresh).not.toHaveBeenCalled();
  });
});
