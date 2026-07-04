// @vitest-environment jsdom
//
// Pins the soft-gate contract at the DOM level: the tag LABELS Supporter-tier
// features but must never render for free features (a free control is never even
// visually implied to be gated). See lib/plan.js.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import SupporterTag from './SupporterTag';
import { FEATURES } from '../lib/plan';
import { t } from '../i18n';

afterEach(cleanup);

describe('SupporterTag', () => {
  it('labels a Supporter-tier feature', () => {
    render(<SupporterTag feature={FEATURES.ADVANCED_SCHEDULING} lang="fr" />);
    expect(screen.getByText(t('fr', 'supporterTag'))).toBeTruthy();
  });

  it('renders nothing for a free feature (never gates it)', () => {
    const { container } = render(<SupporterTag feature={FEATURES.PRAYER_JOURNAL} lang="fr" />);
    expect(container.firstChild).toBeNull();
  });
});
