// Store-level coverage for the secure multi-admin actions. The real
// authorization lives in the Postgres RPCs (set_group_member_role /
// remove_group_member); here we prove the store calls those RPCs with only the
// group + target + role (never an acting-user id), maps raised errors through
// toError, and never optimistically mutates role state client-side.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
    // The two actions under test only touch supabase.rpc; from()/auth are stubs
    // so the module imports cleanly.
    from: () => ({ select: () => ({ eq: () => ({}) }) }),
    auth: { getUser: async () => ({ data: { user: null } }) },
  },
}));

import useCommunityStore from './communityStore';

beforeEach(() => { rpcMock.mockReset(); });

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

describe('removeMember (guarded RPC)', () => {
  it('removes through the remove_group_member RPC and returns {} on success', async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    const res = await useCommunityStore.getState().removeMember('g1', 'u2');

    expect(rpcMock).toHaveBeenCalledWith('remove_group_member', {
      p_group_id: 'g1', p_target_user_id: 'u2',
    });
    expect(res).toEqual({});
  });

  it('surfaces the mapped error when removal is refused', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'must_retain_admin' } });
    const res = await useCommunityStore.getState().removeMember('g1', 'u2');
    expect(res.error).toBe('must_retain_admin');
  });
});
