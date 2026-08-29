// The signed-in person's identity-provider photo — today, the Google account
// picture that already arrives with the session.
//
// It is DISPLAY METADATA, never stored: nothing is copied into the avatars
// bucket, no column mirrors the URL, and no query can be asked for someone
// else's. The picture lives in the caller's own session, so it can only ever
// resolve for the caller — which is exactly the privacy property we want. Other
// people see whatever that person explicitly chose in Praystead (a photo, a
// preset, or their initials), and never an account picture we quietly
// republished on their behalf.
//
// Kept as a tiny synchronous registry rather than a store or a prop: the avatar
// config for every person already flows through one place (fetchProfileAvatars),
// so the identity photo can join it there without threading a new prop through
// every Community call site.
import { isIdentityPhotoUrl } from './avatar';

let current = { userId: null, photoUrl: null };

// Supabase writes the Google `picture` claim into user_metadata as both
// `avatar_url` and `picture`, and keeps the raw claim on the provider identity.
// Read all three in that order rather than betting on one: an account linked
// before a mapping changed, or signed in through a different provider, still
// resolves. `user_metadata` is writable by its own user, so the value is
// treated as untrusted input and validated (https only) before it can ever
// reach an <img src> — it can only ever affect that user's own screen anyway.
export function identityPhotoUrlFrom(user) {
  const meta = user?.user_metadata || {};
  const identity = (user?.identities || []).find((i) => i?.identity_data?.avatar_url || i?.identity_data?.picture);
  const candidates = [meta.avatar_url, meta.picture, identity?.identity_data?.avatar_url, identity?.identity_data?.picture];
  return candidates.find((url) => isIdentityPhotoUrl(url)) || null;
}

// Called from the auth store on every session change, including sign-out (null),
// so a photo can never outlive the session it came from.
export function setIdentityUser(user) {
  current = { userId: user?.id || null, photoUrl: identityPhotoUrlFrom(user) };
}

// The identity photo for `userId`, or null. Only ever answers for the signed-in
// user — there is no way to ask about anybody else, by construction.
export function identityPhotoFor(userId) {
  return userId && userId === current.userId ? current.photoUrl : null;
}

// Attach the identity photo to an avatar config so the resolver can use it as
// the default when the person has made no explicit choice. Returns a config
// even for a user with no row at all, so the account picture still shows on a
// database where the avatar migration has not run yet.
export function withIdentityPhoto(userId, config) {
  const photoUrl = identityPhotoFor(userId);
  if (!photoUrl) return config;
  return { type: null, value: null, color: null, photoPath: null, ...(config || {}), photoUrl };
}
