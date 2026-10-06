// @vitest-environment jsdom
//
// The Share sheet a plan opens from the catalogue, a running plan and a
// finished one. French is the always-loaded locale, so copy goes through t().
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

const api = vi.hoisted(() => ({
  fetchPlanShareStatus: vi.fn(),
  createPlanShareLink: vi.fn(),
  stopPlanShareLink: vi.fn(),
}));
vi.mock('../../lib/planShareApi', () => api);

const { trackSpy } = vi.hoisted(() => ({ trackSpy: vi.fn() }));
vi.mock('../../lib/analytics', () => ({
  track: trackSpy,
  EVENTS: { PLAN_LINK_SHARED: 'plan_link_shared' },
}));

// The in-app half has its own store-backed panel; only its entry is under test.
vi.mock('./PlanInvitePanel', () => ({ default: () => <div data-testid="invite-panel" /> }));

import PlanShareSheet from './PlanShareSheet';
import { PLANS } from '../../content/prayerPlans';
import { t, tp } from '../../i18n';

const lang = 'fr';
const plan = PLANS.find((p) => p.id === 'altar7');
const TOKEN = 'AbCdEfGhIjKlMnOpQrStUv';

function renderSheet() {
  const onClose = vi.fn();
  render(<PlanShareSheet plan={plan} lang={lang} userId="u1" onClose={onClose} />);
  return { onClose };
}

beforeEach(() => {
  api.fetchPlanShareStatus.mockResolvedValue({ data: { activeToken: null, stopped: false, joinCount: 0, friendNames: [] } });
  api.createPlanShareLink.mockResolvedValue({ data: TOKEN });
  api.stopPlanShareLink.mockResolvedValue({ data: null });
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(async () => {}) }, configurable: true });
});

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('PlanShareSheet', () => {
  it('mints the link on first open and says who can see what', async () => {
    renderSheet();
    await screen.findByText(new RegExp(`/plans/altar7/${TOKEN}\\?lang=fr`));
    expect(api.createPlanShareLink).toHaveBeenCalledWith('altar7');
    expect(screen.getByText(t(lang, 'planShareLinkNote'))).toBeTruthy();
    expect(screen.getByText(t(lang, 'planShareJoinedNone'))).toBeTruthy();
  });

  it('reuses a live link instead of minting another', async () => {
    api.fetchPlanShareStatus.mockResolvedValue({ data: { activeToken: TOKEN, stopped: false, joinCount: 3, friendNames: ['Marie Curie'] } });
    renderSheet();
    await screen.findByText(new RegExp(TOKEN));
    expect(api.createPlanShareLink).not.toHaveBeenCalled();
    expect(screen.getByText(new RegExp(tp(lang, 'planShareJoined', 3).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeTruthy();
    expect(screen.getByText(new RegExp('Marie Curie'))).toBeTruthy();
  });

  it('copies the link', async () => {
    renderSheet();
    await screen.findByText(new RegExp(TOKEN));
    fireEvent.click(screen.getByText(t(lang, 'planShareCopy')));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining(`/plans/altar7/${TOKEN}`)));
    expect(trackSpy).toHaveBeenCalledWith('plan_link_shared', { channel: 'copy' });
  });

  it('asks before stopping, then shows the link as off until a new one is asked for', async () => {
    renderSheet();
    await screen.findByText(new RegExp(TOKEN));
    fireEvent.click(screen.getByText(t(lang, 'planShareStop')));
    expect(screen.getByRole('dialog', { name: t(lang, 'planShareStopTitle') })).toBeTruthy();
    expect(api.stopPlanShareLink).not.toHaveBeenCalled();

    const confirm = screen.getAllByText(t(lang, 'planShareStop')).at(-1);
    fireEvent.click(confirm);
    await screen.findByText(t(lang, 'planShareStopped'));
    expect(api.stopPlanShareLink).toHaveBeenCalledWith('altar7');
    expect(screen.queryByText(new RegExp(TOKEN))).toBeNull();

    api.createPlanShareLink.mockResolvedValue({ data: 'ZyXwVuTsRqPoNmLkJiHgFe' });
    fireEvent.click(screen.getByText(t(lang, 'planShareNewLink')));
    await screen.findByText(/ZyXwVuTsRqPoNmLkJiHgFe/);
  });

  it('does not re-mint a link that was stopped earlier', async () => {
    api.fetchPlanShareStatus.mockResolvedValue({ data: { activeToken: null, stopped: true, joinCount: 1, friendNames: [] } });
    renderSheet();
    await screen.findByText(t(lang, 'planShareStopped'));
    expect(api.createPlanShareLink).not.toHaveBeenCalled();
  });

  it('falls back to a plain plan link when sharing links are unreachable', async () => {
    api.fetchPlanShareStatus.mockResolvedValue({ error: new Error('function does not exist') });
    renderSheet();
    await screen.findByText(t(lang, 'planShareLinkNotePlain'));
    expect(screen.getByText(/\/plans\/altar7\?lang=fr/)).toBeTruthy();
    // A plain link counts nothing and has nothing to stop.
    expect(screen.queryByText(t(lang, 'planShareJoinedNone'))).toBeNull();
    expect(screen.queryByText(t(lang, 'planShareStop'))).toBeNull();
  });

  it('opens the in-app invite and the QR code in place', async () => {
    renderSheet();
    await screen.findByText(new RegExp(TOKEN));
    fireEvent.click(screen.getByText(t(lang, 'showQrCode')));
    expect(screen.getByText(t(lang, 'planShareScan'))).toBeTruthy();
    fireEvent.click(screen.getByLabelText(t(lang, 'backBtn')));
    fireEvent.click(screen.getByText(t(lang, 'planShareInviteFriends')));
    expect(screen.getByTestId('invite-panel')).toBeTruthy();
  });
});
