// Store-level coverage for the secure multi-admin actions. The real
// authorization lives in the Postgres RPCs (set_group_member_role /
// remove_group_member); here we prove the store calls those RPCs with only the
// group + target + role (never an acting-user id), maps raised errors through
// toError, and never optimistically mutates role state client-side.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { rpcMock, revokeMock } = vi.hoisted(() => ({ rpcMock: vi.fn(), revokeMock: vi.fn() }));

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
    // The two actions under test only touch supabase.rpc; from()/auth are stubs
    // so the module imports cleanly.
    from: () => ({ select: () => ({ eq: () => ({}) }) }),
    auth: { getUser: async () => ({ data: { user: null } }) },
  },
}));

vi.mock('../lib/crypto/groupKeys', () => ({
  ensureGroupKey: vi.fn(),
  groupKeyResolver: vi.fn(),
  revokeMemberAndRotate: revokeMock,
}));

import useCommunityStore from './communityStore';

beforeEach(() => { rpcMock.mockReset(); revokeMock.mockReset(); });

describe('setMemberRole', () => {
  it('promotes via the set_group_member_role RPC and returns the membership', async () => {
    rpcMock.mockResolvedValue({ data: { group_id: 'g1', user_id: 'u2', role: 'admin' }, error: null });

    const res = await useCommunityStore.getState().setMemberRole('g1', 'u2', 'admin');

    expect(rpcMock).toHaveBeenCalledWith('set_group_member_role', {
      p_group_id: 'g1', p_target_user_id: 'u2', p_role: 'admin',
    });
    expect(res.membership).toEqual({ group_id: 'g1', user_id: 'u2', role: 'admin' });
    expect(res.error).toBeUndefined();
  });

  it('never sends an acting-user id as authorization data', async () => {
    rpcMock.mockResolvedValue({ data: {}, error: null });
    await useCommunityStore.getState().setMemberRole('g1', 'u2', 'member');
    const args = rpcMock.mock.calls[0][1];
    // Only the three explicit params — the acting user is auth.uid() server-side.
    expect(Object.keys(args).sort()).toEqual(['p_group_id', 'p_role', 'p_target_user_id']);
  });

  it('maps a raised RPC error to { error: message } via toError', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'creator_cannot_be_demoted' } });
    const res = await useCommunityStore.getState().setMemberRole('g1', 'owner1', 'member');
    expect(res.error).toBe('creator_cannot_be_demoted');
  });

  it('does not optimistically mutate any group role in state on failure', async () => {
    useCommunityStore.setState({ groups: [{ id: 'g1', role: 'member' }] });
    rpcMock.mockResolvedValue({ data: null, error: { message: 'not_group_admin' } });

    await useCommunityStore.getState().setMemberRole('g1', 'u2', 'admin');

    // The security-sensitive change is never reflected locally without the RPC.
    expect(useCommunityStore.getState().groups[0].role).toBe('member');
  });
});

describe('removeMember (transactional removal + rotation)', () => {
  it('removes and rotates atomically before returning success', async () => {
    revokeMock.mockResolvedValue({ key: {}, version: 2 });

    const res = await useCommunityStore.getState().removeMember('g1', 'u2');

    expect(revokeMock).toHaveBeenCalledWith('g1', 'u2');
    expect(res).toEqual({});
  });

  it('fails closed when removal or rotation is refused', async () => {
    revokeMock.mockResolvedValue(null);
    const res = await useCommunityStore.getState().removeMember('g1', 'u2');
    expect(res.error).toBe('groupKeyRotationFailed');
  });
});

describe('community safety RPCs', () => {
  it('submits identifier-only reports with a fixed category', async () => {
    rpcMock.mockResolvedValue({ data: 'report-1', error: null });
    const result = await useCommunityStore.getState().reportCommunityContent('prayer', 'prayer-1', 'privacy');
    expect(rpcMock).toHaveBeenCalledWith('submit_community_report', {
      p_content_type: 'prayer', p_content_id: 'prayer-1', p_category: 'privacy',
    });
    expect(result).toEqual({ reportId: 'report-1' });
    expect(JSON.stringify(rpcMock.mock.calls[0])).not.toContain('prayer text');
  });

  it('blocks through the protected RPC and removes visible local content', async () => {
    useCommunityStore.setState({
      prayers: [{ id: 'p1', user_id: 'blocked-user' }, { id: 'p2', user_id: 'safe-user' }],
      testimonies: [{ id: 't1', user_id: 'blocked-user' }],
    });
    rpcMock.mockResolvedValue({ data: null, error: null });
    await useCommunityStore.getState().setUserBlocked('blocked-user', true);
    expect(rpcMock).toHaveBeenCalledWith('set_user_block', {
      p_blocked_user_id: 'blocked-user', p_blocked: true,
    });
    expect(useCommunityStore.getState().prayers.map((item) => item.id)).toEqual(['p2']);
    expect(useCommunityStore.getState().testimonies).toEqual([]);
  });
});
