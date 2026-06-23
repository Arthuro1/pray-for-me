import { create } from 'zustand';
import { supabase } from '../lib/supabase';

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function toError(error) {
  return { error: error.message };
}

async function fetchPrayerWithCounts(prayerId) {
  const { data } = await supabase
    .from('community_prayers')
    .select('*, community_updates(count), prayer_reactions(count)')
    .eq('id', prayerId)
    .single();
  return data;
}

function updatePrayerInList(prayers, prayerId, updater) {
  return prayers.map(p => p.id === prayerId ? updater(p) : p);
}

// friendships enforces user_id < friend_id; order any pair to match that.
// UUIDs are lowercase hex, so JS string sort matches Postgres uuid ordering.
function orderedPair(a, b) {
  return [a, b].sort();
}

// Looks up display names for the given user ids and returns a resolver
// nameOf(id) that falls back to '?' for unknown ids.
async function resolveNames(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  let byId = {};
  if (unique.length > 0) {
    const { data } = await supabase.from('profiles').select('id, full_name').in('id', unique);
    byId = Object.fromEntries((data || []).map(p => [p.id, p.full_name]));
  }
  return (id) => byId[id] || '?';
}

const useCommunityStore = create((set, get) => ({
  groups: [],
  activeGroupId: null,
  prayers: [],
  testimonies: [],
  userReactions: new Set(),
  loading: false,
  pendingCount: 0,

  // Count of incoming friend requests + group invitations (drives the nav badge).
  fetchPendingCount: async (userId) => {
    const [fr, gi] = await Promise.all([
      supabase.from('friend_requests').select('*', { count: 'exact', head: true }).eq('to_user_id', userId),
      supabase.from('group_invitations').select('*', { count: 'exact', head: true }).eq('invited_user_id', userId),
    ]);
    set({ pendingCount: (fr.count || 0) + (gi.count || 0) });
  },

  setActiveGroup: (id) => {
    set({ activeGroupId: id, prayers: [], testimonies: [] });
    get().fetchPrayers(id);
    get().fetchTestimonies(id);
  },

  fetchGroups: async (userId) => {
    const { data } = await supabase
      .from('group_members')
      .select('role, groups(*)')
      .eq('user_id', userId);
    if (!data) return;
    const groups = data.map(d => ({ ...d.groups, role: d.role }));
    set({ groups });
    const { activeGroupId } = get();
    if (groups.length > 0 && !activeGroupId) {
      get().setActiveGroup(groups[0].id);
    } else if (activeGroupId) {
      get().fetchPrayers(activeGroupId);
      get().fetchTestimonies(activeGroupId);
    }
  },

  createGroup: async (name, userId) => {
    // RPC creates group + member atomically to bypass RLS chicken-and-egg
    const { error } = await supabase.rpc('create_group_with_member', {
      p_name: name,
      p_invite_code: generateCode(),
      p_user_id: userId,
    });
    if (error) return toError(error);
    await get().fetchGroups(userId);
    return {};
  },

  joinGroup: async (code, userId) => {
    const { data: group, error } = await supabase
      .from('groups')
      .select()
      .eq('invite_code', code.trim().toUpperCase())
      .single();
    if (error || !group) return { error: 'notFound' };
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId, role: 'member' });
    if (memberError) return { error: 'alreadyMember' };
    await get().fetchGroups(userId);
    get().setActiveGroup(group.id);
    return { group };
  },

  leaveGroup: async (groupId, userId) => {
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
    const groups = get().groups.filter(g => g.id !== groupId);
    const newActive = groups[0]?.id ?? null;
    set({ groups, activeGroupId: newActive, prayers: [], testimonies: [] });
    if (newActive) {
      get().fetchPrayers(newActive);
      get().fetchTestimonies(newActive);
    }
  },

  fetchPrayers: async (groupId) => {
    set({ loading: true });
    const { data } = await supabase
      .from('community_prayers')
      .select('*, community_updates(count), prayer_reactions(count)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (data) set({ prayers: data });
    set({ loading: false });
  },

  fetchUserReactions: async (groupId, userId) => {
    const { data: prayerIds } = await supabase
      .from('community_prayers')
      .select('id')
      .eq('group_id', groupId);
    const ids = (prayerIds || []).map(p => p.id);
    if (ids.length === 0) return;
    const { data } = await supabase
      .from('prayer_reactions')
      .select('community_prayer_id')
      .eq('user_id', userId)
      .in('community_prayer_id', ids);
    set({ userReactions: new Set((data || []).map(r => r.community_prayer_id)) });
  },

  toggleReaction: async (prayerId, userId) => {
    const { userReactions } = get();
    const hasReacted = userReactions.has(prayerId);

    // Optimistic update
    const next = new Set(userReactions);
    hasReacted ? next.delete(prayerId) : next.add(prayerId);
    set({ userReactions: next });

    if (hasReacted) {
      await supabase.from('prayer_reactions').delete()
        .eq('community_prayer_id', prayerId).eq('user_id', userId);
    } else {
      await supabase.from('prayer_reactions').insert({ community_prayer_id: prayerId, user_id: userId });
    }

    const updated = await fetchPrayerWithCounts(prayerId);
    if (updated) set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, () => updated) }));
  },

  addPrayer: async ({ groupId, userId, authorName, title, description, isAnonymous, categoryIds }) => {
    const { data, error } = await supabase
      .from('community_prayers')
      .insert({ group_id: groupId, user_id: userId, author_name: authorName, title, description, is_anonymous: isAnonymous, category_ids: categoryIds || [] })
      .select()
      .single();
    if (error) return toError(error);
    const enriched = { ...data, community_updates: [{ count: 0 }], prayer_reactions: [{ count: 0 }] };
    set(state => ({ prayers: [enriched, ...state.prayers] }));
    return { prayer: data };
  },

  updatePrayer: async ({ prayerId, title, description, isAnonymous, categoryIds }) => {
    const patch = { title, description, is_anonymous: isAnonymous, category_ids: categoryIds || [] };
    const { error } = await supabase.from('community_prayers').update(patch).eq('id', prayerId);
    if (error) return toError(error);
    set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, p => ({ ...p, ...patch })) }));
    return {};
  },

  deleteCommunityPrayer: async (prayerId) => {
    const { error } = await supabase.from('community_prayers').delete().eq('id', prayerId);
    if (error) return toError(error);
    set(state => ({ prayers: state.prayers.filter(p => p.id !== prayerId) }));
    return {};
  },

  fetchPrayerUpdates: async (prayerId) => {
    const { data } = await supabase
      .from('community_updates')
      .select('*')
      .eq('community_prayer_id', prayerId)
      .order('created_at', { ascending: true });
    return data || [];
  },

  addUpdate: async ({ prayerId, userId, authorName, text, isAnonymous }) => {
    const { data, error } = await supabase
      .from('community_updates')
      .insert({ community_prayer_id: prayerId, user_id: userId, author_name: authorName, text, is_anonymous: isAnonymous })
      .select()
      .single();
    if (error) return toError(error);
    const updated = await fetchPrayerWithCounts(prayerId);
    if (updated) set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, () => updated) }));
    return { update: data };
  },

  fetchTestimonies: async (groupId) => {
    const { data } = await supabase
      .from('testimonies')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (data) set({ testimonies: data });
  },

  addCommunityPrayerPoint: async (prayerId, point) => {
    const current = get().prayers.find(p => p.id === prayerId);
    if (!current) return { error: 'Prayer not found' };
    const newPoint = { ...point, id: crypto.randomUUID() };
    const points = [...(current.prayer_points || []), newPoint];
    const { error } = await supabase
      .from('community_prayers')
      .update({ prayer_points: points })
      .eq('id', prayerId)
      .select();
    if (error) {
      console.error('addCommunityPrayerPoint error:', error);
      return toError(error);
    }
    set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, p => ({ ...p, prayer_points: points })) }));
    return {};
  },

  addTestimony: async ({ groupId, userId, authorName, content, isAnonymous, communityPrayerId }) => {
    const { data, error } = await supabase
      .from('testimonies')
      .insert({ group_id: groupId, user_id: userId, author_name: authorName, content, is_anonymous: isAnonymous, community_prayer_id: communityPrayerId || null })
      .select()
      .single();
    if (error) return toError(error);
    set(state => ({ testimonies: [data, ...state.testimonies] }));
    return { testimony: data };
  },

  // ── Friends & Requests ──────────────────────────────────────────────────────
  // Send a friend request to a user identified by email. fromUserId is the
  // current user. Returns { error: 'notFound' | 'self' | 'exists' | msg } on failure.
  sendFriendRequest: async (email, fromUserId) => {
    const { data: toUserId, error: lookupError } = await supabase.rpc('find_user_by_email', { p_email: email });
    if (lookupError) return toError(lookupError);
    if (!toUserId) return { error: 'notFound' };
    if (toUserId === fromUserId) return { error: 'self' };

    const { error } = await supabase
      .from('friend_requests')
      .insert({ from_user_id: fromUserId, to_user_id: toUserId });
    if (error) return { error: 'exists' };
    return {};
  },

  acceptFriendRequest: async (requestId) => {
    const { data: request, error: reqError } = await supabase
      .from('friend_requests')
      .select('from_user_id, to_user_id')
      .eq('id', requestId)
      .single();
    if (reqError) return toError(reqError);

    const [uid1, uid2] = orderedPair(request.from_user_id, request.to_user_id);
    const { error } = await supabase.from('friendships').insert({ user_id: uid1, friend_id: uid2 });
    if (error) return toError(error);

    await supabase.from('friend_requests').delete().eq('id', requestId);
    return {};
  },

  rejectFriendRequest: async (requestId) => {
    const { error } = await supabase.from('friend_requests').delete().eq('id', requestId);
    return error ? toError(error) : {};
  },

  removeFriend: async (userId, friendId) => {
    const [uid1, uid2] = orderedPair(userId, friendId);
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('user_id', uid1)
      .eq('friend_id', uid2);
    return error ? toError(error) : {};
  },

  // Returns friends as [{ id, name }] by joining the profiles table.
  fetchFriends: async (userId) => {
    const { data, error } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
    if (error) return { error: error.message };
    const ids = data.map(f => f.user_id === userId ? f.friend_id : f.user_id);
    const nameOf = await resolveNames(ids);
    return { friends: ids.map(id => ({ id, name: nameOf(id) })) };
  },

  // Incoming friend requests enriched with the sender's display name.
  fetchFriendRequests: async (userId) => {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('to_user_id', userId);
    if (error) return { error: error.message };
    const nameOf = await resolveNames((data || []).map(r => r.from_user_id));
    return { requests: (data || []).map(r => ({ ...r, fromName: nameOf(r.from_user_id) })) };
  },

  inviteToGroup: async (groupId, friendId, invitedBy) => {
    const { error } = await supabase
      .from('group_invitations')
      .insert({ group_id: groupId, invited_user_id: friendId, invited_by: invitedBy });
    if (error) return { error: 'exists' };
    return {};
  },

  // Group invitations for the current user, enriched with group name + inviter.
  fetchGroupInvitations: async (userId) => {
    const { data, error } = await supabase
      .from('group_invitations')
      .select('*, groups(name)')
      .eq('invited_user_id', userId);
    if (error) return { error: error.message };
    const nameOf = await resolveNames((data || []).map(i => i.invited_by));
    const invitations = (data || []).map(i => ({
      ...i,
      groupName: i.groups?.name || '?',
      inviterName: nameOf(i.invited_by),
    }));
    return { invitations };
  },

  acceptGroupInvitation: async (inviteId, userId) => {
    const { data: invite, error: invError } = await supabase
      .from('group_invitations')
      .select('group_id')
      .eq('id', inviteId)
      .single();
    if (invError) return toError(invError);

    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: invite.group_id, user_id: userId, role: 'member' });
    if (error) return toError(error);

    await supabase.from('group_invitations').delete().eq('id', inviteId);
    await get().fetchGroups(userId);
    return {};
  },

  rejectGroupInvitation: async (inviteId) => {
    const { error } = await supabase.from('group_invitations').delete().eq('id', inviteId);
    return error ? toError(error) : {};
  },

  // ── Group admin ───────────────────────────────────────────────────────────
  fetchGroupMembers: async (groupId) => {
    const { data, error } = await supabase
      .from('group_members')
      .select('user_id, role')
      .eq('group_id', groupId);
    if (error) return { error: error.message };
    const nameOf = await resolveNames((data || []).map(m => m.user_id));
    return { members: (data || []).map(m => ({ ...m, name: nameOf(m.user_id) })) };
  },

  removeMember: async (groupId, memberId) => {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', memberId);
    return error ? toError(error) : {};
  },
}));

export default useCommunityStore;
