// @vitest-environment jsdom
//
// Onboarding is deliberately short and warm, ending on "add your first prayer".
// It must NEVER surface a Supporter prompt — advanced tools and giving are
// introduced later, once the first prayer exists.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Onboarding from '../Onboarding';
import { t } from '../../i18n';

const lang = 'fr';
afterEach(cleanup);

// Onboarding must never mention Supporter/Free/Premium/pricing/donations, in any
// language — assert on the rendered text, not on (now-removed) supporter keys.
const expectNoSupporterPrompt = () => {
  expect(document.body.textContent).not.toMatch(/supporter|premium|abonnement/i);
};

// Steps between the first and the last CTA. Advancing through all of them and
// landing on "add your first prayer" proves onboarding never GATES prayer
// creation behind vault/recovery setup (acceptance criterion #12/onboarding).
const NEXT_CLICKS = 3; // Welcome → Pray → Privacy → Remind (last)

describe('Onboarding', () => {
  it('walks to "add your first prayer" with no Supporter prompt and no setup gate', () => {
    const onFinish = vi.fn();
    const onAddPrayer = vi.fn();
    render(<Onboarding lang={lang} onFinish={onFinish} onAddPrayer={onAddPrayer} />);

    expect(screen.getByText(t(lang, 'onboardWelcomeTitle'))).toBeTruthy();
    expectNoSupporterPrompt();

    for (let i = 0; i < NEXT_CLICKS; i++) {
      fireEvent.click(screen.getByText(t(lang, 'onboardNext')));
      expectNoSupporterPrompt();
    }

    // Final step: the primary CTA is adding a prayer, not setting up encryption.
    const addFirst = screen.getByText(t(lang, 'onboardAddFirst'));
    expect(addFirst).toBeTruthy();
    fireEvent.click(addFirst);
    expect(onFinish).toHaveBeenCalled();
    expect(onAddPrayer).toHaveBeenCalled();
  });

  it('reassures that prayers are encrypted by default (recovery is optional/later)', () => {
    render(<Onboarding lang={lang} onFinish={vi.fn()} onAddPrayer={vi.fn()} />);
    fireEvent.click(screen.getByText(t(lang, 'onboardNext'))); // → Pray
    fireEvent.click(screen.getByText(t(lang, 'onboardNext'))); // → Privacy
    expect(screen.getByText(t(lang, 'onboardPrivacyTitle'))).toBeTruthy();
    // Honest framing: encrypted by default, recovery is a "later" option.
    expect(t(lang, 'onboardPrivacyBody').toLowerCase()).toContain('par défaut');
    expect(t(lang, 'onboardPrivacyBody').toLowerCase()).toContain('récupération');
  });
});
