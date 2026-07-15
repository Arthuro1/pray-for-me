// @vitest-environment jsdom
//
// The Privacy Center is a plain-language explanation of storage & sharing, and
// opening it records a content-free impression so "understanding your privacy"
// can be measured.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('../../lib/analytics', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, track: vi.fn() };
});

import PrivacyCenter from '../PrivacyCenter';
import { track, EVENTS } from '../../lib/analytics';
import { t } from '../../i18n';

const lang = 'fr';
afterEach(cleanup);

describe('PrivacyCenter', () => {
  it('renders the privacy sections and records the open event', () => {
    render(<PrivacyCenter lang={lang} onClose={() => {}} />);
    expect(screen.getByText(t(lang, 'privacyCenterTitle'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'pcPrivateTitle'))).toBeTruthy();
    expect(track).toHaveBeenCalledWith(EVENTS.PRIVACY_CENTER_OPENED, expect.objectContaining({ source: 'settings' }));
  });

  it('describes private vs community encryption honestly (does not overpromise)', () => {
    render(<PrivacyCenter lang={lang} onClose={() => {}} />);
    // Both private and community sections are present and distinct.
    expect(screen.getByText(t(lang, 'pcPrivateTitle'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'pcSharedTitle'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'pcRecoveryTitle'))).toBeTruthy();

    // The community copy is honest: readable by the group's members, and it
    // must NOT claim only-you-can-read-everything for shared prayers.
    const shared = t(lang, 'pcSharedBody');
    expect(shared.toLowerCase()).toContain('membres du groupe');
    expect(shared.toLowerCase()).not.toContain('toi seul');

    // Reminders are generic by default (opt-in for detail), not "never".
    expect(t(lang, 'pcPushBody').toLowerCase()).toContain('par défaut');
  });
});
