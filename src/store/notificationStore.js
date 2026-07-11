import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { devError } from '../lib/logger';

const PAGE_SIZE = 20;

// Realtime channel is kept at module scope (like communityStore's channels) so
// it survives store re-creation and can be torn down on logout/unmount.
let channel = null;

function removeChannel() {
  if (channel) {
    try { supabase.removeChannel(channel); } catch { /* already gone */ }
    channel = null;
  }
}

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  hasMore: true,
  userId: null,

  // Latest page + an accurate unread total (counted server-side across ALL rows,
  // not just the loaded page).
  fetchNotifications: async (userId) => {
    if (!userId) return;
    set({ loading: true, error: null, userId });
    try {
      const [{ data, error }, { count }] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', userId)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .is('read_at', null),
      ]);
      if (error) throw error;
      set({
        notifications: data || [],
        unreadCount: count || 0,
        hasMore: (data || []).length === PAGE_SIZE,
        loading: false,
      });
    } catch (err) {
      devError('fetchNotifications failed', err?.message);
      set({ loading: false, error: 'load' });
    }
  },

  // Older page, keyed off the oldest loaded row's created_at (keyset pagination).
  fetchMoreNotifications: async () => {
    const { userId, notifications, hasMore, loading } = get();
    if (!userId || !hasMore || loading) return;
    const oldest = notifications[notifications.length - 1];
    if (!oldest) return;
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .lt('created_at', oldest.created_at)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (error) throw error;
      const existing = new Set(notifications.map((n) => n.id));
      const fresh = (data || []).filter((n) => !existing.has(n.id));
      set({
        notifications: [...notifications, ...fresh],
        hasMore: (data || []).length === PAGE_SIZE,
        loading: false,
      });
    } catch (err) {
      devError('fetchMoreNotifications failed', err?.message);
      set({ loading: false, error: 'load' });
    }
  },

  // Live inbox: prepend inserts (deduped) and keep the unread badge accurate.
  // Also reflects read-state changes made on another device.
  subscribeNotifications: (userId) => {
    if (!userId) return () => {};
    removeChannel(); // never double-subscribe
    channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        ({ new: row }) => {
          set((state) => {
            if (state.notifications.some((n) => n.id === row.id)) return state; // dedupe
            return {
              notifications: [row, ...state.notifications],
              unreadCount: state.unreadCount + (row.read_at ? 0 : 1),
            };
          });
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        ({ new: row }) => {
          set((state) => {
            const notifications = state.notifications.map((n) => (n.id === row.id ? { ...n, ...row } : n));
            const unreadCount = notifications.filter((n) => !n.read_at).length;
            return { notifications, unreadCount };
          });
        })
      .subscribe();
    return () => removeChannel();
  },

  unsubscribeNotifications: () => removeChannel(),

  // Mark a single notification as seen (impression) — best-effort, no optimistic
  // churn since "seen" isn't shown prominently.
  markSeen: async (id) => {
    const now = new Date().toISOString();
    set((state) => ({ notifications: state.notifications.map((n) => (n.id === id && !n.seen_at ? { ...n, seen_at: now } : n)) }));
    try { await supabase.from('notifications').update({ seen_at: now }).eq('id', id).is('seen_at', null); }
    catch (err) { devError('markSeen failed', err?.message); }
  },

  markRead: async (id) => {
    const target = get().notifications.find((n) => n.id === id);
    if (!target || target.read_at) return;
    const now = new Date().toISOString();
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read_at: now, seen_at: n.seen_at || now } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    try { await supabase.from('notifications').update({ read_at: now, seen_at: now }).eq('id', id); }
    catch (err) { devError('markRead failed', err?.message); }
  },

  markAllRead: async () => {
    const { userId } = get();
    if (!userId) return;
    const now = new Date().toISOString();
    set((state) => ({
      notifications: state.notifications.map((n) => (n.read_at ? n : { ...n, read_at: now, seen_at: n.seen_at || now })),
      unreadCount: 0,
    }));
    try { await supabase.from('notifications').update({ read_at: now }).eq('recipient_id', userId).is('read_at', null); }
    catch (err) { devError('markAllRead failed', err?.message); }
  },

  // Reset on logout or when the authenticated user changes, so one account's
  // inbox never leaks into another's.
  reset: () => {
    removeChannel();
    set({ notifications: [], unreadCount: 0, loading: false, error: null, hasMore: true, userId: null });
  },
}));

export default useNotificationStore;
