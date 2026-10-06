// @vitest-environment jsdom
//
// "Carry this prayer" is a deliberate act of intercession, not a like: the
// button names the act, says when you are already carrying the prayer, and the
// count is plain information — never a rank.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import PrayTogetherCard from './PrayTogetherCard';
import useCommunityStore from '../store/communityStore';
import { t, tp } from '../i18n';

const lang = 'fr';
afterEach(cleanup);
beforeEach(() => {
  useCommunityStore.setState({ fetchReactors: vi.fn(async () => ({ reactors: [] })) });
});

const renderCard = async (props) => {
  render(<PrayTogetherCard communityPrayer={{ id: 'c1' }} lang={lang} user={{ id: 'u1' }} onTogglePraying={() => {}} busy={false} {...props} />);
  await act(async () => { await Promise.resolve(); });
};

describe('PrayTogetherCard — carry this prayer', () => {
  it('invites the reader to carry the prayer', async () => {
    await renderCard({ count: 0, hasReacted: false });
    const button = screen.getByRole('button', { name: t(lang, 'carryThisPrayer') });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText(t(lang, 'beFirstToPray'))).toBeTruthy();
  });

  it('says plainly when you are carrying it, and how many carry it', async () => {
    await renderCard({ count: 3, hasReacted: true });
    expect(screen.getByRole('button', { name: t(lang, 'carryingThisPrayer') }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(tp(lang, 'carryCount', 3))).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/trending|top|classement|tendance/i);
  });
});
