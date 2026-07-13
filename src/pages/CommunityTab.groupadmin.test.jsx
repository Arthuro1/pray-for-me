// @vitest-environment jsdom
//
// UI behaviour for secure multi-admin management. French is the always-loaded
// locale, so assertions go through t(). We drive the real GroupAdminModal /
// MembersModal against a stubbed community store (the store's RPC calls are
// covered separately in groupAdminRole.test.js).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';

import { GroupAdminModal, MembersModal } from './CommunityTab';
import useCommunityStore from '../store/communityStore';
import { toast } from '../store/toastStore';
import { t } from '../i18n';

const lang = 'fr';
const group = { id: 'g1', name: 'Family', invite_code: 'ABC123', created_by: 'owner1' };

// owner1 = creator, admin2 = a promoted admin, mem3 = regular member,
// me4 = the acting admin viewing the modal.
const OWNER = { user_id: 'owner1', role: 'admin', name: 'Olga Owner' };
const ADMIN = { user_id: 'admin2', role: 'admin', name: 'Adam Admin' };
const MEMBER = { user_id: 'mem3', role: 'member', name: 'Mary Member' };
const ME = { user_id: 'me4', role: 'admin', name: 'Me Myself' };
const MEMBERS = [OWNER, ADMIN, MEMBER, ME];

const memberActions = t(lang, 'memberActions');

function stubStore(overrides = {}) {
  // Build the effective fns first (so overrides win), install them, and return
  // the same references the component will call.
  const fns = {
    fetchFriends: vi.fn().mockResolvedValue({ friends: [] }),
    fetchGroupInvitees: vi.fn().mockResolvedValue({ inviteeIds: [] }),
    fetchGroupMembers: vi.fn().mockResolvedValue({ members: MEMBERS }),
    inviteToGroup: vi.fn().mockResolvedValue({}),
    removeMember: vi.fn().mockResolvedValue({}),
    setMemberRole: vi.fn().mockResolvedValue({ membership: {} }),
    renameGroup: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
  useCommunityStore.setState(fns);
  return fns;
}

// The member row is the nearest rounded card ancestor of the member's name.
// (GroupAdminModal rows use justify-between; MembersModal rows don't — both are
// the closest ".rounded-xl" container.)
function rowFor(name) {
  return screen.getByText(name).closest('.rounded-xl');
}

async function renderAdminModal() {
  render(<GroupAdminModal lang={lang} userId="me4" group={group} onClose={() => {}} />);
  await screen.findByText(OWNER.name); // members loaded
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
beforeEach(() => { vi.spyOn(toast, 'success'); vi.spyOn(toast, 'error'); });

describe('GroupAdminModal — badges & action visibility', () => {
  it('shows Owner/Admin badges, a "you" marker, and no controls for owner or self', async () => {
    stubStore();
    await renderAdminModal();

    // Owner badge on the creator; Admin badge on the non-owner admin.
    expect(within(rowFor(OWNER.name)).getByText(t(lang, 'owner'))).toBeTruthy();
    expect(within(rowFor(ADMIN.name)).getByText(t(lang, 'admin'))).toBeTruthy();
    // The regular member has no privileged badge.
    expect(within(rowFor(MEMBER.name)).queryByText(t(lang, 'admin'))).toBeNull();
    expect(within(rowFor(MEMBER.name)).queryByText(t(lang, 'owner'))).toBeNull();
    // The signed-in user is marked with "(vous)".
    expect(screen.getByText(/Me Myself \(vous\)/)).toBeTruthy();

    // Only the non-owner, non-self members (admin2 + mem3) expose an actions menu.
    expect(screen.getAllByRole('button', { name: memberActions })).toHaveLength(2);
    expect(within(rowFor(OWNER.name)).queryByRole('button', { name: memberActions })).toBeNull();
    const meRow = screen.getByText(/Me Myself \(vous\)/).closest('.rounded-xl');
    expect(within(meRow).queryByRole('button', { name: memberActions })).toBeNull();
  });

  it('offers only "Make admin" in a regular member’s action menu', async () => {
    stubStore();
    await renderAdminModal();

    fireEvent.click(within(rowFor(MEMBER.name)).getByRole('button', { name: memberActions }));
    expect(screen.getByText(t(lang, 'makeAdmin'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'removeAdminRole'))).toBeNull();
  });

  it('offers "Remove admin role" in a non-owner admin’s action menu', async () => {
    stubStore();
    await renderAdminModal();

    fireEvent.click(within(rowFor(ADMIN.name)).getByRole('button', { name: memberActions }));
    expect(screen.getByText(t(lang, 'removeAdminRole'))).toBeTruthy();
    expect(screen.queryByText(t(lang, 'makeAdmin'))).toBeNull();
  });
});

describe('GroupAdminModal — promote flow', () => {
  it('promotes a member after confirmation, refreshes the list, and toasts success', async () => {
    const { fetchGroupMembers, setMemberRole } = stubStore();
    // Second fetch (after the promote) reflects mem3 as an admin.
    fetchGroupMembers
      .mockResolvedValueOnce({ members: MEMBERS })
      .mockResolvedValue({ members: [OWNER, ADMIN, { ...MEMBER, role: 'admin' }, ME] });

    await renderAdminModal();

    fireEvent.click(within(rowFor(MEMBER.name)).getByRole('button', { name: memberActions }));
    fireEvent.click(screen.getByText(t(lang, 'makeAdmin'))); // menu item → opens confirm

    const dialog = screen.getByRole('dialog', { name: t(lang, 'promoteConfirmTitle') });
    fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'makeAdmin') }));

    await waitFor(() => expect(setMemberRole).toHaveBeenCalledWith('g1', 'mem3', 'admin'));
    // Refetched after success → Mary now carries the Admin badge.
    await waitFor(() => expect(within(rowFor(MEMBER.name)).getByText(t(lang, 'admin'))).toBeTruthy());
    expect(toast.success).toHaveBeenCalledWith(t(lang, 'memberPromoted'));
    // Confirmation dialog closed.
    expect(screen.queryByRole('dialog', { name: t(lang, 'promoteConfirmTitle') })).toBeNull();
  });

  it('demotes a non-owner admin after confirmation', async () => {
    const { setMemberRole } = stubStore();
    await renderAdminModal();

    fireEvent.click(within(rowFor(ADMIN.name)).getByRole('button', { name: memberActions }));
    fireEvent.click(screen.getByText(t(lang, 'removeAdminRole')));

    const dialog = screen.getByRole('dialog', { name: t(lang, 'demoteConfirmTitle') });
    fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'removeAdminRole') }));

    await waitFor(() => expect(setMemberRole).toHaveBeenCalledWith('g1', 'admin2', 'member'));
    expect(toast.success).toHaveBeenCalledWith(t(lang, 'adminRemoved'));
  });
});

