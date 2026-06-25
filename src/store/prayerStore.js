import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { prayerOnDay, prayerPriority, communityToPersonalInsert, sortByOrder } from '../utils/prayer';
import { enqueue, pendingPrayerIds } from '../lib/mutationQueue';
import { loadSnapshot, saveSnapshot } from '../lib/dataCache';
import { resolveLanguage } from '../i18n';

// Soft-deletes awaiting commit: id -> { prayer snapshot, commit timer }. Module
// level so it survives store re-renders; an "Undo" toast clears the timer.
const pendingDeletes = new Map();
const UNDO_WINDOW_MS = 6000;

const DEFAULT_CATEGORIES = {
  fr: [
    { name: 'Famille', color: '#4f46e5', emoji: '👨‍👩‍👧‍👦', week_days: [1] },
    { name: 'Santé', color: '#059669', emoji: '🙏', week_days: [2] },
    { name: 'Travail & Études', color: '#d97706', emoji: '💼', week_days: [3] },
    { name: 'Église', color: '#7c3aed', emoji: '⛪', week_days: [4] },
    { name: 'Nations & Gouvernements', color: '#dc2626', emoji: '🌍', week_days: [5] },
    { name: 'Personnel & Spirituel', color: '#0891b2', emoji: '✨', week_days: [0, 6] },
  ],
  en: [
    { name: 'Family', color: '#4f46e5', emoji: '👨‍👩‍👧‍👦', week_days: [1] },
    { name: 'Health', color: '#059669', emoji: '🙏', week_days: [2] },
    { name: 'Work & Studies', color: '#d97706', emoji: '💼', week_days: [3] },
    { name: 'Church', color: '#7c3aed', emoji: '⛪', week_days: [4] },
    { name: 'Nations & Governments', color: '#dc2626', emoji: '🌍', week_days: [5] },
    { name: 'Personal & Spiritual', color: '#0891b2', emoji: '✨', week_days: [0, 6] },
  ],
  de: [
    { name: 'Familie', color: '#4f46e5', emoji: '👨‍👩‍👧‍👦', week_days: [1] },
    { name: 'Gesundheit', color: '#059669', emoji: '🙏', week_days: [2] },
    { name: 'Arbeit & Studium', color: '#d97706', emoji: '💼', week_days: [3] },
    { name: 'Kirche', color: '#7c3aed', emoji: '⛪', week_days: [4] },
    { name: 'Nationen & Regierungen', color: '#dc2626', emoji: '🌍', week_days: [5] },
    { name: 'Persönlich & Geistlich', color: '#0891b2', emoji: '✨', week_days: [0, 6] },
  ],
  pt: [
    { name: 'Família', color: '#4f46e5', emoji: '👨‍👩‍👧‍👦', week_days: [1] },
    { name: 'Saúde', color: '#059669', emoji: '🙏', week_days: [2] },
    { name: 'Trabalho & Estudos', color: '#d97706', emoji: '💼', week_days: [3] },
    { name: 'Igreja', color: '#7c3aed', emoji: '⛪', week_days: [4] },
    { name: 'Nações & Governos', color: '#dc2626', emoji: '🌍', week_days: [5] },
    { name: 'Pessoal & Espiritual', color: '#0891b2', emoji: '✨', week_days: [0, 6] },
  ],
};

