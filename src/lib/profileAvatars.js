// Reading and writing profile avatars.
//
// Profile avatars are deliberately NOT readable from the profiles table: the
// database grants clients only (id, full_name, created_at) and hands the three
// avatar columns out through get_profile_avatars(), which returns a row only
// for the caller themselves, an accepted friend, or someone in a group they
// share. Everyone else resolves to the deterministic name-derived avatar, which
// is what an unconfigured account looks like anyway — so a stranger cannot tell
// the difference, and no relationship is disclosed.
import { supabase } from './supabase';
import { avatarColumns, avatarConfigFrom } from './avatar';

// { [userId]: {type,value,color} } for the ids the caller may see. An empty map
// is a valid answer, and is also what a database without this migration returns
// — callers must treat a missing entry as "no avatar configured", never as an
// error state.
export async function fetchProfileAvatars(ids) {
  const unique = [...new Set((ids || []).filter(Boolean))];
  if (unique.length === 0) return {};
  const { data, error } = await supabase.rpc('get_profile_avatars', { p_ids: unique });
  if (error || !data) return {};
  return Object.fromEntries(data.map((row) => [row.id, avatarConfigFrom(row)]));
}

// The signed-in user's own avatar (the RPC always includes the caller).
export async function fetchMyAvatar(userId) {
  if (!userId) return null;
  const byId = await fetchProfileAvatars([userId]);
  return byId[userId] || null;
}

// Persist the user's own avatar. RLS restricts the row to the caller; the
// columns are re-validated by avatarColumns() before they leave the client and
// again by the table's check constraint. No `.select()` — we never need to read
// the row back, so nothing widens the read surface.
export async function saveMyAvatar(userId, config) {
  if (!userId) return { error: 'noUser' };
  const { error } = await supabase.from('profiles').update(avatarColumns(config)).eq('id', userId);
  return error ? { error: error.message } : {};
}
