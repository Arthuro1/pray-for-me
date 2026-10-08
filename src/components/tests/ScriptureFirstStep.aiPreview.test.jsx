// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const state = vi.hoisted(() => ({ settings: { language: 'fr', aiSendDescription: false }, consent: true }));
const getScriptureGuidance = vi.hoisted(() => vi.fn(async () => ({ guidance: null, error: 'Try again' })));
vi.mock('../../store/prayerStore', () => ({
  default: (selector) => selector({ settings: state.settings, updateSettings: vi.fn(), addPrayerPoint: vi.fn(), setScriptureGuidance: vi.fn() }),
}));
vi.mock('../../lib/aiConsent', () => ({ hasAiConsent: () => state.consent }));
vi.mock('../../scriptureGuidance', () => ({ getScriptureGuidance }));
vi.mock('../AiConsentModal', () => ({ default: ({ onAccept, onCancel }) => <div role="dialog" aria-label="Consent"><button onClick={() => { state.consent = true; onAccept(); }}>Accept consent</button><button onClick={onCancel}>Cancel consent</button></div> }));
vi.mock('../shared/AiDisclaimer', () => ({ default: () => null }));
vi.mock('../VerseAccordion', () => ({ default: () => null }));

import ScriptureFirstStep from '../ScriptureFirstStep';
import { t } from '../../i18n';

afterEach(cleanup);
beforeEach(() => { state.consent = true; getScriptureGuidance.mockClear(); });

describe('ScriptureFirstStep outgoing review', () => {
  it('does not request guidance before Send and reviews again before a retry', async () => {
    render(<ScriptureFirstStep prayerId="p1" title="Ma prière" description="Background" lang="fr" onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: t('fr', 'findScripture') }));
    expect(screen.getByRole('dialog', { name: t('fr', 'aiPreviewTitle') })).toBeTruthy();
    expect(getScriptureGuidance).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: t('fr', 'aiPreviewSend') }));
    await waitFor(() => expect(getScriptureGuidance).toHaveBeenCalledTimes(1));
    expect(getScriptureGuidance.mock.calls[0][0].reviewedInput).toEqual({ title: 'Ma prière', description: '', update: '' });
    fireEvent.click(await screen.findByRole('button', { name: t('fr', 'retryScripture') }));
    expect(screen.getByRole('dialog', { name: t('fr', 'aiPreviewTitle') })).toBeTruthy();
    expect(getScriptureGuidance).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: t('fr', 'cancel') }));
    expect(getScriptureGuidance).toHaveBeenCalledTimes(1);
  });

  it('keeps provider consent before the preview and Escape closes only the preview', () => {
    state.consent = false;
    const onClose = vi.fn();
    render(<ScriptureFirstStep prayerId="p1" title="Ma prière" lang="fr" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: t('fr', 'findScripture') }));
    expect(screen.getByRole('dialog', { name: 'Consent' })).toBeTruthy();
    expect(screen.queryByRole('dialog', { name: t('fr', 'aiPreviewTitle') })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Accept consent' }));
    expect(screen.getByRole('dialog', { name: t('fr', 'aiPreviewTitle') })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: t('fr', 'aiPreviewTitle') })).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(getScriptureGuidance).not.toHaveBeenCalled();
  });
});
