import { create } from 'zustand';
import { supabase } from '../lib/supabase';

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const useCommunityStore = create((set, get) => ({
  groups: [],
  activeGroupId: null,
  prayers: [],
  testimonies: [],
  userReactions: new Set(),
  loading: false,

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
    // Use RPC to create group + member atomically, bypassing the SELECT RLS
    // chicken-and-egg: we can't SELECT the group before we're a member.
    const code = generateCode();
    const { error } = await supabase.rpc('create_group_with_member', {
      p_name: name,
      p_invite_code: code,
      p_user_id: userId,
    });
    if (error) return { error: error.message };
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
    const newActive = groups.length > 0 ? groups[0].id : null;
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
    const { data } = await supabase
      .from('prayer_reactions')
      .select('community_prayer_id')
      .eq('user_id', userId)
      .in('community_prayer_id',
        (await supabase.from('community_prayers').select('id').eq('group_id', groupId)).data?.map(p => p.id) || []
      );
    set({ userReactions: new Set((data || []).map(r => r.community_prayer_id)) });
  },

  toggleReaction: async (prayerId, userId) => {
    const { userReactions } = get();
    const hasReacted = userReactions.has(prayerId);
    // Optimistic update
    const next = new Set(userReactions);
    if (hasReacted) { next.delete(prayerId); } else { next.add(prayerId); }
    set({ userReactions: next });

    if (hasReacted) {
      await supabase.from('prayer_reactions').delete()
        .eq('community_prayer_id', prayerId).eq('user_id', userId);
    } else {
      await supabase.from('prayer_reactions').insert({ community_prayer_id: prayerId, user_id: userId });
    }
    // Refresh count on that prayer
    const { data } = await supabase
      .from('community_prayers')
      .select('*, community_updates(count), prayer_reactions(count)')
      .eq('id', prayerId)
      .single();
    if (data) {
      set(state => ({ prayers: state.prayers.map(p => p.id === prayerId ? data : p) }));
    }
  },

  addPrayer: async ({ groupId, userId, authorName, title, description, isAnonymous }) => {
    const { data, error } = await supabase
      .from('community_prayers')
      .insert({ group_id: groupId, user_id: userId, author_name: authorName, title, description, is_anonymous: isAnonymous })
      .select()
      .single();
    if (error) return { error: error.message };
    const enriched = { ...data, community_updates: [{ count: 0 }], prayer_reactions: [{ count: 0 }] };
    set(state => ({ prayers: [enriched, ...state.prayers] }));
    return { prayer: data };
  },

  updatePrayer: async ({ prayerId, title, description }) => {
    const { data, error } = await supabase
      .from('community_prayers')
      .update({ title, description })
      .eq('id', prayerId)
      .select()
      .single();
    if (error) return { error: error.message };
    set(state => ({ prayers: state.prayers.map(p => p.id === prayerId ? { ...p, title, description } : p) }));
    return { prayer: data };
  },

  deleteCommunityPrayer: async (prayerId) => {
    const { error } = await supabase.from('community_prayers').delete().eq('id', prayerId);
    if (error) return { error: error.message };
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
    if (error) return { error: error.message };
    // Refresh update count
    const { data: updated } = await supabase
      .from('community_prayers')
      .select('*, community_updates(count), prayer_reactions(count)')
      .eq('id', prayerId)
      .single();
    if (updated) {
      set(state => ({ prayers: state.prayers.map(p => p.id === prayerId ? updated : p) }));
    }
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

  addTestimony: async ({ groupId, userId, authorName, content, isAnonymous, communityPrayerId }) => {
    const { data, error } = await supabase
      .from('testimonies')
      .insert({ group_id: groupId, user_id: userId, author_name: authorName, content, is_anonymous: isAnonymous, community_prayer_id: communityPrayerId || null })
      .select()
      .single();
    if (error) return { error: error.message };
    set(state => ({ testimonies: [data, ...state.testimonies] }));
    return { testimony: data };
  },
}));

export default useCommunityStore;
