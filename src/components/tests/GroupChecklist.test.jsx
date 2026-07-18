// @vitest-environment jsdom
//
// First-group checklist (leader-only card): steps tick off from live data,
// each open step is a shortcut to the group's real action, the card can be
// dismissed, and it retires itself once the group is up and praying.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

import GroupChecklist from '../GroupChecklist';
import { MembersModal } from '../../pages/CommunityTab';
import useCommunityStore from '../../store/communityStore';
import { dismissChecklist, checklistFlags } from '../../lib/groupChecklist';
import { t } from '../../i18n';

const lang = 'fr';
const group = { id: 'g1', name: 'Groupe Test', role: 'admin' };

const members = (n) => Array.from({ length: n }, (_, i) => ({ user_id: `u${i}`, role: i === 0 ? 'admin' : 'member', name: `M${i}` }));

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  useCommunityStore.setState({ fetchGroupMembers: vi.fn(async () => ({ members: members(1) })) });
});

const renderChecklist = (props = {}) =>
  render(
    <GroupChecklist
      lang={lang}
      group={group}
      requestCount={0}
      hasPrayed={false}
      onInvite={() => {}}
      onAddRequest={() => {}}
      onPray={() => {}}
      {...props}
    />
  );

describe('GroupChecklist — progression', () => {
  it('shows all three steps for a fresh solo group, wired to the page actions', async () => {
    const onInvite = vi.fn();
    const onAddRequest = vi.fn();
    renderChecklist({ onInvite, onAddRequest });
    expect(await screen.findByText(t(lang, 'checklistTitle'))).toBeTruthy();
    fireEvent.click(screen.getByText(t(lang, 'checklistInvite')));
    expect(onInvite).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText(t(lang, 'checklistRequest')));
    expect(onAddRequest).toHaveBeenCalledTimes(1);
  });

  it('marks the invite step done once a second member joined', async () => {
    useCommunityStore.setState({ fetchGroupMembers: vi.fn(async () => ({ members: members(2) })) });
    renderChecklist();
    const invite = (await screen.findByText(t(lang, 'checklistInvite'))).closest('button');
    expect(invite.disabled).toBe(true); // completed steps are inert
    const request = screen.getByText(t(lang, 'checklistRequest')).closest('button');
    expect(request.disabled).toBe(false);
  });

  it('retires itself automatically once every step is complete', async () => {
    useCommunityStore.setState({ fetchGroupMembers: vi.fn(async () => ({ members: members(2) })) });
    const { container } = renderChecklist({ requestCount: 2, hasPrayed: true });
    await waitFor(() => expect(container.firstChild).toBeNull());
  });
});

describe('GroupChecklist — valid sequencing', () => {
  it('SAYS "Add a request first" while the group has no request — never an unusable Begin praying', async () => {
    const onPray = vi.fn();
    const onAddRequest = vi.fn();
    renderChecklist({ requestCount: 0, onPray, onAddRequest });
    const row = await screen.findByText(t(lang, 'checklistAddRequestFirst'));
    expect(screen.queryByText(t(lang, 'checklistPray'))).toBeNull();
    fireEvent.click(row);
    expect(onPray).not.toHaveBeenCalled();
    expect(onAddRequest).toHaveBeenCalledTimes(1);
  });

  it('turns into "Begin praying" as soon as the first request exists', async () => {
    const { rerender } = renderChecklist({ requestCount: 0 });
    expect(await screen.findByText(t(lang, 'checklistAddRequestFirst'))).toBeTruthy();
    rerender(
      <GroupChecklist lang={lang} group={group} requestCount={1} hasPrayed={false}
        onInvite={() => {}} onAddRequest={() => {}} onPray={() => {}} />
    );
    expect(screen.getByText(t(lang, 'checklistPray'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'checklistAddRequestFirst'))).toBeNull();
  });

  it('with a request present, "Begin praying" opens the pray action but does NOT complete the step by itself', async () => {
    const onPray = vi.fn();
    renderChecklist({ requestCount: 1, onPray });
    fireEvent.click(await screen.findByText(t(lang, 'checklistPray')));
    expect(onPray).toHaveBeenCalledTimes(1);
    // Merely acting (opening a detail page) records nothing — only a genuine
    // prayer action (hasPrayed) or a member reaction completes the step.
    expect(checklistFlags('g1').prayed).toBeUndefined();
    expect(screen.getByText(t(lang, 'checklistPray')).closest('button').disabled).toBe(false);
  });

  it('a genuine prayer action (hasPrayed) completes the step', async () => {
    renderChecklist({ requestCount: 1, hasPrayed: true });
    const pray = (await screen.findByText(t(lang, 'checklistPray'))).closest('button');
    expect(pray.disabled).toBe(true);
  });
});

