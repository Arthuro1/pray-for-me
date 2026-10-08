// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const state = vi.hoisted(() => ({
  user: { id: 'user-1' }, vault: { initialized: true, unlocked: true },
  verify: vi.fn(), current: vi.fn(), recheck: vi.fn(), original: true, snoozed: false, snooze: vi.fn(), queueListener: null,
}));
vi.mock('../store/authStore', () => ({ default: () => ({ user: state.user }) }));
vi.mock('../store/vaultStore', () => ({ default: () => state.vault }));
vi.mock('../lib/originMigration', () => ({
  NEW_APP_URL: 'https://qetoret.com/',
  checkOriginMigrationReady: state.verify, isMigrationVerificationCurrent: state.current,
  recheckOriginMigrationReady: state.recheck,
  isOriginalAppOrigin: () => state.original, migrationPromptSnoozed: () => state.snoozed,
  snoozeMigrationPrompt: state.snooze,
}));
vi.mock('../lib/mutationQueue', () => ({ subscribeQueue: (fn) => { state.queueListener = fn; return () => { state.queueListener = null; }; } }));
vi.mock('./VaultModal', () => ({ default: ({ onClose }) => <button onClick={() => { state.vault.initialized = true; onClose(); }}>Finish recovery setup</button> }));

import OriginMigrationGuide from './OriginMigrationGuide';
import OriginMigrationBanner from './OriginMigrationBanner';
import { originMigrationCopy } from '../lib/originMigrationCopy';
const { copy } = originMigrationCopy('en');

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
beforeEach(() => {
  vi.clearAllMocks();
  state.vault = { initialized: true, unlocked: true };
  state.original = true;
  state.snoozed = false;
  state.verify.mockResolvedValue({ status: 'ready' });
  state.current.mockReturnValue(true);
  state.recheck.mockResolvedValue({ status: 'ready' });
});

const submit = () => {
  fireEvent.change(screen.getByLabelText(copy.passphrase), { target: { value: 'private passphrase' } });
  fireEvent.click(screen.getByRole('button', { name: copy.verify }));
};

describe('OriginMigrationGuide', () => {
  it('only exposes the fixed new-tab link after an explicit successful check, then clears the passphrase', async () => {
    render(<OriginMigrationGuide lang="en" onClose={vi.fn()} />);
    expect(state.verify).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: copy.continue })).toBeNull();
    submit();
    const link = await screen.findByRole('link', { name: copy.continue });
    expect(state.verify).toHaveBeenCalledWith('user-1', 'private passphrase');
    expect(link.getAttribute('href')).toBe('https://qetoret.com/');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getByLabelText(copy.passphrase).value).toBe('');
  });

  it.each(['failed', 'wrongPassphrase', 'drafts', 'pending', 'offline'])('offers no migration link after %s', async (status) => {
    state.verify.mockResolvedValueOnce({ status });
    render(<OriginMigrationGuide lang="en" onClose={vi.fn()} />);
    submit();
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', copy[status]);
    expect(screen.queryByRole('link', { name: copy.continue })).toBeNull();
  });

  it('invalidates a completed check when pending writes change', async () => {
    render(<OriginMigrationGuide lang="en" onClose={vi.fn()} />);
    submit();
    await screen.findByRole('link', { name: copy.continue });
    const { act } = await import('@testing-library/react');
    act(() => state.queueListener(1));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', copy.changed);
    expect(screen.queryByRole('link', { name: copy.continue })).toBeNull();
  });

  it('reserves an isolated new tab and navigates only after rechecking local drafts', async () => {
    const tabDocument = document.implementation.createHTMLDocument();
    const nextTab = { opener: window, document: tabDocument, location: { replace: vi.fn() }, close: vi.fn(), closed: false };
    vi.spyOn(window, 'open').mockReturnValue(nextTab);
    render(<OriginMigrationGuide lang="en" onClose={vi.fn()} />);
    submit();
    fireEvent.click(await screen.findByRole('link', { name: copy.continue }));
    expect(window.open).toHaveBeenCalledWith('about:blank', '_blank');
    expect(nextTab.opener).toBeNull();
    expect(tabDocument.querySelector('meta[name="referrer"]').content).toBe('no-referrer');
    await waitFor(() => expect(nextTab.location.replace).toHaveBeenCalledWith('https://qetoret.com/'));
    expect(nextTab.close).not.toHaveBeenCalled();
  });

  it('closes the reserved tab and keeps the old page when another tab saved a draft after verification', async () => {
    const nextTab = { opener: window, document: document.implementation.createHTMLDocument(), location: { replace: vi.fn() }, close: vi.fn(), closed: false };
    vi.spyOn(window, 'open').mockReturnValue(nextTab);
    state.recheck.mockResolvedValueOnce({ status: 'drafts' });
    render(<OriginMigrationGuide lang="en" onClose={vi.fn()} />);
    submit();
    fireEvent.click(await screen.findByRole('link', { name: copy.continue }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', copy.drafts);
    expect(nextTab.close).toHaveBeenCalledTimes(1);
    expect(nextTab.location.replace).not.toHaveBeenCalled();
  });

  it('explains a blocked new tab without moving or clearing the old app', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    render(<OriginMigrationGuide lang="en" onClose={vi.fn()} />);
    submit();
    fireEvent.click(await screen.findByRole('link', { name: copy.continue }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', copy.popupBlocked);
  });

  it('keeps the guide available after configuring recovery from the nudge', async () => {
    state.vault.initialized = false;
    render(<OriginMigrationBanner lang="en" />);
    fireEvent.click(screen.getByRole('button', { name: copy.open }));
    fireEvent.click(screen.getByRole('button', { name: copy.setup }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish recovery setup' }));
    expect(await screen.findByRole('dialog', { name: copy.title })).toBeTruthy();
    expect(screen.getByLabelText(copy.passphrase).disabled).toBe(false);
    expect(screen.queryByRole('link', { name: copy.continue })).toBeNull();
  });

  it('marks unavailable translations as English and leaves navigation under user control', () => {
    const onClose = vi.fn();
    render(<OriginMigrationGuide lang="ar" onClose={onClose} />);
    expect(screen.getByText(copy.intro).closest('[lang]').getAttribute('lang')).toBe('en');
    expect(screen.getByText(copy.fallbackNotice)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: copy.close }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(state.verify).not.toHaveBeenCalled();
  });
});

describe('OriginMigrationBanner', () => {
  it('appears only on the old production origin and respects the account snooze', () => {
    state.original = false;
    const { rerender } = render(<OriginMigrationBanner lang="en" />);
    expect(screen.queryByRole('button', { name: copy.open })).toBeNull();
    state.original = true;
    rerender(<OriginMigrationBanner lang="en" />);
    fireEvent.click(screen.getByRole('button', { name: copy.later }));
    expect(state.snooze).toHaveBeenCalledWith('user-1');
    expect(screen.queryByRole('button', { name: copy.open })).toBeNull();
  });

  it('starts quiet for a snoozed account', async () => {
    state.snoozed = true;
    render(<OriginMigrationBanner lang="en" />);
    await waitFor(() => expect(screen.queryByRole('button', { name: copy.open })).toBeNull());
  });
});
