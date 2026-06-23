import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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
async function syncSharedCopies(prayerId, updates) {
  const payload = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.categoryIds !== undefined) payload.category_ids = updates.categoryIds;
  if (Object.keys(payload).length === 0) return;
  await supabase.from('community_prayers').update(payload).eq('source_prayer_id', prayerId);
}

const usePrayerStore = create((set, get) => ({
  prayers: [],
  categories: [],
  settings: {
    dailyReminderEnabled: false,
    dailyReminderTime: '07:00',
    followUpEnabled: false,
    followUpDays: 7,
    callReminderEnabled: false,
    notificationsGranted: false,
    language: (() => {
      const saved = localStorage.getItem('pfm_language');
      if (saved && ['fr', 'en', 'de', 'pt'].includes(saved)) return saved;
      const nav = (navigator.language || navigator.userLanguage || 'fr').toLowerCase().slice(0, 2);
      return ['fr', 'en', 'de', 'pt'].includes(nav) ? nav : 'en';
    })(),
    theme: localStorage.getItem('pfm_theme') || 'light',
  },
  loading: false,

  // ─── Load all data ───────────────────────────────────────────
  loadData: async (userId) => {
    set({ loading: true });

    // Load categories (create defaults if first time)
    let { data: cats } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');

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

    // Load prayers with updates, points and categories
    const { data: prayers } = await supabase
      .from('prayers')
      .select(`*, prayer_updates(*), prayer_points(*), prayer_categories(category_id)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    set({ categories: cats || [], prayers: prayers || [], loading: false });
  },

  // ─── Prayers ─────────────────────────────────────────────────
  addPrayer: async (prayer) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('prayers')
      .insert({
        user_id: user.id,
        title: prayer.title,
        description: prayer.description || '',
        for_other: prayer.forOther || false,
        person_name: prayer.personName || '',
        phone: prayer.phone || '',
        status: 'active',
      })
      .select(`*, prayer_updates(*), prayer_points(*), prayer_categories(category_id)`)
      .single();

    if (!error && data) {
      const categoryIds = prayer.categoryIds || [];
      if (categoryIds.length > 0) {
        await supabase.from('prayer_categories').insert(
          categoryIds.map((cid) => ({ prayer_id: data.id, category_id: cid }))
        );
        data.prayer_categories = categoryIds.map((cid) => ({ category_id: cid }));
      }
      set((state) => ({ prayers: [data, ...state.prayers] }));
    }
  },

  // Saves a community prayer into the user's personal list as a snapshot copy
  // (title, description, prayer points). Not ongoing-synced; deduped by origin.
  addFromCommunity: async (communityPrayer) => {
    const existing = get().prayers.find((p) => p.community_origin_id === communityPrayer.id);
    if (existing) return { prayer: existing, alreadyAdded: true };

    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('prayers')
      .insert({
        user_id: user.id,
        title: communityPrayer.title,
        description: communityPrayer.description || '',
        status: 'active',
        community_origin_id: communityPrayer.id,
      })
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

  updatePrayer: async (id, updates) => {
    const payload = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.forOther !== undefined) payload.for_other = updates.forOther;
    if (updates.personName !== undefined) payload.person_name = updates.personName;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    payload.updated_at = new Date().toISOString();

    const { data } = await supabase.from('prayers').update(payload).eq('id', id).select().single();

    if (updates.categoryIds !== undefined) {
      await supabase.from('prayer_categories').delete().eq('prayer_id', id);
      if (updates.categoryIds.length > 0) {
        await supabase.from('prayer_categories').insert(
          updates.categoryIds.map((cid) => ({ prayer_id: id, category_id: cid }))
        );
      }
    }

    await syncSharedCopies(id, updates);

    if (data) {
      set((state) => ({
        prayers: state.prayers.map((p) => {
          if (p.id !== id) return p;
          const prayer_categories = updates.categoryIds !== undefined
            ? updates.categoryIds.map((cid) => ({ category_id: cid }))
            : p.prayer_categories;
          return { ...p, ...data, prayer_categories };
        }),
      }));
    }
  },

  markAnswered: async (id, testimony) => {
    const { data } = await supabase
      .from('prayers')
      .update({ status: 'answered', testimony: testimony || '', answered_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (data) {
      set((state) => ({ prayers: state.prayers.map((p) => p.id === id ? { ...p, ...data } : p) }));
      await supabase.from('community_prayers').update({ is_answered: true }).eq('source_prayer_id', id);
    }
  },

  markActive: async (id) => {
    const { data } = await supabase.from('prayers').update({ status: 'active', answered_at: null }).eq('id', id).select().single();
    if (data) {
      set((state) => ({ prayers: state.prayers.map((p) => p.id === id ? { ...p, ...data } : p) }));
      await supabase.from('community_prayers').update({ is_answered: false }).eq('source_prayer_id', id);
    }
  },

  deletePrayer: async (id) => {
    await supabase.from('prayers').delete().eq('id', id);
    set((state) => ({ prayers: state.prayers.filter((p) => p.id !== id) }));
  },

  // ─── Updates ─────────────────────────────────────────────────
  // Routed through sync_add_update so the update also fans out to any shared
  // community copies. For non-shared prayers it just writes prayer_updates.
  addUpdate: async (prayerId, text, authorName = '') => {
    const { data } = await supabase.rpc('sync_add_update', {
      p_source: prayerId, p_text: text, p_author: authorName, p_anon: false,
    });

    if (data) {
      set((state) => ({
        prayers: state.prayers.map((p) =>
          p.id === prayerId
            ? { ...p, prayer_updates: [...(p.prayer_updates || []), data] }
            : p
        ),
      }));
    }
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

    const { data } = await supabase.rpc('sync_add_point', {
      p_source: prayerId, p_title: point.title, p_verses: initialVerses,
    });

    if (data) {
      set((state) => ({
        prayers: state.prayers.map((p) =>
          p.id === prayerId
            ? { ...p, prayer_points: [...(p.prayer_points || []), data] }
            : p
        ),
      }));
    }
  },

  // Verse/point mutations route through the sync_* RPCs so they also propagate
  // to any shared community copies (no-op fan-out when the prayer isn't shared).
  addVerseToPoint: async (prayerId, pointId, verse) => {
    const state = get();
    const prayer = state.prayers.find(p => p.id === prayerId);
    const point = (prayer?.prayer_points || []).find(pp => pp.id === pointId);
    if (!point) return;
    const updated = [...(point.verses || []), verse];
    await supabase.rpc('sync_add_verse', { p_source: prayerId, p_point_id: pointId, p_verse: verse });
    set((s) => ({
      prayers: s.prayers.map(p =>
        p.id === prayerId
          ? { ...p, prayer_points: p.prayer_points.map(pp => pp.id === pointId ? { ...pp, verses: updated } : pp) }
          : p
      ),
    }));
  },

  removeVerseFromPoint: async (prayerId, pointId, verseRef) => {
    const state = get();
    const prayer = state.prayers.find(p => p.id === prayerId);
    const point = (prayer?.prayer_points || []).find(pp => pp.id === pointId);
    if (!point) return;
    const updated = (point.verses || []).filter(v => v.ref !== verseRef);
    await supabase.rpc('sync_remove_verse', { p_source: prayerId, p_point_id: pointId, p_verse_ref: verseRef });
    set((s) => ({
      prayers: s.prayers.map(p =>
        p.id === prayerId
          ? { ...p, prayer_points: p.prayer_points.map(pp => pp.id === pointId ? { ...pp, verses: updated } : pp) }
          : p
      ),
    }));
  },

  removePrayerPoint: async (prayerId, pointId) => {
    await supabase.rpc('sync_remove_point', { p_source: prayerId, p_point_id: pointId });
    set((state) => ({
      prayers: state.prayers.map((p) =>
        p.id === prayerId
          ? { ...p, prayer_points: (p.prayer_points || []).filter((pp) => pp.id !== pointId) }
          : p
      ),
    }));
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

    return prayers.filter((p) => {
      if (p.status !== 'active') return false;
      const pCatIds = (p.prayer_categories || []).map((pc) => pc.category_id);
      if (pCatIds.length === 0) return true;
      return pCatIds.some((cid) => todayCatIds.includes(cid));
    });
  },
}));

export default usePrayerStore;