describe('MembersModal — invitation completion', () => {
  const modalGroup = { ...group, invite_code: 'abc123', created_by: 'u0' };

  it('merely opening the members modal fires no invite action', async () => {
    const onInviteAction = vi.fn();
    render(<MembersModal lang={lang} group={modalGroup} userId="u0" onClose={() => {}} onInviteAction={onInviteAction} />);
    expect(await screen.findByText(t(lang, 'shareInviteLink'))).toBeTruthy();
    expect(onInviteAction).not.toHaveBeenCalled();
  });

  it('copying/sharing the invite link records the invitation', async () => {
    const onInviteAction = vi.fn();
    Object.assign(navigator, { clipboard: { writeText: vi.fn(async () => {}) } });
    render(<MembersModal lang={lang} group={modalGroup} userId="u0" onClose={() => {}} onInviteAction={onInviteAction} />);
    fireEvent.click(await screen.findByText(t(lang, 'shareInviteLink')));
    await waitFor(() => expect(onInviteAction).toHaveBeenCalled());
  });

  it('revealing the QR code records the invitation', async () => {
    const onInviteAction = vi.fn();
    render(<MembersModal lang={lang} group={modalGroup} userId="u0" onClose={() => {}} onInviteAction={onInviteAction} />);
    fireEvent.click(await screen.findByLabelText(t(lang, 'showQrCode')));
    expect(onInviteAction).toHaveBeenCalledTimes(1);
  });

  it('the QR control is a named, 44px disclosure — not an icon with only a tooltip', async () => {
    render(<MembersModal lang={lang} group={modalGroup} userId="u0" onClose={() => {}} />);
    const qr = await screen.findByRole('button', { name: t(lang, 'showQrCode') });
    expect(qr.className).toMatch(/w-11/);
    expect(qr.className).toMatch(/h-11/);
    expect(qr.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(qr);
    expect(qr.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(qr.getAttribute('aria-controls'))).toBeTruthy();
  });

  it('gives the modal close control a name and a 44px target', async () => {
    render(<MembersModal lang={lang} group={modalGroup} userId="u0" onClose={() => {}} />);
    const close = await screen.findByRole('button', { name: t(lang, 'close') });
    expect(close.className).toMatch(/w-11/);
    expect(close.className).toMatch(/h-11/);
  });
});

// A member joining is a server event with no client trigger. Rather than poll,
// the card re-checks when the app comes back to the foreground — the moment a
// leader returns after sharing the link.
describe('GroupChecklist — the Invite step reacts when a member joins', () => {
  it('completes on app focus, in place, without remounting the page', async () => {
    renderChecklist();
    const invite = await screen.findByText(t(lang, 'checklistInvite'));
    expect(invite.closest('button').disabled).toBe(false);

    useCommunityStore.setState({ fetchGroupMembers: vi.fn(async () => ({ members: members(2) })) });
    fireEvent(window, new Event('focus'));

    await waitFor(() => expect(invite.closest('button').disabled).toBe(true));
    expect(invite.isConnected).toBe(true); // updated, not re-created
  });

  it('does not poll — no timer, and no request until something happens', async () => {
    vi.useFakeTimers();
    try {
      renderChecklist();
      await vi.waitFor(() => expect(useCommunityStore.getState().fetchGroupMembers).toHaveBeenCalledTimes(1));
      vi.advanceTimersByTime(5 * 60 * 1000);
      expect(useCommunityStore.getState().fetchGroupMembers).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops listening once the step is done, so a live group (and Low data mode) costs nothing', async () => {
    useCommunityStore.setState({ fetchGroupMembers: vi.fn(async () => ({ members: members(2) })) });
    renderChecklist({ requestCount: 1 });
    await screen.findByText(t(lang, 'checklistInvite'));
    const calls = useCommunityStore.getState().fetchGroupMembers.mock.calls.length;

    fireEvent(window, new Event('focus'));
    await Promise.resolve();
    expect(useCommunityStore.getState().fetchGroupMembers.mock.calls.length).toBe(calls);
  });

  it('a refresh that finds no new member leaves Invite open', async () => {
    renderChecklist();
    const invite = await screen.findByText(t(lang, 'checklistInvite'));
    fireEvent(window, new Event('focus'));
    await waitFor(() => expect(useCommunityStore.getState().fetchGroupMembers.mock.calls.length).toBeGreaterThan(1));
    expect(invite.closest('button').disabled).toBe(false);
  });
});

describe('GroupChecklist — dismissal', () => {
  it('the dismiss control hides the card and it never comes back for this group', async () => {
    renderChecklist();
    fireEvent.click(await screen.findByLabelText(t(lang, 'checklistDismiss')));
    expect(screen.queryByText(t(lang, 'checklistTitle'))).toBeNull();
    // A re-render (new visit) stays hidden.
    cleanup();
    const { container } = renderChecklist();
    await waitFor(() => expect(useCommunityStore.getState().fetchGroupMembers).toHaveBeenCalled());
    expect(container.textContent).not.toContain(t(lang, 'checklistTitle'));
  });

  it('stays hidden when previously dismissed via the lib', async () => {
    dismissChecklist('g1');
    const { container } = renderChecklist();
    await waitFor(() => expect(useCommunityStore.getState().fetchGroupMembers).toHaveBeenCalled());
    expect(container.textContent).not.toContain(t(lang, 'checklistTitle'));
  });
});
