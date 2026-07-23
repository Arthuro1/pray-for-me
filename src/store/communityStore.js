import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toError, orderedPair, updatePrayerInList, buildSharesMap } from '../utils/community';
import { devError } from '../lib/logger';
import { track, EVENTS } from '../lib/analytics';
import { ensureGroupKey, groupKeyResolver } from '../lib/crypto/groupKeys';
import { removeAttachmentFiles } from '../lib/attachments';
import { autoFollowOnReaction } from '../lib/prayerFollow';
import {
  encryptCommunityPrayer,
  encryptCommunityUpdate,
  encryptCommunityTestimony,
  decryptCommunityRow,
  decryptCommunityRows,
} from '../lib/crypto/communityCrypto';

// ── Community content encryption (per-group key) ──────────────────────────────
// Community prayers / updates / testimonies are end-to-end encrypted under the
// group's content key (GCK): sensitive fields move into encrypted_payload and the
// plaintext columns are redacted, so Supabase only ever stores ciphertext the
// members can read. Each helper takes a resolved GCK ({ key, version } or null)
// and returns the column patch to persist. When no key is available it falls back
// to plaintext (degraded/legacy path) so posting never hard-fails; a later fetch
// treats such rows as legacy plaintext and renders them as-is.
async function encPrayerCols(gk, { title = '', description = '', prayer_points = [] }) {
  if (!gk) return { title, description, prayer_points };
  const e = await encryptCommunityPrayer(gk, { title, description, prayer_points });
  return {
    title: e.title, description: e.description, prayer_points: e.prayer_points,
    encrypted_payload: e.encrypted_payload, encryption_version: e.encryption_version, key_version: e.key_version,
  };
}

async function encUpdateCols(gk, text, attachments = []) {
  if (!gk) return { text, attachments };
  const e = await encryptCommunityUpdate(gk, { text, attachments });
  return { text: e.text, attachments: e.attachments, encrypted_payload: e.encrypted_payload, encryption_version: e.encryption_version, key_version: e.key_version };
}

