// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import CommunityTermsGate from '../CommunityTermsGate';
import { acceptTerms, hasAcceptedTerms, TERMS_VERSION } from '../../lib/termsAcceptance';

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const renderGate = (userId = 'reviewer-a', extra = {}) => render(
  <CommunityTermsGate key={userId} userId={userId} lang="en" onSignOut={vi.fn()} {...extra}>
    <button type="button">Post community content</button>
  </CommunityTermsGate>,
);

describe('terms acceptance before authenticated app content', () => {
  it('withholds account routes/composers until an explicit checked acceptance', () => {
    renderGate();
    expect(screen.queryByRole('button', { name: 'Post community content' })).toBeNull();
    const continueButton = screen.getByRole('button', { name: 'Continue to Qetoret' });
    expect(continueButton.disabled).toBe(true);
    fireEvent.click(continueButton);
    expect(hasAcceptedTerms('reviewer-a')).toBe(false);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(continueButton);
    expect(screen.getByRole('button', { name: 'Post community content' })).toBeTruthy();
    expect(hasAcceptedTerms('reviewer-a')).toBe(true);
  });

  it('acceptance is account-specific and only valid for the published terms version', () => {
    acceptTerms('reviewer-a');
    expect(hasAcceptedTerms('reviewer-b')).toBe(false);
    const { unmount } = renderGate('reviewer-b');
    expect(screen.getByRole('checkbox')).toBeTruthy();
    unmount();
    localStorage.setItem('pfm_terms_acceptance:reviewer-a', JSON.stringify({ version: 'old', acceptedAt: '2026-01-01' }));
    renderGate('reviewer-a');
    expect(screen.getByRole('checkbox')).toBeTruthy();
    expect(TERMS_VERSION).toBe('2026-10-08');
  });

  it('a returning accepted account opens normally, including OAuth or email-link users', () => {
    acceptTerms('reviewer-a');
    renderGate();
    expect(screen.getByRole('button', { name: 'Post community content' })).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('offers readable terms/privacy and sign-out without requiring acceptance', () => {
    const signOut = vi.fn();
    renderGate('reviewer-a', { onSignOut: signOut });
    expect(screen.getByRole('link', { name: 'Terms of Use' }).getAttribute('href')).toBe('/terms.html');
    expect(screen.getByRole('link', { name: 'Privacy Policy' }).getAttribute('href')).toBe('/privacy.html');
    expect(screen.getByRole('link', { name: 'Request account deletion' }).getAttribute('href')).toBe('/delete-account.html');
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(signOut).toHaveBeenCalledOnce();
    expect(hasAcceptedTerms('reviewer-a')).toBe(false);
  });

  it('storage failure never skips acceptance, but permits explicitly accepted current-session use', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    const { unmount } = renderGate();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Qetoret' }));
    expect(screen.getByRole('button', { name: 'Post community content' })).toBeTruthy();
    unmount();
    renderGate();
    expect(screen.getByRole('checkbox')).toBeTruthy();
  });
});
