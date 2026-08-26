// @vitest-environment jsdom
//
// Who may restyle a group, and what actually gets written. The client rule must
// match the "Admins can update their group" RLS policy: admins and the creator,
// nobody else. Driven against the real GroupAdminModal with a stubbed store.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

import { GroupAdminModal, MembersModal } from './CommunityTab';
import useCommunityStore from '../store/communityStore';
import { toast } from '../store/toastStore';
import { t } from '../i18n';
import { AVATAR_COLORS, fallbackAvatarColor } from '../lib/avatar';

const lang = 'fr';
const ME = 'me4';
const baseGroup = { id: 'g1', name: 'Famille', invite_code: 'ABC123', created_by: 'owner1' };

function stubStore(overrides = {}) {
  const fns = {
    fetchFriends: vi.fn().mockResolvedValue({ friends: [] }),
    fetchGroupInvitees: vi.fn().mockResolvedValue({ inviteeIds: [] }),
    fetchGroupMembers: vi.fn().mockResolvedValue({ members: [{ user_id: 'mem3', role: 'member', name: 'Mary Member' }] }),
    inviteToGroup: vi.fn().mockResolvedValue({}),
    removeMember: vi.fn().mockResolvedValue({}),
    setMemberRole: vi.fn().mockResolvedValue({ membership: {} }),
    renameGroup: vi.fn().mockResolvedValue({}),
    updateGroupAvatar: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
  useCommunityStore.setState(fns);
  return fns;
}

async function renderModal(group) {
  render(<GroupAdminModal lang={lang} userId={ME} group={group} onClose={() => {}} />);
  await screen.findByText('Mary Member');
}

const editorHeading = () => screen.queryByText(t(lang, 'groupAvatar'));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
beforeEach(() => { vi.spyOn(toast, 'success'); vi.spyOn(toast, 'error'); });

describe('group avatar editing permissions', () => {
  it('offers the editor to an admin', async () => {
    stubStore();
    await renderModal({ ...baseGroup, role: 'admin' });
    expect(editorHeading()).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: t(lang, 'avatarSymbol') })).toBeTruthy();
  });

  it('offers the editor to the group’s creator even without the admin flag', async () => {
    stubStore();
    await renderModal({ ...baseGroup, role: 'member', created_by: ME });
    expect(editorHeading()).toBeTruthy();
  });

  it('hides it from a plain member — no symbol or colour control at all', async () => {
    stubStore();
    await renderModal({ ...baseGroup, role: 'member' });
    expect(editorHeading()).toBeNull();
    expect(screen.queryByRole('radiogroup', { name: t(lang, 'avatarSymbol') })).toBeNull();
    expect(screen.queryByRole('radiogroup', { name: t(lang, 'avatarColor') })).toBeNull();
    // Rename stays available; only the avatar section is withheld.
    expect(screen.getByText(t(lang, 'renameGroup'))).toBeTruthy();
  });
});

describe('saving a group avatar', () => {
  it('writes the chosen preset and confirms it', async () => {
    const { updateGroupAvatar } = stubStore();
    await renderModal({ ...baseGroup, role: 'admin' });

    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'avatarIconChurch') }));
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'avatarColorTeal') }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'avatarSave') }));

    await waitFor(() => expect(updateGroupAvatar).toHaveBeenCalledWith('g1', {
      type: 'icon', value: 'church', color: AVATAR_COLORS[3], photoPath: null,
    }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(t(lang, 'avatarUpdated')));
  });

  it('surfaces a refusal instead of pretending it saved', async () => {
    const { updateGroupAvatar } = stubStore({ updateGroupAvatar: vi.fn().mockResolvedValue({ error: 'not_group_admin' }) });
    await renderModal({ ...baseGroup, role: 'admin' });

    fireEvent.click(screen.getByRole('button', { name: t(lang, 'avatarSave') }));
    await waitFor(() => expect(updateGroupAvatar).toHaveBeenCalled());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(t(lang, 'errorGeneric')));
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('groups that predate the avatar columns', () => {
  it('previews a deterministic tile for a group with no stored avatar', async () => {
    stubStore();
    await renderModal({ ...baseGroup, role: 'admin' });
    const preview = screen.getByRole('img', { name: t(lang, 'avatarPreview') });
    expect(preview.querySelector('svg')).not.toBeNull(); // a group falls back to a symbol
    expect(rgbToHex(preview.style.background)).toBe(fallbackAvatarColor('famille'));
  });

  it('shows the group on the invite preview without any avatar columns', async () => {
    useCommunityStore.setState({
      fetchGroupMembers: vi.fn().mockResolvedValue({ members: [] }),
    });
    render(<MembersModal lang={lang} group={baseGroup} userId={ME} onClose={() => {}} />);
    await waitFor(() => expect(screen.getAllByText(baseGroup.name).length).toBeGreaterThan(0));
    const tiles = document.querySelectorAll('.avatar');
    expect(tiles.length).toBeGreaterThan(0);
    expect(rgbToHex(tiles[0].style.background)).toBe(fallbackAvatarColor('famille'));
  });
});

function rgbToHex(value) {
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(value || '');
  if (!m) return value;
  return `#${[1, 2, 3].map((i) => Number(m[i]).toString(16).padStart(2, '0')).join('')}`;
}