describe('GroupAdminModal — error & loading behaviour', () => {
  it('shows a localized error toast and leaves no stale loading state on refusal', async () => {
    const { setMemberRole } = stubStore({
      setMemberRole: vi.fn().mockResolvedValue({ error: 'must_retain_admin' }),
    });
    await renderAdminModal();

    fireEvent.click(within(rowFor(ADMIN.name)).getByRole('button', { name: memberActions }));
    fireEvent.click(screen.getByText(t(lang, 'removeAdminRole')));
    const dialog = screen.getByRole('dialog', { name: t(lang, 'demoteConfirmTitle') });
    fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'removeAdminRole') }));

    await waitFor(() => expect(setMemberRole).toHaveBeenCalled());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(t(lang, 'groupMustRetainAdmin')));
    // Loading cleared: the admin row's actions menu is back (no stuck spinner).
    await waitFor(() => expect(within(rowFor(ADMIN.name)).getByRole('button', { name: memberActions })).toBeTruthy());
  });

  it('disables the affected member’s actions while the request is in flight', async () => {
    let resolve;
    const pending = new Promise((r) => { resolve = r; });
    stubStore({ setMemberRole: vi.fn().mockReturnValue(pending) });
    await renderAdminModal();

    fireEvent.click(within(rowFor(MEMBER.name)).getByRole('button', { name: memberActions }));
    fireEvent.click(screen.getByText(t(lang, 'makeAdmin')));
    const dialog = screen.getByRole('dialog', { name: t(lang, 'promoteConfirmTitle') });
    fireEvent.click(within(dialog).getByRole('button', { name: t(lang, 'makeAdmin') }));

    // While pending, mem3's menu is replaced by a spinner → only admin2's remains.
    await waitFor(() => expect(screen.getAllByRole('button', { name: memberActions })).toHaveLength(1));

    resolve({ membership: {} }); // let it finish so the test doesn't leak a pending promise
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });
});

describe('MembersModal — read-only', () => {
  it('distinguishes owner/admin/member and self, with no role controls', async () => {
    stubStore();
    render(<MembersModal lang={lang} group={group} userId="me4" onClose={() => {}} />);
    await screen.findByText(OWNER.name);

    expect(within(rowFor(OWNER.name)).getByText(t(lang, 'owner'))).toBeTruthy();
    expect(within(rowFor(ADMIN.name)).getByText(t(lang, 'admin'))).toBeTruthy();
    expect(within(rowFor(MEMBER.name)).queryByText(t(lang, 'admin'))).toBeNull();
    expect(screen.getByText(/Me Myself \(vous\)/)).toBeTruthy();
    // No management affordances in the read-only list.
    expect(screen.queryByRole('button', { name: memberActions })).toBeNull();
    expect(screen.queryByText(t(lang, 'makeAdmin'))).toBeNull();
  });
});
