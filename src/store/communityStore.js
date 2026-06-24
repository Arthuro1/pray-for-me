import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toError, orderedPair, updatePrayerInList, buildSharesMap } from '../utils/community';

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function fetchPrayerWithCounts(prayerId) {
  const { data } = await supabase
    .from('community_prayers')
    .select('*, community_updates(count), prayer_reactions(count)')
    .eq('id', prayerId)
    .single();
  return data;
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
  // { [sourcePrayerId]: [{ groupId, groupName }] } — where each personal prayer is shared.
  prayerShares: {},

  // Loads the share map for the current user's shared personal prayers.
  fetchPrayerShares: async (userId) => {
    const { data } = await supabase
      .from('community_prayers')
      .select('source_prayer_id, group_id, is_anonymous, groups(name), prayer_reactions(count)')
      .eq('user_id', userId)
      .not('source_prayer_id', 'is', null);
    set({ prayerShares: buildSharesMap(data) });
  },

  // Lightweight feed of every community prayer in the user's groups (RLS-scoped),
  // used to compute per-group "new since last visit" counts.
  fetchGroupActivity: async () => {
    const { data } = await supabase.from('community_prayers').select('group_id, created_at, user_id');
    return data || [];
  },

  // Reconciles which groups a personal prayer is shared to: inserts community
  // copies for newly selected groups, removes copies for deselected ones.
  setPrayerShares: async ({ prayer, groupIds, userId, authorName, isAnonymous = false }) => {
    const { data: existing } = await supabase
      .from('community_prayers')
      .select('id, group_id')
      .eq('source_prayer_id', prayer.id);

    const existingGroupIds = new Set((existing || []).map(e => e.group_id));
    const target = new Set(groupIds);
    const toAdd = groupIds.filter(g => !existingGroupIds.has(g));
    const toRemove = (existing || []).filter(e => !target.has(e.group_id));

    if (toAdd.length > 0) {
      const categoryIds = (prayer.prayer_categories || []).map(pc => pc.category_id);
      // Seed new copies with the prayer's current points so they match the source.
      const points = (prayer.prayer_points || []).map(pp => ({ id: pp.id, title: pp.title, verses: pp.verses || [] }));
      const { data: created, error } = await supabase.from('community_prayers').insert(toAdd.map(gid => ({
        group_id: gid,
        user_id: userId,
        author_name: authorName,
        title: prayer.title,
        description: prayer.description || '',
        category_ids: categoryIds,
        prayer_points: points,
        source_prayer_id: prayer.id,
        is_anonymous: isAnonymous,
        is_answered: prayer.status === 'answered',
      }))).select('id');
      if (error) return toError(error);

      // Seed new copies with the prayer's existing updates too.
      const updates = prayer.prayer_updates || [];
      if (updates.length > 0 && created) {
        const rows = created.flatMap(c => updates.map(u => ({
          community_prayer_id: c.id,
          user_id: userId,
          author_name: u.author_name || authorName,
          text: u.text,
          is_anonymous: u.is_anonymous || false,
        })));
        await supabase.from('community_updates').insert(rows);
      }
    }
    if (toRemove.length > 0) {
      await supabase.from('community_prayers').delete().in('id', toRemove.map(e => e.id));
    }
    // Keep anonymity consistent across all remaining copies of this prayer.
    if (target.size > 0) {
      await supabase.from('community_prayers')
        .update({ is_anonymous: isAnonymous })
        .eq('source_prayer_id', prayer.id);
    }
    await get().fetchPrayerShares(userId);
    return {};
  },

  // Count of incoming friend requests + group invitations (drives the nav badge).
  fetchPendingCount: async (userId) => {
    const [fr, gi] = await Promise.all([
      supabase.from('friend_requests').select('*', { count: 'exact', head: true }).eq('to_user_id', userId),
      supabase.from('group_invitations').select('*', { count: 'exact', head: true }).eq('invited_user_id', userId),
    ]);
    set({ pendingCount: (fr.count || 0) + (gi.count || 0) });
  },

  // ── Realtime ────────────────────────────────────────────────────────────────
  // Live nav badge: refetch the pending count whenever an incoming friend
  // request or group invitation for this user changes. Returns an unsubscribe fn.
  subscribePending: (userId) => {
    const channel = supabase.channel(`pending-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `to_user_id=eq.${userId}` },
        () => get().fetchPendingCount(userId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_invitations', filter: `invited_user_id=eq.${userId}` },
        () => get().fetchPendingCount(userId))
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  // Live prayer wall: quietly refetch a group's prayers on any change to its
  // community_prayers rows (new/edited/deleted/answered). Returns an unsubscribe fn.
  subscribeGroupPrayers: (groupId) => {
    const channel = supabase.channel(`group-prayers-${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_prayers', filter: `group_id=eq.${groupId}` },
        () => get().fetchPrayers(groupId, true))
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  // Re-fetch a single prayer's counts and merge into the list (used by realtime).
  refreshPrayer: async (prayerId) => {
    const updated = await fetchPrayerWithCounts(prayerId);
    if (updated) set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, () => updated) }));
  },

  // Live activity on one open prayer: reactions and member updates. The caller
  // supplies handlers so it can also refresh its local updates list.
  subscribePrayerActivity: (prayerId, handlers = {}) => {
    const channel = supabase.channel(`prayer-activity-${prayerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prayer_reactions', filter: `community_prayer_id=eq.${prayerId}` },
        () => handlers.onReaction?.())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_updates', filter: `community_prayer_id=eq.${prayerId}` },
        () => handlers.onUpdate?.())
      .subscribe();
    return () => supabase.removeChannel(channel);
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
    const { data: prefs } = await supabase
      .from('group_member_prefs')
      .select('group_id, auto_add')
      .eq('user_id', userId);
    const autoAddById = Object.fromEntries((prefs || []).map(p => [p.group_id, p.auto_add]));
    const groups = data.map(d => ({ ...d.groups, role: d.role, autoAdd: !!autoAddById[d.groups.id] }));
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
    // Server-side: validates the invite code and adds membership atomically.
    const { data: group, error } = await supabase.rpc('join_group_by_code', { p_code: code });
    if (error) {
      return { error: error.message?.includes('already member') ? 'alreadyMember' : 'notFound' };
    }
    await get().fetchGroups(userId);
    if (group?.id) get().setActiveGroup(group.id);
    return { group };
  },

  leaveGroup: async (groupId, userId) => {
    const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
    if (error) return toError(error);
    set(state => ({
      groups: state.groups.filter(g => g.id !== groupId),
      activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId,
      prayers: [],
      testimonies: [],
    }));
    return {};
  },

  // Per-member preference: auto-copy this group's new requests to the personal list.
  setGroupAutoAdd: async (groupId, userId, value) => {
    const { error } = await supabase
      .from('group_member_prefs')
      .upsert({ group_id: groupId, user_id: userId, auto_add: value }, { onConflict: 'group_id,user_id' });
    if (error) return toError(error);
    set(state => ({ groups: state.groups.map(g => g.id === groupId ? { ...g, autoAdd: value } : g) }));
    return {};
  },

  // quiet=true skips the loading flag (used by realtime refetches to avoid a spinner flash).
  fetchPrayers: async (groupId, quiet = false) => {
    if (!quiet) set({ loading: true });
    const { data } = await supabase
      .from('community_prayers')
      .select('*, community_updates(count), prayer_reactions(count)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (data) set({ prayers: data });
    if (!quiet) set({ loading: false });
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

  // Mark a community prayer answered/active (author or group admin via RLS).
  setCommunityAnswered: async (prayerId, value) => {
    const { error } = await supabase.from('community_prayers').update({ is_answered: value }).eq('id', prayerId);
    if (error) return toError(error);
    set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, p => ({ ...p, is_answered: value })) }));
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

  // When the community prayer is shared from a personal one (sourcePrayerId),
  // route through sync_add_update so the update also reaches the personal prayer
  // and any sibling group copies. Otherwise write the community update directly.
  addUpdate: async ({ prayerId, sourcePrayerId, userId, authorName, text, isAnonymous }) => {
    if (sourcePrayerId) {
      const { error } = await supabase.rpc('sync_add_update', {
        p_id: crypto.randomUUID(), p_source: sourcePrayerId, p_text: text, p_author: authorName, p_anon: isAnonymous,
      });
      if (error) return toError(error);
    } else {
      const { error } = await supabase
        .from('community_updates')
        .insert({ community_prayer_id: prayerId, user_id: userId, author_name: authorName, text, is_anonymous: isAnonymous });
      if (error) return toError(error);
    }
    const updated = await fetchPrayerWithCounts(prayerId);
    if (updated) set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, () => updated) }));
    return {};
  },

  fetchTestimonies: async (groupId) => {
    const { data } = await supabase
      .from('testimonies')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (data) set({ testimonies: data });
  },

  // When the community prayer is shared from a personal one (sourcePrayerId),
  // route through sync_add_point so the point also reaches the personal prayer
  // and any sibling group copies. Otherwise append to this prayer only.
  addCommunityPrayerPoint: async (prayerId, point, sourcePrayerId) => {
    // Normalize legacy single-verse points ({ verse }) into a verses array.
    const verses = point.verses
      ? point.verses
      : point.verse ? [{ ref: point.verse, text: point.verseText || '' }] : [];

    if (sourcePrayerId) {
      const { error } = await supabase.rpc('sync_add_point', {
        p_id: crypto.randomUUID(), p_source: sourcePrayerId, p_title: point.title, p_verses: verses,
      });
      if (error) { console.error('sync_add_point error:', error); return toError(error); }
      const updated = await fetchPrayerWithCounts(prayerId);
      if (updated) set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, () => updated) }));
      return {};
    }

    const current = get().prayers.find(p => p.id === prayerId);
    if (!current) return { error: 'Prayer not found' };
    const newPoint = { id: crypto.randomUUID(), title: point.title, verses };
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

  // Removes a point. Shared → RPC fan-out; standalone → edit this prayer's jsonb.
  removeCommunityPrayerPoint: async (prayerId, pointId, sourcePrayerId) => {
    if (sourcePrayerId) {
      const { error } = await supabase.rpc('sync_remove_point', { p_source: sourcePrayerId, p_point_id: pointId });
      if (error) return toError(error);
    } else {
      const current = get().prayers.find(p => p.id === prayerId);
      const points = (current?.prayer_points || []).filter(pp => pp.id !== pointId);
      const { error } = await supabase.from('community_prayers').update({ prayer_points: points }).eq('id', prayerId);
      if (error) return toError(error);
    }
    const updated = await fetchPrayerWithCounts(prayerId);
    if (updated) set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, () => updated) }));
    return {};
  },

  addCommunityVerse: async (prayerId, pointId, verse, sourcePrayerId) => {
    if (sourcePrayerId) {
      const { error } = await supabase.rpc('sync_add_verse', { p_source: sourcePrayerId, p_point_id: pointId, p_verse: verse });
      if (error) return toError(error);
    } else {
      const current = get().prayers.find(p => p.id === prayerId);
      const points = (current?.prayer_points || []).map(pp => pp.id === pointId ? { ...pp, verses: [...(pp.verses || []), verse] } : pp);
      const { error } = await supabase.from('community_prayers').update({ prayer_points: points }).eq('id', prayerId);
      if (error) return toError(error);
    }
    const updated = await fetchPrayerWithCounts(prayerId);
    if (updated) set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, () => updated) }));
    return {};
  },

  removeCommunityVerse: async (prayerId, pointId, verseRef, sourcePrayerId) => {
    if (sourcePrayerId) {
      const { error } = await supabase.rpc('sync_remove_verse', { p_source: sourcePrayerId, p_point_id: pointId, p_verse_ref: verseRef });
      if (error) return toError(error);
    } else {
      const current = get().prayers.find(p => p.id === prayerId);
      const points = (current?.prayer_points || []).map(pp => pp.id === pointId ? { ...pp, verses: (pp.verses || []).filter(v => v.ref !== verseRef) } : pp);
      const { error } = await supabase.from('community_prayers').update({ prayer_points: points }).eq('id', prayerId);
      if (error) return toError(error);
    }
    const updated = await fetchPrayerWithCounts(prayerId);
    if (updated) set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, () => updated) }));
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

  // Re-create a friendship directly (used to undo an accidental removal).
  addFriendship: async (userId, friendId) => {
    const [uid1, uid2] = orderedPair(userId, friendId);
    const { error } = await supabase.from('friendships').insert({ user_id: uid1, friend_id: uid2 });
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

  // Idempotent: re-inviting someone who already has a pending invitation is a
  // no-op instead of a 409 conflict on the (group_id, invited_user_id) unique key.
  inviteToGroup: async (groupId, friendId, invitedBy) => {
    const { error } = await supabase
      .from('group_invitations')
      .upsert(
        { group_id: groupId, invited_user_id: friendId, invited_by: invitedBy },
        { onConflict: 'group_id,invited_user_id', ignoreDuplicates: true }
      );
    if (error) return toError(error);
    return {};
  },

  // User ids already invited to a group (so the admin UI can mark them invited).
  fetchGroupInvitees: async (groupId) => {
    const { data, error } = await supabase
      .from('group_invitations')
      .select('invited_user_id')
      .eq('group_id', groupId);
    if (error) return { error: error.message };
    return { inviteeIds: (data || []).map(i => i.invited_user_id) };
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