// Keeps shared community copies in sync when the source personal prayer is
// edited. Only touches fields that were actually changed.
const usePrayerStore = create((set, get) => ({
  prayers: [],
  categories: [],
  userId: null,
  settings: {
    dailyReminderEnabled: false,
    dailyReminderTime: '07:00',
    followUpEnabled: false,
    followUpDays: 7,
    callReminderEnabled: false,
    notificationsGranted: false,
    language: resolveLanguage(localStorage.getItem('pfm_language'), navigator.language || navigator.userLanguage),
    theme: localStorage.getItem('pfm_theme') || 'light',
  },
  loading: true, // starts true so the first paint shows skeletons, not an empty flash

  // ─── Load all data ───────────────────────────────────────────
  loadData: async (userId) => {
    set({ loading: true, userId });

    // 1. Hydrate instantly from the local snapshot (works offline and includes
    //    any prayers created offline that aren't on the server yet).
    const snap = await loadSnapshot(userId);
    if (snap) set({ categories: snap.categories || [], prayers: snap.prayers || [], loading: false });

    // 2. Fetch authoritative data. If the network is unreachable, keep the
    //    hydrated snapshot rather than wiping it.
    let cats;
    try {
      const res = await supabase.from('categories').select('*').eq('user_id', userId).order('created_at');
      if (res.error) throw res.error;
      cats = res.data;
    } catch {
      set({ loading: false });
      return;
    }

    if (!cats || cats.length === 0) {
      const lang = get().settings.language || 'fr';
      const defaults = DEFAULT_CATEGORIES[lang] || DEFAULT_CATEGORIES.fr;
      const { data: newCats } = await supabase
        .from('categories')
        .upsert(
          defaults.map((c) => ({ ...c, user_id: userId })),
          { onConflict: 'user_id,name', ignoreDuplicates: true }
        )
        .select();
      cats = newCats && newCats.length > 0 ? newCats : (
        (await supabase.from('categories').select('*').eq('user_id', userId).order('created_at')).data || []
      );
    }

    let serverPrayers;
    try {
      const res = await supabase
        .from('prayers')
        .select(`*, prayer_updates(*), prayer_points(*), prayer_categories(category_id)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (res.error) throw res.error;
      serverPrayers = res.data || [];
    } catch {
      // Categories loaded but prayers didn't — keep hydrated prayers.
      const orderedCats = [...(cats || [])].sort((a, b) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity));
      set({ categories: orderedCats, loading: false });
      return;
    }

    // 3. Merge: server is authoritative. Keep a local-only prayer only if its
    //    creation is STILL queued — so a prayer whose create was permanently
    //    dropped (rejected) is reconciled away rather than lingering as a ghost.
    const serverIds = new Set(serverPrayers.map((p) => p.id));
    const creating = pendingPrayerIds();
    const pendingLocal = get().prayers.filter((p) => !serverIds.has(p.id) && creating.has(p.id));
    const mergedPrayers = [...pendingLocal, ...serverPrayers];

    const ordered = [...(cats || [])].sort((a, b) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity));
    set({ categories: ordered, prayers: mergedPrayers, loading: false });
    saveSnapshot(userId, { categories: ordered, prayers: mergedPrayers });
    // Mirror shared content of saved-from-community prayers (fully-shared sync).
    get().refreshSavedCopies();
  },

  // Refetch a single personal prayer from the server and replace it in state.
  // Used to reflect community-side edits (two-way sync) back onto the owner's
  // personal copy in-session. No-op for prayers the user can't read (non-owner).
  refreshPrayer: async (prayerId) => {
    const { data } = await supabase
      .from('prayers')
      .select(`*, prayer_updates(*), prayer_points(*), prayer_categories(category_id)`)
      .eq('id', prayerId)
      .maybeSingle();
    if (data) set((state) => ({ prayers: state.prayers.map((p) => (p.id === prayerId ? data : p)) }));
  },

  // Batch version of refreshFromCommunity: mirror the shared content of ALL
  // saved-from-community prayers from their linked community prayers in one query.
  // Run on load so saved copies reflect the current shared content (incl. edits
  // synced from other members), without opening each one.
  refreshSavedCopies: async () => {
    const saved = get().prayers.filter((p) => p.community_origin_id);
    if (saved.length === 0) return;
    const { data } = await supabase
      .from('community_prayers')
      .select('id, title, description, prayer_points')
      .in('id', saved.map((p) => p.community_origin_id));
    if (!data) return;
    const byId = Object.fromEntries(data.map((c) => [c.id, c]));
    set((state) => ({
      prayers: state.prayers.map((p) => {
        const c = p.community_origin_id && byId[p.community_origin_id];
        if (!c) return p;
        return {
          ...p,
          title: c.title ?? p.title,
          description: c.description ?? p.description,
          prayer_points: (c.prayer_points || []).map((pp) => ({ id: pp.id, title: pp.title, verses: pp.verses || [] })),
        };
      }),
    }));
  },

  // Fetch testimonies + member updates posted on the community copies of a
  // personal prayer (whether it's the shared source or a saved copy), so they
  // can be shown read-only in the personal prayer detail.
  fetchSharedActivity: async (prayer) => {
    let ids = [];
    if (prayer.community_origin_id) {
      ids = [prayer.community_origin_id];
    } else {
      const { data } = await supabase.from('community_prayers').select('id').eq('source_prayer_id', prayer.id);
      ids = (data || []).map((c) => c.id);
    }
    if (ids.length === 0) return { testimonies: [], updates: [] };
    const [tRes, uRes] = await Promise.all([
      supabase.from('testimonies').select('*').in('community_prayer_id', ids).order('created_at'),
      supabase.from('community_updates').select('*').in('community_prayer_id', ids).order('created_at', { ascending: true }),
    ]);
    return { testimonies: tRes.data || [], updates: uRes.data || [] };
  },

  // One-way pull for prayers saved from the community: refresh the saved copy's
  // shared content (title, description, prayer points) from the linked community
  // prayer so the owner sees the author's/group's latest. Personal fields
  // (scheduling, categories, status, testimonies) are left untouched.
  refreshFromCommunity: async (prayerId) => {
    const p = get().prayers.find((x) => x.id === prayerId);
    if (!p?.community_origin_id) return;
    const { data } = await supabase
      .from('community_prayers')
      .select('title, description, prayer_points')
      .eq('id', p.community_origin_id)
      .maybeSingle();
    if (!data) return; // not a member anymore / not found → keep the snapshot
    const points = (data.prayer_points || []).map((pp) => ({ id: pp.id, title: pp.title, verses: pp.verses || [] }));
    set((state) => ({
      prayers: state.prayers.map((x) =>
        x.id === prayerId
          ? { ...x, title: data.title ?? x.title, description: data.description ?? x.description, prayer_points: points }
          : x
      ),
    }));
  },

  // ─── Prayers ─────────────────────────────────────────────────
  // Optimistic + offline-capable: the prayer appears immediately and the server
  // write is queued (replayed on reconnect). A client-generated id keeps the
  // local record and the eventual server row in sync.
  addPrayer: async (prayer) => {
    // getSession reads the locally-cached session (no network), so this works offline.
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const id = crypto.randomUUID();
    const categoryIds = prayer.categoryIds || [];
    const row = {
      id,
      user_id: userId,
      title: prayer.title,
      description: prayer.description || '',
      for_other: prayer.forOther || false,
      person_name: prayer.personName || '',
      phone: prayer.phone || '',
      status: 'active',
    };

    const optimistic = {
      ...row,
      created_at: new Date().toISOString(),
      prayer_updates: [],
      prayer_points: [],
      prayer_categories: categoryIds.map((category_id) => ({ category_id })),
    };
    set((state) => ({ prayers: [optimistic, ...state.prayers] }));
    enqueue('createPrayer', { row, categoryIds });
  },

  // Saves a community prayer into the user's personal list as a snapshot copy
  // (title, description, prayer points). Not ongoing-synced; deduped by origin.
  addFromCommunity: async (communityPrayer, groupName = null) => {
    const existing = get().prayers.find((p) => p.community_origin_id === communityPrayer.id);
    if (existing) return { prayer: existing, alreadyAdded: true };

    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('prayers')
      .insert(communityToPersonalInsert(communityPrayer, groupName, user.id))
      .select(`*, prayer_updates(*), prayer_points(*), prayer_categories(category_id)`)
      .single();
    if (error || !data) return { error: error?.message || 'failed' };

    // Copy current prayer points (categories are skipped — they belong to the author).
    const points = (communityPrayer.prayer_points || []).map((pp) => ({
      prayer_id: data.id, title: pp.title, verses: pp.verses || [],
    }));
    if (points.length > 0) {
      const { data: inserted } = await supabase.from('prayer_points').insert(points).select();
      data.prayer_points = inserted || [];
    }

    set((state) => ({ prayers: [data, ...state.prayers] }));
    return { prayer: data };
  },

  // Optimistic + offline-capable. Fields map to snake_case; category links and
  // shared-copy mirroring are handled idempotently by the executor.
  updatePrayer: async (id, updates) => {
    const payload = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.forOther !== undefined) payload.for_other = updates.forOther;
    if (updates.personName !== undefined) payload.person_name = updates.personName;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.weekDays !== undefined) payload.week_days = updates.weekDays;
    if (updates.pinned !== undefined) payload.pinned = updates.pinned;
    payload.updated_at = new Date().toISOString();

    const community = {};
    if (updates.title !== undefined) community.title = updates.title;
    if (updates.description !== undefined) community.description = updates.description;
    if (updates.categoryIds !== undefined) community.category_ids = updates.categoryIds;

    set((state) => ({
      prayers: state.prayers.map((p) => {
        if (p.id !== id) return p;
        const prayer_categories = updates.categoryIds !== undefined
          ? updates.categoryIds.map((category_id) => ({ category_id }))
          : p.prayer_categories;
        return { ...p, ...payload, prayer_categories };
      }),
    }));
    enqueue('updatePrayer', { id, payload, categoryIds: updates.categoryIds, community });
  },

  // Reverse direction: when the owner edits categories on a shared community
  // prayer, push them back to the personal source and all its community copies.
  // Owner-only (categories belong to the owner's category set).
  syncCategoriesFromCommunity: async (sourcePrayerId, categoryIds) => {
    const ids = categoryIds || [];
    await supabase.from('prayer_categories').delete().eq('prayer_id', sourcePrayerId);
    if (ids.length > 0) {
      await supabase.from('prayer_categories').insert(ids.map((cid) => ({ prayer_id: sourcePrayerId, category_id: cid })));
    }
    await supabase.from('community_prayers').update({ category_ids: ids }).eq('source_prayer_id', sourcePrayerId);
    set((state) => ({
      prayers: state.prayers.map((p) =>
        p.id === sourcePrayerId ? { ...p, prayer_categories: ids.map((cid) => ({ category_id: cid })) } : p
      ),
    }));
  },

  markAnswered: async (id, testimony) => {
    const answered_at = new Date().toISOString();
    const trimmed = (testimony || '').trim();
    // One new testimony (if any) — appended locally and server-side, never overwriting.
    const newTestimony = trimmed ? { id: crypto.randomUUID(), content: trimmed, created_at: answered_at } : null;
    set((state) => ({
      prayers: state.prayers.map((p) => {
        if (p.id !== id) return p;
        const testimonies = newTestimony ? [...(p.testimonies || []), newTestimony] : (p.testimonies || []);
        return { ...p, status: 'answered', testimonies, answered_at };
      }),
    }));
    enqueue('markAnswered', { id, answered_at, testimony: newTestimony });
  },

  markActive: async (id) => {
    set((state) => ({ prayers: state.prayers.map((p) => p.id === id ? { ...p, status: 'active', answered_at: null } : p) }));
    enqueue('markActive', { id });
  },

  // Pin/unpin a prayer so it floats to the top of the lists (personal organisation).
  togglePin: (id) => {
    const p = get().prayers.find((x) => x.id === id);
    if (p) get().updatePrayer(id, { pinned: !p.pinned });
  },

  // Immediate, non-undoable delete (used internally when a soft-delete commits).
  deletePrayer: async (id) => {
    set((state) => ({ prayers: state.prayers.filter((p) => p.id !== id) }));
    enqueue('deletePrayer', { id });
  },

  // Optimistically hide a prayer and defer the real delete, so an "Undo" toast
  // can cancel it. Returns the removed prayer (for callers that want a snapshot).
  softDeletePrayer: (id) => {
    const prayer = get().prayers.find((p) => p.id === id);
    if (!prayer) return null;
    set((state) => ({ prayers: state.prayers.filter((p) => p.id !== id) }));
    const timer = setTimeout(() => {
      pendingDeletes.delete(id);
      enqueue('deletePrayer', { id });
    }, UNDO_WINDOW_MS);
    pendingDeletes.set(id, { prayer, timer });
    return prayer;
  },

  // Cancel a pending soft-delete and restore the prayer to the list.
  undoDelete: (id) => {
    const entry = pendingDeletes.get(id);
    if (!entry) return;
    clearTimeout(entry.timer);
    pendingDeletes.delete(id);
    set((state) => (state.prayers.some((p) => p.id === id)
      ? state
      : { prayers: [entry.prayer, ...state.prayers] }));
  },

  // ─── Updates ─────────────────────────────────────────────────
  // Routed through sync_add_update so the update also fans out to any shared
  // community copies. For non-shared prayers it just writes prayer_updates.
  addUpdate: async (prayerId, text, authorName = '') => {
    const id = crypto.randomUUID();
    const row = { id, prayer_id: prayerId, text, author_name: authorName, is_anonymous: false, created_at: new Date().toISOString() };
    set((state) => ({
      prayers: state.prayers.map((p) =>
        p.id === prayerId ? { ...p, prayer_updates: [...(p.prayer_updates || []), row] } : p
      ),
    }));
    enqueue('addUpdate', { id, prayerId, text, authorName });
  },

  // ─── Prayer Points ────────────────────────────────────────────
  // Routed through sync_add_point so the point also fans out to any shared
  // community copies. For non-shared prayers it just writes prayer_points.
  addPrayerPoint: async (prayerId, point) => {
    // Build initial verses array from legacy single-verse fields or provided verses
    const initialVerses = point.verses
      ? point.verses
      : point.verse
        ? [{ ref: point.verse, text: point.verseText || '' }]
        : [];

    const id = crypto.randomUUID();
    const row = { id, prayer_id: prayerId, title: point.title, verses: initialVerses };
    set((state) => ({
      prayers: state.prayers.map((p) =>
        p.id === prayerId ? { ...p, prayer_points: [...(p.prayer_points || []), row] } : p
      ),
    }));
    enqueue('addPrayerPoint', { id, prayerId, title: point.title, verses: initialVerses });
  },

  // Verse/point mutations route through the sync_* RPCs so they also propagate
  // to any shared community copies (no-op fan-out when the prayer isn't shared).
  addVerseToPoint: async (prayerId, pointId, verse) => {
    const state = get();
    const prayer = state.prayers.find(p => p.id === prayerId);
    const point = (prayer?.prayer_points || []).find(pp => pp.id === pointId);
    if (!point) return;
    const updated = [...(point.verses || []), verse];
    set((s) => ({
      prayers: s.prayers.map(p =>
        p.id === prayerId
          ? { ...p, prayer_points: p.prayer_points.map(pp => pp.id === pointId ? { ...pp, verses: updated } : pp) }
          : p
      ),
    }));
    enqueue('addVerse', { prayerId, pointId, verse });
  },

  removeVerseFromPoint: async (prayerId, pointId, verseRef) => {
    const state = get();
    const prayer = state.prayers.find(p => p.id === prayerId);
    const point = (prayer?.prayer_points || []).find(pp => pp.id === pointId);
    if (!point) return;
    const updated = (point.verses || []).filter(v => v.ref !== verseRef);
    set((s) => ({
      prayers: s.prayers.map(p =>
        p.id === prayerId
          ? { ...p, prayer_points: p.prayer_points.map(pp => pp.id === pointId ? { ...pp, verses: updated } : pp) }
          : p
      ),
    }));
    enqueue('removeVerse', { prayerId, pointId, verseRef });
  },

  removePrayerPoint: async (prayerId, pointId) => {
    set((state) => ({
      prayers: state.prayers.map((p) =>
        p.id === prayerId
          ? { ...p, prayer_points: (p.prayer_points || []).filter((pp) => pp.id !== pointId) }
          : p
      ),
    }));
    enqueue('removePoint', { prayerId, pointId });
  },

  // ─── Categories ───────────────────────────────────────────────
  addCategory: async (category) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name: category.name, emoji: category.emoji, color: category.color, week_days: category.weekDays || [] })
      .select().single();
    if (data) set((state) => ({ categories: [...state.categories, data] }));
  },

  updateCategory: async (id, updates) => {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.emoji !== undefined) payload.emoji = updates.emoji;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.weekDays !== undefined) payload.week_days = updates.weekDays;

    const { data } = await supabase.from('categories').update(payload).eq('id', id).select().single();
    if (data) {
      set((state) => ({ categories: state.categories.map((c) => c.id === id ? data : c) }));
    }
  },

  deleteCategory: async (id) => {
    await supabase.from('categories').delete().eq('id', id);
    set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
  },

  // ─── Settings (localStorage only) ────────────────────────────
  updateSettings: (updates) => {
    if (updates.language) localStorage.setItem('pfm_language', updates.language);
    if (updates.theme) {
      localStorage.setItem('pfm_theme', updates.theme);
      document.documentElement.setAttribute('data-theme', updates.theme);
    }
    set((state) => ({ settings: { ...state.settings, ...updates } }));
  },

  // ─── Today's prayers ─────────────────────────────────────────
  getTodaysPrayers: () => {
    const { prayers, categories } = get();
    const today = new Date().getDay();
    const todayCatIds = categories
      .filter((c) => (c.week_days || []).includes(today))
      .map((c) => c.id);
    const orderById = Object.fromEntries(categories.map((c, i) => [c.id, i]));
    return prayers
      .filter((p) => prayerOnDay(p, today, todayCatIds))
      .sort((a, b) => {
        const byPin = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        if (byPin !== 0) return byPin;
        return prayerPriority(a, orderById) - prayerPriority(b, orderById);
      });
  },

  // Persist a new category order (array of ids → sort_order = index).
  reorderCategories: async (orderedIds) => {
    set((state) => ({ categories: sortByOrder(state.categories, orderedIds) }));
    await Promise.all(orderedIds.map((id, i) => supabase.from('categories').update({ sort_order: i }).eq('id', id)));
  },
}));

// Persist prayers + categories locally on change (debounced), so the next load
// can hydrate instantly and offline — including not-yet-synced prayers.
let saveTimer;
usePrayerStore.subscribe((state) => {
  if (!state.userId) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(
    () => saveSnapshot(state.userId, { categories: state.categories, prayers: state.prayers }),
    400
  );
});

export default usePrayerStore;
