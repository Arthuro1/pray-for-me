// @vitest-environment jsdom
//
// The recovery nudge must actually keep nudging: "Later" is a time-boxed snooze
// that re-surfaces, including closing it with the dismiss control. This guards the
// fix for the "prayers disappeared" report, where a one-storage-eviction key
// loss is permanent — a fire-once-then-silent banner left users unprotected.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

// Keep the store deterministic and the crypto/VaultModal import chain out.
const vaultState = vi.hoisted(() => ({ initialized: false, unlocked: true }));
vi.mock('../../store/vaultStore', () => ({ default: () => vaultState }));
vi.mock('../VaultModal', () => ({ default: () => <div role="dialog">one-time code</div> }));

import RecoveryPromptBanner from '../RecoveryPromptBanner';
import { t } from '../../i18n';

const lang = 'fr';
const DISMISS_KEY = 'pfm_recovery_prompt_dismissed';

beforeEach(() => { localStorage.clear(); vaultState.initialized = false; });
afterEach(cleanup);

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

  it('keeps the one-time-code dialog mounted when setup changes eligibility', () => {
    const { rerender } = render(<RecoveryPromptBanner lang={lang} userId="account-a" />);
    fireEvent.click(screen.getByText(t(lang, 'backupKeyCta')));
    vaultState.initialized = true;
    rerender(<RecoveryPromptBanner lang={lang} userId="account-a" />);
    expect(screen.getByRole('dialog').textContent).toContain('one-time code');
    expect(screen.queryByText(t(lang, 'backupKeyTitle'))).toBeNull();
  });
});
