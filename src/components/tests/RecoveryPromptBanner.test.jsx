// @vitest-environment jsdom
//
// The recovery nudge must actually keep nudging: "Later" is a time-boxed snooze
// that re-surfaces, and only the explicit ✕ opts out for good. This guards the
// fix for the "prayers disappeared" report, where a one-storage-eviction key
// loss is permanent — a fire-once-then-silent banner left users unprotected.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

// Keep the store deterministic and the crypto/VaultModal import chain out.
vi.mock('../../store/vaultStore', () => ({
  default: () => ({ initialized: false, unlocked: true }),
}));
vi.mock('../VaultModal', () => ({ default: () => null }));

import RecoveryPromptBanner from '../RecoveryPromptBanner';
import { t } from '../../i18n';

const lang = 'fr';
const DISMISS_KEY = 'pfm_recovery_prompt_dismissed';

beforeEach(() => localStorage.clear());
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

  it('the ✕ opts out for good', () => {
    render(<RecoveryPromptBanner lang={lang} />);
    fireEvent.click(screen.getByLabelText(t(lang, 'backupKeyDismissForever')));

    expect(localStorage.getItem(DISMISS_KEY)).toBe('never');
    expect(screen.queryByText(t(lang, 'backupKeyTitle'))).toBeNull();
  });

  it('re-surfaces once a past snooze has elapsed', () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() - 1000));
    render(<RecoveryPromptBanner lang={lang} />);
    expect(screen.getByText(t(lang, 'backupKeyTitle'))).toBeTruthy();
  });

  it('stays hidden for an unelapsed snooze, a "never", and the legacy "1" flag', () => {
    for (const value of [String(Date.now() + 60_000), 'never', '1']) {
      localStorage.setItem(DISMISS_KEY, value);
      render(<RecoveryPromptBanner lang={lang} />);
      expect(screen.queryByText(t(lang, 'backupKeyTitle'))).toBeNull();
      cleanup();
    }
  });
});