async function encTestimonyCols(gk, content, attachments = []) {
  if (!gk) return { content, attachments };
  const e = await encryptCommunityTestimony(gk, { content, attachments });
  return { content: e.content, attachments: e.attachments, encrypted_payload: e.encrypted_payload, encryption_version: e.encryption_version, key_version: e.key_version };
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function fetchPrayerWithCounts(prayerId) {
  const { data } = await supabase
    .from('community_prayers')
    .select('*, community_updates(count), prayer_reactions(count)')
    .eq('id', prayerId)
    .single();
  if (!data) return data;
  return decryptCommunityRow(groupKeyResolver(data.group_id), data);
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
  // The user's upcoming group-calendar commitments (joined with title/group),
  // merged into the personal calendar as 'group' entries.
  myCommitments: [],

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

  // A compact cross-group wall for the Community home. RLS keeps this limited
  // to groups the member belongs to; each row is decrypted with its own group
  // key before it reaches the UI.
  fetchCommunityFeed: async () => {
    const { data } = await supabase
      .from('community_prayers')
      .select('*, community_updates(count), prayer_reactions(count)')
      .order('created_at', { ascending: false })
      .limit(8);
    return Promise.all((data || []).map((row) => (
      decryptCommunityRow(groupKeyResolver(row.group_id), row)
    )));
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
      const updates = prayer.prayer_updates || [];
      // Each community copy is an independent encrypted snapshot under ITS group's
      // key, so seed + encrypt per group (the personal prayer stays encrypted under
      // the account key — no plaintext conversion needed anymore).
      for (const gid of toAdd) {
        const gk = await ensureGroupKey(gid);
        const cols = await encPrayerCols(gk, { title: prayer.title, description: prayer.description || '', prayer_points: points });
        const { data: created, error } = await supabase.from('community_prayers').insert({
          group_id: gid,
          user_id: userId,
          author_name: authorName,
          ...cols,
          category_ids: categoryIds,
          source_prayer_id: prayer.id,
          is_anonymous: isAnonymous,
          is_answered: prayer.status === 'answered',
          // The share keeps the original wording, so the source language of the
          // personal prayer travels with it into every group copy.
          content_language: prayer.content_language || null,
        }).select('id').single();
        if (error) return toError(error);

        if (updates.length > 0 && created) {
          const rows = [];
          for (const u of updates) {
            rows.push({
              community_prayer_id: created.id,
              user_id: userId,
              author_name: u.author_name || authorName,
              is_anonymous: u.is_anonymous || false,
              ...(await encUpdateCols(gk, u.text ?? '')),
            });
          }
          await supabase.from('community_updates').insert(rows);
        }
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
    // Provision/redistribute the group content key on open, so a key-holder hands
    // it to any member who joined since the last time the group was touched.
    ensureGroupKey(id);
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
    const code = generateCode();
    const { error } = await supabase.rpc('create_group_with_member', {
      p_name: name,
      p_invite_code: code,
      p_user_id: userId,
    });
    if (error) return toError(error);
    await get().fetchGroups(userId);
    // Hand the fresh group back (matched by the code we just generated) so the
    // UI can open it directly — a new leader lands IN their group, where the
    // invite / first-request checklist waits, instead of back on the hub.
    const group = get().groups.find((g) => g.invite_code === code) || null;
    return { group };
  },

  joinGroup: async (code, userId) => {
    // Server-side: validates the invite code and adds membership atomically.
    const { data: group, error } = await supabase.rpc('join_group_by_code', { p_code: code });
    if (error) {
      return { error: error.message?.includes('already member') ? 'alreadyMember' : 'notFound' };
    }
    await get().fetchGroups(userId);
    if (group?.id) get().setActiveGroup(group.id);
    track(EVENTS.GROUP_JOINED); // content-free: only that a group was joined
    return { group };
  },

  // Rename a group (admin only — enforced by RLS). Updates the local list.
  renameGroup: async (groupId, name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return { error: 'empty' };
    const { error } = await supabase.from('groups').update({ name: trimmed }).eq('id', groupId);
    if (error) return toError(error);
    set(state => ({ groups: state.groups.map(g => g.id === groupId ? { ...g, name: trimmed } : g) }));
    return {};
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
    if (data) set({ prayers: await decryptCommunityRows(groupKeyResolver(groupId), data) });
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

  // Who's praying: the identities behind a prayer's reaction count, for the
  // presence row on the detail page. Names resolve the same way as group
  // members, so visibility matches what members already see of each other.
  fetchReactors: async (prayerId) => {
    const { data, error } = await supabase
      .from('prayer_reactions')
      .select('user_id')
      .eq('community_prayer_id', prayerId);
    if (error) return { reactors: [] };
    const ids = (data || []).map(r => r.user_id);
    const nameOf = await resolveNames(ids);
    return { reactors: ids.map(id => ({ user_id: id, name: nameOf(id) })) };
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
      // Tapping "I'm praying" also follows the prayer for notifications — a
      // convenience the user can reverse from the prayer's follow toggle.
      autoFollowOnReaction(userId, prayerId);
    }

    const updated = await fetchPrayerWithCounts(prayerId);
    if (updated) set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, () => updated) }));
  },

  // Unconditionally clear the user's reaction on a community prayer (used when
  // they remove a saved copy from their personal list, so the praying count drops).
  removeReaction: async (prayerId, userId) => {
    if (!prayerId || !userId) return;
    await supabase.from('prayer_reactions').delete().eq('community_prayer_id', prayerId).eq('user_id', userId);
    set(state => {
      const next = new Set(state.userReactions); next.delete(prayerId);
      return { userReactions: next };
    });
  },

  // Re-add a reaction (used to undo an accidental remove-from-list of a saved copy).
  addReaction: async (prayerId, userId) => {
    if (!prayerId || !userId) return;
    await supabase.from('prayer_reactions').insert({ community_prayer_id: prayerId, user_id: userId });
    set(state => {
      const next = new Set(state.userReactions); next.add(prayerId);
      return { userReactions: next };
    });
  },

  addPrayer: async ({ groupId, userId, authorName, title, description, isAnonymous, categoryIds, contentLanguage = null }) => {
    const gk = await ensureGroupKey(groupId);
    const cols = await encPrayerCols(gk, { title, description: description || '', prayer_points: [] });
    const { data, error } = await supabase
      .from('community_prayers')
      .insert({ group_id: groupId, user_id: userId, author_name: authorName, ...cols, is_anonymous: isAnonymous, category_ids: categoryIds || [], content_language: contentLanguage })
      .select()
      .single();
    if (error) return toError(error);
    // Keep plaintext in memory — the server row has redacted columns when encrypted.
    const plaintext = { ...data, title, description: description || '', prayer_points: [] };
    const enriched = { ...plaintext, community_updates: [{ count: 0 }], prayer_reactions: [{ count: 0 }] };
    set(state => ({ prayers: [enriched, ...state.prayers] }));
    return { prayer: plaintext };
  },

  updatePrayer: async ({ prayerId, title, description, isAnonymous, categoryIds, contentLanguage }) => {
    const current = get().prayers.find((p) => p.id === prayerId);
    const gk = await ensureGroupKey(current?.group_id);
    // Title + description share the prayer's encrypted_payload with its points, so
    // re-encrypt the whole bundle from the current (plaintext, in-memory) state.
    const cols = await encPrayerCols(gk, { title, description: description || '', prayer_points: current?.prayer_points || [] });
    const persist = { ...cols, is_anonymous: isAnonymous, category_ids: categoryIds || [] };
    // An author correcting the request's language: metadata beside the group
    // envelope. Omitted entirely when the caller doesn't state one, so an edit
    // never wipes an existing stamp.
    if (contentLanguage !== undefined) persist.content_language = contentLanguage;
    const { error } = await supabase.from('community_prayers').update(persist).eq('id', prayerId);
    if (error) return toError(error);
    set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, p => ({
      ...p, title, description, is_anonymous: isAnonymous, category_ids: categoryIds || [],
      ...(contentLanguage !== undefined ? { content_language: contentLanguage } : {}),
    })) }));
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
    const groupId = get().prayers.find((p) => p.id === prayerId)?.group_id || get().activeGroupId;
    return decryptCommunityRows(groupKeyResolver(groupId), data || []);
  },

  // A member's update on a community prayer stays community-side, encrypted under
  // the group key. It is NOT synced back into the owner's personal prayer (that's
  // a different key, and a member can't write the owner's row) — the owner sees it
  // read-only via the shared-activity view. `sourcePrayerId` is still accepted for
  // caller compatibility but no longer drives a server-side plaintext fan-out.
  addUpdate: async ({ prayerId, userId, authorName, text, isAnonymous, contentLanguage = null, attachments = [] }) => {
    const groupId = get().prayers.find((p) => p.id === prayerId)?.group_id || get().activeGroupId;
    const gk = await ensureGroupKey(groupId);
    const cols = await encUpdateCols(gk, text, attachments);
    const { error } = await supabase
      .from('community_updates')
      .insert({ community_prayer_id: prayerId, user_id: userId, author_name: authorName, is_anonymous: isAnonymous, content_language: contentLanguage, ...cols });
    if (error) return toError(error);
    const updated = await fetchPrayerWithCounts(prayerId);
    if (updated) set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, () => updated) }));
    return {};
  },

  // Delete a member's word. RLS lets the update's author or a group admin remove
  // it; passing prayerId lets us refresh the prayer's update count afterwards.
  deleteCommunityUpdate: async (updateId, prayerId) => {
    const { error } = await supabase.from('community_updates').delete().eq('id', updateId);
    if (error) return toError(error);
    if (prayerId) {
      const updated = await fetchPrayerWithCounts(prayerId);
      if (updated) set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, () => updated) }));
    }
    return {};
  },

  // Author-only text edit of a member's word. Re-encrypts the row's payload
  // (new text + the row's existing attachments, untouched) under the group key
  // and rewrites it. RLS "Authors can update their updates" (attachment_
  // management.sql) scopes this to the author — an admin can moderate by
  // deleting, but never rewrite someone else's words. The updates list lives in
  // the caller (PrayerDetail), so this returns the new text for it to patch.
  editCommunityUpdate: async (prayerId, update, text) => {
    const groupId = get().prayers.find((p) => p.id === prayerId)?.group_id || get().activeGroupId;
    const gk = await ensureGroupKey(groupId);
    const cols = await encUpdateCols(gk, text, update.attachments || []);
    const { error } = await supabase.from('community_updates').update(cols).eq('id', update.id);
    if (error) return toError(error);
    return { text };
  },

  // Delete one attachment from the viewer's OWN word, re-encrypting the row's
  // payload under the group key (RLS: "Authors can update their updates" —
  // see supabase/attachment_management.sql). Returns the shrunk list so the
  // caller can patch its local copy; the encrypted storage blob is removed
  // best-effort (the author owns the object path).
  removeCommunityUpdateAttachment: async (prayerId, update, attId) => {
    const removed = (update.attachments || []).find((a) => a.id === attId);
    if (!removed) return {};
    const attachments = update.attachments.filter((a) => a.id !== attId);
    // Removing the last content deletes the whole word — an empty row would
    // otherwise linger as a bare author+date shell.
    if (!attachments.length && !update.text) {
      const res = await get().deleteCommunityUpdate(update.id, prayerId);
      if (res?.error) return res;
      removeAttachmentFiles([removed]);
      return { deleted: true };
    }
    const groupId = get().prayers.find((p) => p.id === prayerId)?.group_id || get().activeGroupId;
    const gk = await ensureGroupKey(groupId);
    const cols = await encUpdateCols(gk, update.text || '', attachments);
    const { error } = await supabase.from('community_updates').update(cols).eq('id', update.id);
    if (error) return toError(error);
    removeAttachmentFiles([removed]);
    return { attachments };
  },

  // Blank the text of the viewer's own word; deletes the whole word instead
  // when it has no attachments left to justify the row.
  removeCommunityUpdateText: async (prayerId, update) => {
    if (!update.text) return {};
    if (!(update.attachments || []).length) {
      const res = await get().deleteCommunityUpdate(update.id, prayerId);
      return res?.error ? res : { deleted: true };
    }
    const groupId = get().prayers.find((p) => p.id === prayerId)?.group_id || get().activeGroupId;
    const gk = await ensureGroupKey(groupId);
    const cols = await encUpdateCols(gk, '', update.attachments);
    const { error } = await supabase.from('community_updates').update(cols).eq('id', update.id);
    if (error) return toError(error);
    return { text: '' };
  },

  // Same for the viewer's own testimony (RLS: "Authors can update their
  // testimonies"). The testimonies list lives in this store, so it is patched
  // here directly.
  removeCommunityTestimonyAttachment: async (testimony, attId) => {
    const removed = (testimony.attachments || []).find((a) => a.id === attId);
    if (!removed) return {};
    const attachments = testimony.attachments.filter((a) => a.id !== attId);
    if (!attachments.length && !testimony.content) {
      const res = await get().deleteCommunityTestimony(testimony.id);
      if (res?.error) return res;
      removeAttachmentFiles([removed]);
      return { deleted: true };
    }
    const gk = await ensureGroupKey(testimony.group_id);
    const cols = await encTestimonyCols(gk, testimony.content || '', attachments);
    const { error } = await supabase.from('testimonies').update(cols).eq('id', testimony.id);
    if (error) return toError(error);
    removeAttachmentFiles([removed]);
    set(state => ({ testimonies: state.testimonies.map(tm => (tm.id === testimony.id ? { ...tm, attachments } : tm)) }));
    return { attachments };
  },

  // Blank the text of the viewer's own testimony; deletes the whole row when
  // no attachments remain (same cascade as words above).
  removeCommunityTestimonyText: async (testimony) => {
    if (!testimony.content) return {};
    if (!(testimony.attachments || []).length) {
      const res = await get().deleteCommunityTestimony(testimony.id);
      return res?.error ? res : { deleted: true };
    }
    const gk = await ensureGroupKey(testimony.group_id);
    const cols = await encTestimonyCols(gk, '', testimony.attachments);
    const { error } = await supabase.from('testimonies').update(cols).eq('id', testimony.id);
    if (error) return toError(error);
    set(state => ({ testimonies: state.testimonies.map(tm => (tm.id === testimony.id ? { ...tm, content: '' } : tm)) }));
    return { content: '' };
  },

  // Author-only whole-row delete (RLS: "Authors can delete their testimonies"
  // — supabase/attachment_management.sql). Media cleanup stays with callers,
  // which know whether files remain.
  deleteCommunityTestimony: async (testimonyId) => {
    const { error } = await supabase.from('testimonies').delete().eq('id', testimonyId);
    if (error) return toError(error);
    set(state => ({ testimonies: state.testimonies.filter(tm => tm.id !== testimonyId) }));
    return {};
  },

  // Author-only text edit of a testimony (RLS: "Authors can update their
  // testimonies"). Re-encrypts new content + the existing attachments under the
  // group key. The testimonies list lives in this store, so it is patched here.
  editCommunityTestimony: async (testimony, content) => {
    const gk = await ensureGroupKey(testimony.group_id);
    const cols = await encTestimonyCols(gk, content, testimony.attachments || []);
    const { error } = await supabase.from('testimonies').update(cols).eq('id', testimony.id);
    if (error) return toError(error);
    set(state => ({ testimonies: state.testimonies.map(tm => (tm.id === testimony.id ? { ...tm, content } : tm)) }));
    return { content };
  },

  fetchTestimonies: async (groupId) => {
    const { data } = await supabase
      .from('testimonies')
      .select('*, community_prayers(title, category_ids)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (data) set({ testimonies: await decryptCommunityRows(groupKeyResolver(groupId), data) });
  },

  // Append a prayer point to a community prayer, re-encrypting the content bundle
  // (title/description/points share one payload). Community-side only — no
  // personal fan-out. `sourcePrayerId` is accepted for caller compatibility.
  addCommunityPrayerPoint: async (prayerId, point) => {
    // Normalize legacy single-verse points ({ verse }) into a verses array.
    const verses = point.verses
      ? point.verses
      : point.verse ? [{ ref: point.verse, text: point.verseText || '' }] : [];

    const current = get().prayers.find(p => p.id === prayerId);
    if (!current) return { error: 'Prayer not found' };
    const newPoint = { id: crypto.randomUUID(), title: point.title, verses };
    const points = [...(current.prayer_points || []), newPoint];
    const gk = await ensureGroupKey(current.group_id);
    const cols = await encPrayerCols(gk, { title: current.title || '', description: current.description || '', prayer_points: points });
    const { error } = await supabase.from('community_prayers').update(cols).eq('id', prayerId);
    if (error) {
      devError('addCommunityPrayerPoint failed', error?.status);
      return toError(error);
    }
    set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, p => ({ ...p, prayer_points: points })) }));
    return {};
  },

  // Remove a point, re-encrypting the remaining content bundle. Community-side only.
  removeCommunityPrayerPoint: async (prayerId, pointId) => {
    const current = get().prayers.find(p => p.id === prayerId);
    const points = (current?.prayer_points || []).filter(pp => pp.id !== pointId);
    const gk = await ensureGroupKey(current?.group_id);
    const cols = await encPrayerCols(gk, { title: current?.title || '', description: current?.description || '', prayer_points: points });
    const { error } = await supabase.from('community_prayers').update(cols).eq('id', prayerId);
    if (error) return toError(error);
    set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, p => ({ ...p, prayer_points: points })) }));
    return {};
  },

  addCommunityVerse: async (prayerId, pointId, verse) => {
    const current = get().prayers.find(p => p.id === prayerId);
    const points = (current?.prayer_points || []).map(pp => pp.id === pointId ? { ...pp, verses: [...(pp.verses || []), verse] } : pp);
    const gk = await ensureGroupKey(current?.group_id);
    const cols = await encPrayerCols(gk, { title: current?.title || '', description: current?.description || '', prayer_points: points });
    const { error } = await supabase.from('community_prayers').update(cols).eq('id', prayerId);
    if (error) return toError(error);
    set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, p => ({ ...p, prayer_points: points })) }));
    return {};
  },

  removeCommunityVerse: async (prayerId, pointId, verseRef) => {
    const current = get().prayers.find(p => p.id === prayerId);
    const points = (current?.prayer_points || []).map(pp => pp.id === pointId ? { ...pp, verses: (pp.verses || []).filter(v => v.ref !== verseRef) } : pp);
    const gk = await ensureGroupKey(current?.group_id);
    const cols = await encPrayerCols(gk, { title: current?.title || '', description: current?.description || '', prayer_points: points });
    const { error } = await supabase.from('community_prayers').update(cols).eq('id', prayerId);
    if (error) return toError(error);
    set(state => ({ prayers: updatePrayerInList(state.prayers, prayerId, p => ({ ...p, prayer_points: points })) }));
    return {};
  },

  addTestimony: async ({ groupId, userId, authorName, content, isAnonymous, communityPrayerId, contentLanguage = null, attachments = [] }) => {
    const gk = await ensureGroupKey(groupId);
    const cols = await encTestimonyCols(gk, content, attachments);
    const { data, error } = await supabase
      .from('testimonies')
      .insert({ group_id: groupId, user_id: userId, author_name: authorName, ...cols, is_anonymous: isAnonymous, community_prayer_id: communityPrayerId || null, content_language: contentLanguage })
      .select('*, community_prayers(title, category_ids)')
      .single();
    if (error) return toError(error);
    // Keep plaintext content in memory (the server row's content column is redacted).
    const plaintext = { ...data, content, attachments };
    set(state => ({ testimonies: [plaintext, ...state.testimonies] }));
    return { testimony: plaintext };
  },

  // ── Friends & Requests ──────────────────────────────────────────────────────
  // Send a friend request to a user identified by email. fromUserId is the
  // current user. Returns { error: 'notFound' | 'self' | 'exists' | msg } on failure.
  sendFriendRequest: async (email, fromUserId) => {
    const { data: toUserId, error: lookupError } = await supabase.rpc('find_user_by_email', { p_email: email });
    if (lookupError) return toError(lookupError);
    if (!toUserId) return { error: 'notFound' };
    return get().sendFriendRequestToId(toUserId, fromUserId);
  },

  // Send a request directly by user id (used by group suggestions + invite links).
  // Returns { error: 'self' | 'alreadyFriends' | 'exists' | msg } or {}.
  sendFriendRequestToId: async (toUserId, fromUserId) => {
    if (!toUserId || toUserId === fromUserId) return { error: 'self' };
    const [a, b] = orderedPair(fromUserId, toUserId);
    const { data: existing } = await supabase
      .from('friendships').select('user_id').eq('user_id', a).eq('friend_id', b).maybeSingle();
    if (existing) return { error: 'alreadyFriends' };
    const { error } = await supabase
      .from('friend_requests')
      .insert({ from_user_id: fromUserId, to_user_id: toUserId });
    if (error) return { error: 'exists' };
    return {};
  },

  // People in the user's groups who aren't already friends or pending — the most
  // natural friend suggestions. Returns [{ id, name }].
  fetchFriendSuggestions: async (userId) => {
    const { data: members } = await supabase.from('group_members').select('user_id'); // RLS-scoped to my groups
    const candidates = [...new Set((members || []).map((m) => m.user_id))].filter((id) => id !== userId);
    if (candidates.length === 0) return { suggestions: [] };

    const { data: friends } = await supabase
      .from('friendships').select('user_id, friend_id').or(`user_id.eq.${userId},friend_id.eq.${userId}`);
    const friendIds = new Set((friends || []).map((f) => (f.user_id === userId ? f.friend_id : f.user_id)));

    const { data: reqs } = await supabase
      .from('friend_requests').select('from_user_id, to_user_id').or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
    const pending = new Set((reqs || []).flatMap((r) => [r.from_user_id, r.to_user_id]));

    const ids = candidates.filter((id) => !friendIds.has(id) && !pending.has(id));
    const nameOf = await resolveNames(ids);
    return { suggestions: ids.map((id) => ({ id, name: nameOf(id) })) };
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

  // Outgoing requests the user has sent that haven't been accepted yet,
  // enriched with the recipient's display name. Cancel one by deleting it
  // with rejectFriendRequest (the sender is allowed to delete by RLS).
  fetchSentFriendRequests: async (userId) => {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('from_user_id', userId);
    if (error) return { error: error.message };
    const nameOf = await resolveNames((data || []).map(r => r.to_user_id));
    return { requests: (data || []).map(r => ({ ...r, toName: nameOf(r.to_user_id) })) };
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
    const invitations = (data || []).map(i => {
      const inviter = nameOf(i.invited_by);
      return {
        ...i,
        // Null (not "?") when unresolved so the UI can show meaningful fallback copy.
        groupName: i.groups?.name || null,
        inviterName: inviter && inviter !== '?' ? inviter : null,
      };
    });
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

  // Promote a member to admin or demote a non-owner admin back to member.
  // All authorization is enforced inside the set_group_member_role RPC
  // (SECURITY DEFINER): the acting user is auth.uid() server-side — we never
  // send the current user id as authorization data, and never optimistically
  // mutate the role client-side for this security-sensitive change. The RPC
  // returns stable single-token error messages the UI maps to localized copy.
  setMemberRole: async (groupId, memberId, role) => {
    const { data, error } = await supabase.rpc('set_group_member_role', {
      p_group_id: groupId,
      p_target_user_id: memberId,
      p_role: role,
    });
    if (error) return toError(error);
    return { membership: data };
  },

  // Remove another member from a group. Guarded by the remove_group_member RPC,
  // which refuses to remove the creator, the caller themselves (that is "leave
  // group"), or the final remaining admin — so a promoted admin can't abuse it.
  removeMember: async (groupId, memberId) => {
    const { error } = await supabase.rpc('remove_group_member', {
      p_group_id: groupId,
      p_target_user_id: memberId,
    });
    return error ? toError(error) : {};
  },

  // ── Group prayer calendar (commitments) ────────────────────────────────────
  // Prayer-chain style: a member claims a local day for a community prayer
  // ("I'll pray for this on the 18th"). The group sees its coverage, and each
  // claimed day also lands on the member's personal calendar (fetchMyCommitments).

  // All commitments for one community prayer, day-ascending.
  fetchCommitments: async (communityPrayerId) => {
    const { data, error } = await supabase
      .from('prayer_commitments')
      .select('*')
      .eq('community_prayer_id', communityPrayerId)
      .order('day', { ascending: true });
    if (error) return { error: error.message };
    return { commitments: data || [] };
  },

  // Claim a day. Unique (prayer, user, day) → a duplicate claim is a no-op.
  addCommitment: async ({ communityPrayerId, groupId, userId, userName, day, slot = null }) => {
    const { data, error } = await supabase
      .from('prayer_commitments')
      .upsert(
        { community_prayer_id: communityPrayerId, group_id: groupId, user_id: userId, user_name: userName || '', day, slot },
        { onConflict: 'community_prayer_id,user_id,day' }
      )
      .select()
      .single();
    if (error) return toError(error);
    return { commitment: data };
  },

  removeCommitment: async (commitmentId) => {
    const { error } = await supabase.from('prayer_commitments').delete().eq('id', commitmentId);
    return error ? toError(error) : {};
  },

  // The user's commitments across all groups from a day onward, joined with the
  // prayer title + group name so the personal calendar can render them standalone.
  fetchMyCommitments: async (userId, fromDay) => {
    const { data, error } = await supabase
      .from('prayer_commitments')
      .select('id, community_prayer_id, group_id, day, slot, community_prayers(title), groups(name)')
      .eq('user_id', userId)
      .gte('day', fromDay)
      .order('day', { ascending: true });
    if (error) return;
    set({
      myCommitments: (data || []).map((c) => ({
        id: c.id,
        community_prayer_id: c.community_prayer_id,
        group_id: c.group_id,
        day: c.day,
        slot: c.slot,
        title: c.community_prayers?.title || '?',
        group_name: c.groups?.name || '',
      })),
    });
  },
}));

export default useCommunityStore;
