// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  mode: 'ios',
  markShown: vi.fn(),
  requestNative: vi.fn(),
  snooze: vi.fn(),
}));

vi.mock('../../lib/pwaInstall', () => ({
  markContextualPromptShownForVisit: mocks.markShown,
  pwaInstallMode: () => mocks.mode,
  requestNativePwaInstall: mocks.requestNative,
  snoozePwaInstallPrompt: mocks.snooze,
  subscribePwaInstallState: () => () => {},
}));

import PwaInstallNudge from '../PwaInstallNudge';
import { markActivationSessionCompleted } from '../../lib/activationProgress';
import { t } from '../../i18n';

beforeEach(() => {
  cleanup();
  localStorage.clear();
  mocks.mode = 'ios';
  mocks.markShown.mockClear();
  mocks.requestNative.mockReset();
  mocks.snooze.mockClear();
  markActivationSessionCompleted();
});

describe('PwaInstallNudge', () => {
  it('shows compact iOS instructions only after the contextual action', () => {
    render(<PwaInstallNudge lang="en" />);
    expect(screen.queryByText(t('en', 'pwaIosTitle'))).toBeNull();
    fireEvent.click(screen.getByText(t('en', 'pwaInstallCta')));
    expect(screen.getByRole('dialog', { name: t('en', 'pwaIosTitle') })).toBeTruthy();
    expect(screen.getByText(t('en', 'pwaIosAddAction'))).toBeTruthy();
  });

  it('snoozes a dismissed prompt without leaving permanent UI', () => {
    render(<PwaInstallNudge lang="en" />);
    fireEvent.click(screen.getByLabelText(t('en', 'pwaInstallLater')));
    expect(mocks.snooze).toHaveBeenCalledOnce();
    expect(screen.queryByText(t('en', 'pwaInstallTitle'))).toBeNull();
  });

  it('uses the browser-native prompt when available', async () => {
    mocks.mode = 'native';
    mocks.requestNative.mockResolvedValue('accepted');
    render(<PwaInstallNudge lang="en" />);
    fireEvent.click(screen.getByText(t('en', 'pwaInstallCta')));
    expect(mocks.requestNative).toHaveBeenCalledOnce();
  });
});
