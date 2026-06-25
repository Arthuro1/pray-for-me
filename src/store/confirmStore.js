import { create } from 'zustand';

// A single app-wide confirmation dialog. Any code can request a warning before a
// destructive action without each screen wiring its own dialog state. Strings
// are passed already-localised (the store is i18n-agnostic).
const useConfirmStore = create((set) => ({
  dialog: null, // { title, message, confirmLabel, cancelLabel, danger, onConfirm }
  close: () => set({ dialog: null }),
}));

// Usable outside React: confirm({ title, message, confirmLabel, onConfirm, ... }).
export const confirm = (opts) => useConfirmStore.setState({ dialog: opts });

export default useConfirmStore;
