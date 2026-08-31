// Accepted-friend cards consume the repaired public profile name. The database
// migration fills legacy blanks; this pins the client mapping used by the
// "People" list shown in the screenshot.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { fetchProfileAvatars } = vi.hoisted(() => ({
  fetchProfileAvatars: vi.fn(),
}));

function queryFor(table) {
  const result = table === 'friendships'
    ? { data: [{ user_id: 'me', friend_id: 'recipient' }], error: null }
    : table === 'profiles'
      ? { data: [{ id: 'recipient', full_name: 'Lydie Kuate' }], error: null }
      : { data: [], error: null };
  const chain = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    or: () => chain,
    then: (resolve) => resolve(result),
  };
  return chain;
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (table) => queryFor(table),
    rpc: vi.fn(),
    auth: { getUser: async () => ({ data: { user: null } }) },
  },
}));
vi.mock('../lib/profileAvatars', () => ({ fetchProfileAvatars }));
vi.mock('../lib/crypto/groupKeys', () => ({
  ensureGroupKey: vi.fn(), groupKeyResolver: vi.fn(), revokeMemberAndRotate: vi.fn(),
}));

const { default: useCommunityStore } = await import('./communityStore');

beforeEach(() => {
  fetchProfileAvatars.mockReset();
  fetchProfileAvatars.mockResolvedValue({ recipient: { type: 'icon', value: 'dove' } });
});

describe('fetchFriends', () => {
  it('shows the repaired profile name in the accepted-friends list', async () => {
    const result = await useCommunityStore.getState().fetchFriends('me');
    expect(result.friends).toEqual([
      { id: 'recipient', name: 'Lydie Kuate', avatar: { type: 'icon', value: 'dove' } },
    ]);
  });
});
