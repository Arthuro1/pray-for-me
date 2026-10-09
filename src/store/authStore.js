import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { clearLocalData } from '../lib/dataCache';
import { forgetAccountKey } from '../lib/crypto/accountKey';
import { authRedirectTarget } from '../lib/pendingInvite';
import { setAuthSessionHint } from '../lib/authSessionHint';
import { setIdentityUser } from '../lib/identityPhoto';
import { AVATAR_SCOPES, removeAllAvatarObjects } from '../lib/avatarPhotos';
import { clearServiceWorkerUserCaches } from '../lib/serviceWorkerSecurity';
import { clearUserKeyCache } from '../lib/crypto/userKeys';
import { clearGroupKeyCache } from '../lib/crypto/groupKeys';
import { clearAllAiResultCaches } from '../lib/aiResultCache';
import { resetAiRequestState } from '../lib/aiCore';
import { clearTranslationCache } from './translationStore';
import { configureAccountContext, getLifecycleToken, isLifecycleCurrent } from '../lib/crypto/keyManager';

// Clear all in-memory AI state (result caches, translation cache, in-flight
// request/cooldown markers) so nothing decrypted lingers across an account
// boundary. Called on sign-out and account deletion.
function clearAiEphemeralState() {
  clearAllAiResultCaches();
  clearTranslationCache();
  resetAiRequestState();
}

function clearSessionCryptoCaches() {
  clearGroupKeyCache();
  clearUserKeyCache();
}

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    configureAccountContext(session?.user?.id ?? null);
    setAuthSessionHint(!!session);
    // The account picture the identity provider sent with this session. Kept in
    // memory only, and re-set on every change so it can never outlive the
    // session it belongs to.
    setIdentityUser(session?.user ?? null);
    set({ user: session?.user ?? null, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      if (get().user?.id !== nextUser?.id) {
        // Auth changes can arrive from another tab, without our signOut action.
        // Cancel captured AI work before the new account/session is exposed.
        clearAiEphemeralState();
        clearSessionCryptoCaches();
        configureAccountContext(nextUser?.id ?? null);
      }
      setAuthSessionHint(!!session);
      setIdentityUser(nextUser);
      set({ user: nextUser });
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

  // Passwordless sign-in: email a one-time link that both creates the account (if
  // it is new) and signs it in. Used by the save-your-prayer path, where asking
  // someone to invent a password is a detour from the thing they came to do.
  //
  // This does not weaken anything: it is the same email-ownership proof the
  // confirmation mail already relies on, and the end-to-end encryption key is
  // minted on the device — it never depended on the password.
  signInWithEmailLink: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // Same deep-link-preserving target as every other mail we send, so the
      // link returns them to the page they left (and their pending prayer).
      options: { emailRedirectTo: authRedirectTarget(), shouldCreateUser: true },
    });
    return { error };
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

  // Sign-out clears the journal cache and session secrets. Account-owned pending
  // work, wrapped recovery and the transparent device key survive: they may be
  // the user's only copies. Ownership fences keep them out of another login;
  // account deletion has a separate cleanup path.
  signOut: async () => {
    // Drop secrets synchronously, before any network/storage await can leave a
    // previous account's key usable by an incoming auth event.
    const currentUserId = get().user?.id;
    configureAccountContext(null);
    const token = getLifecycleToken();
    clearSessionCryptoCaches();
    clearAiEphemeralState();
    const { data: { user } } = await supabase.auth.getUser();
    if (!isLifecycleCurrent(token)) return false;
    await clearLocalData(currentUserId ?? user?.id, { preserveRecovery: true });
    if (!isLifecycleCurrent(token)) return false;
    await clearServiceWorkerUserCaches();
    if (!isLifecycleCurrent(token)) return false;
    await supabase.auth.signOut();
    if (!isLifecycleCurrent(token)) return false;
    clearSessionCryptoCaches();
    setAuthSessionHint(false);
    setIdentityUser(null);
    set({ user: null });
  },

  // Permanently delete the account and ALL server-side data (right to erasure),
  // then wipe local caches and sign out. Irreversible — callers MUST confirm.
  deleteAccount: async () => {
    const token = getLifecycleToken();
    let user;
    try {
      const result = await supabase.auth.getUser();
      user = result.data?.user || get().user;
    } catch (error) {
      return { error };
    }
    if (!user?.id) return { error: new Error('No authenticated user') };
    if (!isLifecycleCurrent(token) || token.accountId !== user.id) return { error: new Error('Account changed') };

    // Remove the uploaded avatar while the account still exists and can
    // authorise it — afterwards nobody can. Best-effort by design: erasure must
    // not be blocked by storage, and a delete trigger on profiles revokes
    // access to anything left behind.
    await removeAllAvatarObjects(AVATAR_SCOPES.user, user.id);
    if (!isLifecycleCurrent(token)) return { error: new Error('Account changed') };
    let error;
    try {
      ({ error } = await supabase.rpc('delete_account'));
    } catch (caught) {
      error = caught;
    }
    if (error) return { error };
    if (!isLifecycleCurrent(token)) return { error: new Error('Account changed') };

    // Server erasure succeeded. Local cleanup is best-effort and must never
    // leave the deleted account rendered because one browser cache failed.
    configureAccountContext(null);
    const cleanupToken = getLifecycleToken();
    await Promise.allSettled([
      clearLocalData(user.id),
      clearServiceWorkerUserCaches(),
      forgetAccountKey(user.id),
      import('../lib/prayerProtection').then(({ forgetProtectedDevice }) => forgetProtectedDevice(user.id)),
    ]);
    if (!isLifecycleCurrent(cleanupToken)) return { error: null, accountChanged: true };
    try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* local state below is authoritative */ }
    if (!isLifecycleCurrent(cleanupToken)) return { error: null, accountChanged: true };
    clearAiEphemeralState();
    clearSessionCryptoCaches();
    setAuthSessionHint(false);
    setIdentityUser(null);
    set({ user: null });
    return { error: null };
  },
}));

export default useAuthStore;
