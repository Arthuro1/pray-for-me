// Profile-avatar visibility. A display name is readable by any signed-in user
// (a friend request has to be able to name a stranger); an avatar is not. These
// tests pin the client half of that rule — the database half lives in
// supabase/tests/security_schema.test.sql.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.fn();
const update = vi.fn();
const eq = vi.fn();
const from = vi.fn();

vi.mock('./supabase', () => ({
  supabase: {
    rpc: (...args) => rpc(...args),
    from: (...args) => from(...args),
  },
}));

const { fetchProfileAvatars, fetchMyAvatar, saveMyAvatar } = await import('./profileAvatars');

beforeEach(() => {
  rpc.mockReset();
  update.mockReset();
  eq.mockReset();
  from.mockReset();
  eq.mockResolvedValue({ error: null });
  update.mockReturnValue({ eq });
  from.mockReturnValue({ update });
});

describe('fetchProfileAvatars', () => {
  it('goes through the relationship-scoped RPC, never the profiles table', async () => {
    rpc.mockResolvedValue({ data: [{ id: 'u1', avatar_type: 'icon', avatar_value: 'dove', avatar_color: '#1f7d76' }], error: null });
    const byId = await fetchProfileAvatars(['u1']);
    expect(rpc).toHaveBeenCalledWith('get_profile_avatars', { p_ids: ['u1'] });
    expect(from).not.toHaveBeenCalled();
    expect(byId).toEqual({ u1: { type: 'icon', value: 'dove', color: '#1f7d76', photoPath: null } });
  });

  it('leaves out anyone the caller has no group or friendship with', async () => {
    // The RPC simply omits unrelated ids — no error, no existence signal.
    rpc.mockResolvedValue({ data: [{ id: 'friend', avatar_type: 'initials', avatar_value: null, avatar_color: '#4a4f9e' }], error: null });
    const byId = await fetchProfileAvatars(['friend', 'stranger']);
    expect(byId.friend).toBeTruthy();
    expect(byId.stranger).toBeUndefined();
  });

  it('de-duplicates ids and drops empty ones before asking', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    await fetchProfileAvatars(['u1', 'u1', null, undefined, 'u2']);
    expect(rpc).toHaveBeenCalledWith('get_profile_avatars', { p_ids: ['u1', 'u2'] });
  });

  it('asks nothing at all for an empty list', async () => {
    expect(await fetchProfileAvatars([])).toEqual({});
    expect(await fetchProfileAvatars(undefined)).toEqual({});
    expect(rpc).not.toHaveBeenCalled();
  });

  // A database where the migration has not run yet must not break Community:
  // every caller treats a missing entry as "no avatar configured".
  it('degrades to no avatars when the RPC is unavailable', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'function does not exist' } });
    expect(await fetchProfileAvatars(['u1'])).toEqual({});
  });
});

describe('fetchMyAvatar', () => {
  it('reads the caller’s own row through the same RPC', async () => {
    rpc.mockResolvedValue({ data: [{ id: 'me', avatar_type: 'initials', avatar_value: null, avatar_color: '#a35540' }], error: null });
    expect(await fetchMyAvatar('me')).toEqual({ type: 'initials', value: null, color: '#a35540', photoPath: null });
  });

  it('returns null for a signed-out caller without querying', async () => {
    expect(await fetchMyAvatar(null)).toBeNull();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('returns null rather than throwing when nothing comes back', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    expect(await fetchMyAvatar('me')).toBeNull();
  });
});

describe('saveMyAvatar', () => {
  it('writes only the validated preset columns, to the caller’s own row', async () => {
    await saveMyAvatar('me', { type: 'icon', value: 'cross', color: '#4a4f9e' });
    expect(from).toHaveBeenCalledWith('profiles');
    expect(update).toHaveBeenCalledWith({ avatar_type: 'icon', avatar_value: 'cross', avatar_color: '#4a4f9e', avatar_photo_path: null });
    expect(eq).toHaveBeenCalledWith('id', 'me');
  });

  it('drops anything outside the preset list instead of storing it', async () => {
    await saveMyAvatar('me', { type: 'photo', value: 'https://example.com/me.jpg', color: 'red' });
    expect(update).toHaveBeenCalledWith({ avatar_type: null, avatar_value: null, avatar_color: null, avatar_photo_path: null });
  });

  it('never reads the row back, so the write cannot widen the read surface', async () => {
    const chain = update.mock.results;
    await saveMyAvatar('me', { type: 'initials', color: '#60457b' });
    for (const r of chain) expect(r.value.select).toBeUndefined();
  });

  it('reports an error instead of throwing', async () => {
    eq.mockResolvedValue({ error: { message: 'denied' } });
    expect(await saveMyAvatar('me', { type: 'initials' })).toEqual({ error: 'denied' });
  });

  it('refuses to write without a user id', async () => {
    expect(await saveMyAvatar(null, { type: 'initials' })).toEqual({ error: 'noUser' });
    expect(from).not.toHaveBeenCalled();
  });
});
