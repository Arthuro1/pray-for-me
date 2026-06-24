import { create } from 'zustand';

let counter = 0;

const useToastStore = create((set, get) => ({
  toasts: [],
  push: (message, type = 'error', ttl = 4000) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    if (ttl) setTimeout(() => get().dismiss(id), ttl);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Convenience helper usable outside React: toast.error('...'), toast.success('...').
export const toast = {
  error: (message) => useToastStore.getState().push(message, 'error'),
  success: (message) => useToastStore.getState().push(message, 'success'),
  info: (message) => useToastStore.getState().push(message, 'info'),
};

export default useToastStore;
