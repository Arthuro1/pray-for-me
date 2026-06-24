import { create } from 'zustand';

let counter = 0;

const useToastStore = create((set, get) => ({
  toasts: [],
  // action (optional): { label, onClick } renders a button (e.g. "Undo").
  push: (message, type = 'error', ttl = 4000, action = null) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, message, type, action }] }));
    if (ttl) setTimeout(() => get().dismiss(id), ttl);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Convenience helper usable outside React. Pass an optional { action } object,
// e.g. toast.success('Removed', { action: { label: 'Undo', onClick } }).
export const toast = {
  error: (message, opts = {}) => useToastStore.getState().push(message, 'error', opts.ttl ?? 4000, opts.action ?? null),
  success: (message, opts = {}) => useToastStore.getState().push(message, 'success', opts.ttl ?? 6000, opts.action ?? null),
  info: (message, opts = {}) => useToastStore.getState().push(message, 'info', opts.ttl ?? 4000, opts.action ?? null),
};

export default useToastStore;
