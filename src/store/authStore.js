import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { clearLocalData } from '../lib/dataCache';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { error };
  },

  signInWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data?.user, error };
  },

  signUpWithEmail: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { user: data?.user, error };
  },

  // Vault record + prayer cache live in IndexedDB unscoped to the signed-in
  // session (the vault key isn't namespaced per-user), so a leftover record from
  // this account would block login on a different account on the same device —
  // clear local traces before signing out.
  signOut: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await clearLocalData(user?.id);
    await supabase.auth.signOut();
    set({ user: null });
  },

  // Permanently delete the account and ALL server-side data (right to erasure),
  // then wipe local caches and sign out. Irreversible — callers MUST confirm.
  deleteAccount: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.rpc('delete_account');
    if (error) return { error };
    await clearLocalData(user?.id);
    await supabase.auth.signOut();
    set({ user: null });
    return { error: null };
  },
}));

export default useAuthStore;
