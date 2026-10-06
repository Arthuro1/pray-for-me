// Storage for uploaded avatars: where the bytes go, how they come back, and how
// an avatar is replaced without anyone losing the picture they already had.
//
// The bucket is PRIVATE. Nothing here mints a permanent public URL — a tile is
// drawn from a short-lived signed URL that the database authorised for this
// caller, so a profile photo is reachable by the people Praystead already lets
// see that person (themselves, an accepted friend, someone in a shared group)
// and by nobody else. Objects are named `<scope>/<owner id>/<opaque id>.<ext>`:
// no display name, no email, no prayer title, nothing that would leak through a
// URL, a log line, or a CDN cache key.
import { supabase } from './supabase';
import { isAvatarPhotoPath } from './avatar';

export const AVATARS_BUCKET = 'avatars';

// The two folders the storage policies know how to authorise.
export const AVATAR_SCOPES = { user: 'profiles', group: 'groups' };

// Long enough that a member list, a group header and a wall of "I'm praying"
// faces all reuse one signature; short enough that a leaked URL is not a
// standing grant. Re-signed a little before it lapses so a long-lived tab never
// shows a tile that expired mid-scroll.
const SIGN_TTL_SECONDS = 60 * 60;
const REUSE_MS = (SIGN_TTL_SECONDS - 5 * 60) * 1000;

// A tile that cannot be signed (offline, revoked access, deleted object) falls
// back to the preset and stops asking for a while. Without this, every scroll
// of a member list would re-request an object that is not coming back.
const FAILURE_COOLDOWN_MS = 2 * 60 * 1000;

// path -> { url: Promise<string|null>, expiresAt }. Module-level, so the Avatar
// component can render a hundred tiles without touching the network more than
// once per distinct photo.
const signed = new Map();

export function clearAvatarUrlCache(path = null) {
  if (path) signed.delete(path); else signed.clear();
}

// A short-lived signed URL for one avatar object, or null if it cannot be read.
// Never rejects: a missing avatar is an ordinary outcome, and a member list must
// render whatever happens here.
export function signedAvatarUrl(path) {
  if (!isAvatarPhotoPath(path)) return Promise.resolve(null);
  const hit = signed.get(path);
  if (hit && hit.expiresAt > Date.now()) return hit.url;

  const url = (async () => {
    try {
      const { data, error } = await supabase.storage.from(AVATARS_BUCKET).createSignedUrl(path, SIGN_TTL_SECONDS);
      return error ? null : (data?.signedUrl || null);
    } catch {
      return null;
    }
  })();

  signed.set(path, { url, expiresAt: Date.now() + REUSE_MS });
  url.then((value) => {
    if (!value) signed.set(path, { url, expiresAt: Date.now() + FAILURE_COOLDOWN_MS });
  });
  return url;
}

// An opaque object id — unrelated to the file that was picked, so the original
// filename ("baptism-of-mum.jpg") never reaches storage.
function objectPath(scope, ownerId, ext) {
  return `${scope}/${ownerId}/${crypto.randomUUID().replace(/-/g, '')}.${ext}`;
}

// Upload processed bytes under a fresh key. Always a NEW object — an avatar is
// never overwritten in place, which is what makes the replacement flow below
// able to keep the old picture until the new one is safely referenced.
export async function uploadAvatarPhoto({ scope, ownerId, blob, ext }) {
  if (!scope || !ownerId || !blob) return { error: 'uploadFailed' };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { error: 'avatarPhotoOffline' };
  const path = objectPath(scope, ownerId, ext);
  if (!isAvatarPhotoPath(path)) return { error: 'uploadFailed' };
  try {
    const { error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(path, blob, { contentType: blob.type, cacheControl: '3600', upsert: false });
    return error ? { error: 'uploadFailed' } : { path };
  } catch {
    return { error: 'uploadFailed' };
  }
}

// Best-effort object deletion. A failure here is never surfaced: the row no
// longer points at the object, so what is left is an orphan to sweep, not a
// broken avatar. Callers must only ever pass a path they just stopped
// referencing — never a folder, never a wildcard.
export async function removeAvatarPhoto(path) {
  if (!isAvatarPhotoPath(path)) return;
  clearAvatarUrlCache(path);
  try {
    await supabase.storage.from(AVATARS_BUCKET).remove([path]);
  } catch {
    /* orphan sweep, not a user-facing failure */
  }
}

// Replacing an avatar, in the only order that cannot lose the current one:
//
//   1. upload the new object          — the old one is still referenced
//   2. point the row at it            — the new one is now the avatar
//   3. delete the old object          — nothing references it any more
//
// If (2) fails, the object from (1) is removed again, so a failed save leaves
// neither a changed avatar nor an orphan. If (3) fails, the update still
// succeeded: the user has their new picture and an unreferenced object remains
// for the deletion trigger / sweep to collect.
export async function commitAvatarPhoto({ scope, ownerId, blob, ext, previousPath, config, save }) {
  const uploaded = await uploadAvatarPhoto({ scope, ownerId, blob, ext });
  if (uploaded.error) return { error: uploaded.error };

  const next = { ...config, type: 'photo', photoPath: uploaded.path };
  const { error } = await save(next);
  if (error) {
    await removeAvatarPhoto(uploaded.path);
    return { error: 'uploadFailed' };
  }

  if (previousPath && previousPath !== uploaded.path) await removeAvatarPhoto(previousPath);
  return { config: next };
}

// Saving a non-photo choice (a preset, initials, or the account picture) while a
// photo object exists. Same order: the row stops referencing the object first,
// and only a successful save lets us delete it.
export async function commitAvatarChoice({ previousPath, config, save }) {
  const next = { ...config, photoPath: null };
  const { error } = await save(next);
  if (error) return { error: 'errorGeneric' };
  if (previousPath) await removeAvatarPhoto(previousPath);
  return { config: next };
}

// Every avatar object belonging to one profile or group, removed when the owner
// itself is being deleted. Scoped to that owner's own folder and to objects the
// caller is allowed to list — it can never reach anything else in the bucket.
// Failure is swallowed: account and group deletion must not depend on storage.
export async function removeAllAvatarObjects(scope, ownerId) {
  if (!scope || !ownerId) return;
  const folder = `${scope}/${ownerId}`;
  try {
    const { data, error } = await supabase.storage.from(AVATARS_BUCKET).list(folder);
    if (error || !data?.length) return;
    const paths = data.map((o) => `${folder}/${o.name}`).filter(isAvatarPhotoPath);
    paths.forEach((p) => clearAvatarUrlCache(p));
    if (paths.length) await supabase.storage.from(AVATARS_BUCKET).remove(paths);
  } catch {
    /* deletion of the account/group is what matters; the trigger sweeps the rest */
  }
}
