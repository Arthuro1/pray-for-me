// @vitest-environment jsdom
//
// The recovery nudge must actually keep nudging: "Later" is a time-boxed snooze
// that re-surfaces, including closing it with the dismiss control. This guards the
// fix for the "prayers disappeared" report, where a one-storage-eviction key
// loss is permanent — a fire-once-then-silent banner left users unprotected.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

// Keep the store deterministic and the protection implementation isolated.
const vaultState = vi.hoisted(() => ({ initialized: false, unlocked: true }));
const getProtectionStatus = vi.hoisted(() => vi.fn());
vi.mock('../../store/vaultStore', () => ({ default: () => vaultState }));
vi.mock('../../lib/prayerProtection', () => ({ getProtectionStatus }));
vi.mock('../PrayerProtection', () => ({ default: ({ userId, onReady }) => <div data-testid="protection-flow" data-account={userId}><button onClick={onReady}>Finish protection</button></div> }));

import RecoveryPromptBanner from '../RecoveryPromptBanner';
import { t } from '../../i18n';

const lang = 'fr';
const DISMISS_KEY = 'pfm_recovery_prompt_dismissed';

beforeEach(() => {
  localStorage.clear();
  vaultState.initialized = false;
  vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'false');
  getProtectionStatus.mockReset();
  getProtectionStatus.mockResolvedValue({ ok: true, methods: [] });
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

describe('RecoveryPromptBanner', () => {
  it('shows the nudge with the irreversibility warning when there is no backup', () => {
    render(<RecoveryPromptBanner lang={lang} />);
    expect(screen.getByText(t(lang, 'backupKeyTitle'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'backupKeyWarn'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'backupKeyCta'))).toBeTruthy();
  });

  it('"Later" snoozes (a future timestamp), not a permanent dismissal', () => {
    render(<RecoveryPromptBanner lang={lang} />);
    fireEvent.click(screen.getByText(t(lang, 'backupKeyDismiss')));

    const stored = localStorage.getItem(DISMISS_KEY);
    expect(stored).not.toBe('never');
    expect(Number(stored)).toBeGreaterThan(Date.now());
    expect(screen.queryByText(t(lang, 'backupKeyTitle'))).toBeNull();
  });

  it('closing the nudge snoozes rather than permanently suppressing recovery', () => {
    render(<RecoveryPromptBanner lang={lang} />);
    fireEvent.click(screen.getByLabelText(t(lang, 'backupKeyDismiss')));

    expect(Number(localStorage.getItem(DISMISS_KEY))).toBeGreaterThan(Date.now());
    expect(screen.queryByText(t(lang, 'backupKeyTitle'))).toBeNull();
  });

  it('re-surfaces once a past snooze has elapsed', () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() - 1000));
    render(<RecoveryPromptBanner lang={lang} />);
    expect(screen.getByText(t(lang, 'backupKeyTitle'))).toBeTruthy();
  });

  it('stays hidden for an unelapsed snooze', () => {
    for (const value of [String(Date.now() + 60_000)]) {
      localStorage.setItem(DISMISS_KEY, value);
      render(<RecoveryPromptBanner lang={lang} />);
      expect(screen.queryByText(t(lang, 'backupKeyTitle'))).toBeNull();
      cleanup();
    }
  });

  it('does not inherit another account dismissal or a permanent legacy dismissal', () => {
    localStorage.setItem(DISMISS_KEY, 'never');
    localStorage.setItem(`${DISMISS_KEY}:account-a`, String(Date.now() + 60_000));
    render(<RecoveryPromptBanner lang={lang} userId="account-b" />);
    expect(screen.getByText(t(lang, 'backupKeyTitle'))).toBeTruthy();
  });

  it('opens the single protection flow even when new enrollment is disabled', () => {
    render(<RecoveryPromptBanner lang={lang} userId="account-a" />);
    fireEvent.click(screen.getByText(t(lang, 'backupKeyCta')));
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe(t(lang, 'protectionTitle'));
    expect(screen.getByTestId('protection-flow').getAttribute('data-account')).toBe('account-a');
  });

  it('keeps the protection dialog mounted when setup changes eligibility', () => {
    const { rerender } = render(<RecoveryPromptBanner lang={lang} userId="account-a" />);
    fireEvent.click(screen.getByText(t(lang, 'backupKeyCta')));
    vaultState.initialized = true;
    rerender(<RecoveryPromptBanner lang={lang} userId="account-a" />);
    expect(screen.getByTestId('protection-flow')).toBeTruthy();
    expect(screen.queryByText(t(lang, 'backupKeyTitle'))).toBeNull();
  });

  it('waits for health and stays hidden when a passkey already provides recovery', async () => {
    vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'true');
    getProtectionStatus.mockResolvedValue({ ok: true, methods: [{ type: 'passkey', status: 'active' }] });
    render(<RecoveryPromptBanner lang={lang} userId="account-a" />);
    expect(screen.queryByText(t(lang, 'backupKeyTitle'))).toBeNull();
    await waitFor(() => expect(getProtectionStatus).toHaveBeenCalledWith('account-a'));
    expect(screen.queryByText(t(lang, 'backupKeyTitle'))).toBeNull();
  });

  it('keeps nudging for an unverified method and closes after protection is ready', async () => {
    vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'true');
    getProtectionStatus.mockResolvedValue({ ok: true, methods: [{ type: 'passkey', status: 'pending' }] });
    render(<RecoveryPromptBanner lang={lang} userId="account-a" />);
    fireEvent.click(await screen.findByText(t(lang, 'backupKeyCta')));
    fireEvent.click(screen.getByRole('button', { name: 'Finish protection' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText(t(lang, 'backupKeyTitle'))).toBeNull();
  });

  it('does not claim recovery is missing when the health check fails', async () => {
    vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'true');
    getProtectionStatus.mockResolvedValue({ ok: false, error: 'unavailable', methods: [] });
    render(<RecoveryPromptBanner lang={lang} userId="account-a" />);
    await waitFor(() => expect(getProtectionStatus).toHaveBeenCalledWith('account-a'));
    expect(screen.queryByText(t(lang, 'backupKeyTitle'))).toBeNull();
  });

  it('recognizes active passkey recovery even when new enrollment is disabled', async () => {
    vi.stubEnv('VITE_PRAYER_PROTECTION_ENABLED', 'false');
    getProtectionStatus.mockResolvedValue({ ok: true, methods: [{ type: 'passkey', status: 'active' }] });
    render(<RecoveryPromptBanner lang={lang} userId="account-a" />);
    await waitFor(() => expect(screen.queryByText(t(lang, 'backupKeyTitle'))).toBeNull());
    expect(getProtectionStatus).toHaveBeenCalledWith('account-a');
  });
});
