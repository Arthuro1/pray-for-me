// @vitest-environment jsdom
//
// Onboarding is deliberately short and warm, ending on "add your first prayer".
// It must NEVER surface a Supporter prompt — advanced tools and giving are
// introduced later, once the first prayer exists.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Onboarding from './Onboarding';
import { t } from '../i18n';

const lang = 'fr';
afterEach(cleanup);

// Onboarding must never mention Supporter/Free/Premium/pricing/donations, in any
// language — assert on the rendered text, not on (now-removed) supporter keys.
const expectNoSupporterPrompt = () => {
  expect(document.body.textContent).not.toMatch(/supporter|premium|abonnement/i);
};

describe('Onboarding', () => {
  it('walks 3 steps to "add your first prayer" with no Supporter prompt', () => {
    const onFinish = vi.fn();
    const onAddPrayer = vi.fn();
    render(<Onboarding lang={lang} onFinish={onFinish} onAddPrayer={onAddPrayer} />);

    expect(screen.getByText(t(lang, 'onboardWelcomeTitle'))).toBeTruthy();
    expectNoSupporterPrompt();

    fireEvent.click(screen.getByText(t(lang, 'onboardNext')));
    expectNoSupporterPrompt();
    fireEvent.click(screen.getByText(t(lang, 'onboardNext')));
    expectNoSupporterPrompt();

    // Final step: the primary CTA is adding a prayer, not upgrading.
    const addFirst = screen.getByText(t(lang, 'onboardAddFirst'));
    expect(addFirst).toBeTruthy();
    fireEvent.click(addFirst);
    expect(onFinish).toHaveBeenCalled();
    expect(onAddPrayer).toHaveBeenCalled();
  });
});
