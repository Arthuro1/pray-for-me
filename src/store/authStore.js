import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { clearLocalData } from '../lib/dataCache';
import { forgetAccountKey } from '../lib/crypto/accountKey';
import { authRedirectTarget } from '../lib/pendingInvite';
import { setAuthSessionHint } from '../lib/authSessionHint';
import { clearServiceWorkerUserCaches } from '../lib/serviceWorkerSecurity';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setAuthSessionHint(!!session);
    set({ user: session?.user ?? null, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSessionHint(!!session);
      set({ user: session?.user ?? null });
    });
  },

  signInWithGoogle: async () => {
    // Return to the current path (e.g. an invite link), not just the site root,
    // so the OAuth round-trip preserves the deep link the visitor arrived on.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectTarget() },
    });
    return { error };
  },

  signInWithEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data?.session) setAuthSessionHint(true);
    return { user: data?.user, error };
  },

  signUpWithEmail: async (email, password, fullName) => {
    // Point the confirmation email back at the current path so a visitor who
    // signed up from an invite link is returned to it after confirming (even
    // on another device, where the localStorage replay can't reach them).
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: authRedirectTarget() },
    });
    if (data?.session) setAuthSessionHint(true);
    return { user: data?.user, error };
  },

  // Send a password-reset link. The redirect returns the user to the app (the
  // same target as sign-in) so they land back where they started after resetting.
  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectTarget(),
    });
    return { error };
  },

  // Re-send the sign-up confirmation email for an unverified account (e.g. the
  // first one was missed or expired). Uses the same deep-link-preserving target.
  resendConfirmation: async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: authRedirectTarget() },
    });
    return { error };
  },

  // Clear local traces (prayer cache, mutation queue, wrapped recovery record)
  // so a leftover record can't block login on a different account here. The
  // transparent per-user account key is DELIBERATELY kept: for a user who never
  // set up recovery it is the only copy, so wiping it on sign-out would lock
  // them out of their own encrypted prayers. It is scoped by user id (no
  // cross-account bleed) and only removed on account deletion.
  signOut: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await clearLocalData(user?.id);
    await clearServiceWorkerUserCaches();
    await supabase.auth.signOut();
    setAuthSessionHint(false);
    set({ user: null });
  },

  // Permanently delete the account and ALL server-side data (right to erasure),
  // then wipe local caches and sign out. Irreversible — callers MUST confirm.
  deleteAccount: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.rpc('delete_account');
    if (error) return { error };
    await clearLocalData(user?.id);
    await clearServiceWorkerUserCaches();
    await forgetAccountKey(user?.id); // the account is gone — remove the local key too
    await supabase.auth.signOut();
    setAuthSessionHint(false);
    set({ user: null });
    return { error: null };
  },
}));

export default useAuthStore;
