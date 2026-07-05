// @vitest-environment jsdom
//
// The Supporter modal DESCRIBES the membership; it must reassure that the core
// app stays free and show the honest "no billing wired yet" state.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import SupporterModal from './SupporterModal';
import { t } from '../i18n';

const lang = 'fr';
afterEach(cleanup);

describe('SupporterModal', () => {
  it('describes the membership and keeps the app free (no billing yet)', () => {
    render(<SupporterModal lang={lang} onClose={() => {}} />);
    expect(screen.getByText(t(lang, 'supporterTitle'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'supporterFreeNote'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'supporterComingSoon'))).toBeTruthy();
  });
});
