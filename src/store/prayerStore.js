import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_CATEGORIES = [
  { id: 'famille', name: 'Famille', color: '#4f46e5', emoji: '👨‍👩‍👧‍👦', weekDays: [1] },
  { id: 'sante', name: 'Santé', color: '#059669', emoji: '🙏', weekDays: [2] },
  { id: 'travail', name: 'Travail & Études', color: '#d97706', emoji: '💼', weekDays: [3] },
  { id: 'eglise', name: 'Église', color: '#7c3aed', emoji: '⛪', weekDays: [4] },
  { id: 'nations', name: 'Nations & Gouvernements', color: '#dc2626', emoji: '🌍', weekDays: [5] },
  { id: 'personnel', name: 'Personnel & Spirituel', color: '#0891b2', emoji: '✨', weekDays: [0, 6] },
];

const usePrayerStore = create(
  persist(
    (set, get) => ({
      prayers: [],
      categories: DEFAULT_CATEGORIES,
      settings: {
        dailyReminderEnabled: false,
        dailyReminderTime: '07:00',
        followUpEnabled: false,
        followUpDays: 7,
        notificationsGranted: false,
      },

      // Prayer actions
      addPrayer: (prayer) => set((state) => ({
        prayers: [...state.prayers, {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          status: 'active',
          updates: [],
          ...prayer,
        }],
      })),

      updatePrayer: (id, updates) => set((state) => ({
        prayers: state.prayers.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        ),
      })),

      markAnswered: (id, testimony) => set((state) => ({
        prayers: state.prayers.map((p) =>
          p.id === id
            ? { ...p, status: 'answered', answeredAt: new Date().toISOString(), testimony: testimony || '' }
            : p
        ),
      })),

      markPending: (id) => set((state) => ({
        prayers: state.prayers.map((p) =>
          p.id === id ? { ...p, status: 'pending' } : p
        ),
      })),

      markActive: (id) => set((state) => ({
        prayers: state.prayers.map((p) =>
          p.id === id ? { ...p, status: 'active' } : p
        ),
      })),

      addUpdate: (prayerId, text) => set((state) => ({
        prayers: state.prayers.map((p) =>
          p.id === prayerId
            ? { ...p, updates: [...(p.updates || []), { id: Date.now().toString(), text, date: new Date().toISOString() }] }
            : p
        ),
      })),

      addPrayerPoint: (prayerId, point) => set((state) => ({
        prayers: state.prayers.map((p) =>
          p.id === prayerId
            ? { ...p, prayerPoints: [...(p.prayerPoints || []), { id: Date.now().toString(), ...point, addedAt: new Date().toISOString() }] }
            : p
        ),
      })),

      removePrayerPoint: (prayerId, pointId) => set((state) => ({
        prayers: state.prayers.map((p) =>
          p.id === prayerId
            ? { ...p, prayerPoints: (p.prayerPoints || []).filter((pp) => pp.id !== pointId) }
            : p
        ),
      })),

      deletePrayer: (id) => set((state) => ({
        prayers: state.prayers.filter((p) => p.id !== id),
      })),

      // Category actions
      addCategory: (category) => set((state) => ({
        categories: [...state.categories, { id: Date.now().toString(), weekDays: [], ...category }],
      })),

      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map((c) => c.id === id ? { ...c, ...updates } : c),
      })),

      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        prayers: state.prayers.map((p) => p.categoryId === id ? { ...p, categoryId: '' } : p),
      })),

      // Settings
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),

      // Get today's prayers based on weekly plan
      getTodaysPrayers: () => {
        const { prayers, categories } = get();
        const today = new Date().getDay(); // 0=Sun, 1=Mon...
        const todayCategories = categories
          .filter((c) => c.weekDays && c.weekDays.includes(today))
          .map((c) => c.id);

        return prayers.filter((p) =>
          p.status === 'active' &&
          (todayCategories.includes(p.categoryId) || !p.categoryId)
        );
      },
    }),
    {
      name: 'pray-for-me-storage',
    }
  )
);

export default usePrayerStore;
