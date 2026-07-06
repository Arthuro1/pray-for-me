// @vitest-environment jsdom
//
// The Privacy Center is a plain-language explanation of storage & sharing, and
// opening it records a content-free impression so "understanding your privacy"
// can be measured.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

vi.mock('../lib/analytics', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, track: vi.fn() };
});

import PrivacyCenter from './PrivacyCenter';
import { track, EVENTS } from '../lib/analytics';
import { t } from '../i18n';

const lang = 'fr';
afterEach(cleanup);

describe('PrivacyCenter', () => {
  it('renders the privacy sections and records the open event', () => {
    render(<PrivacyCenter lang={lang} onClose={() => {}} />);
    expect(screen.getByText(t(lang, 'privacyCenterTitle'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'pcPrivateTitle'))).toBeTruthy();
    expect(track).toHaveBeenCalledWith(EVENTS.PRIVACY_CENTER_OPENED, expect.objectContaining({ source: 'settings' }));
  });
});
