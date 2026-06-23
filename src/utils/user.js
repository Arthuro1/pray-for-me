export function getAuthorName(user) {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || '?';
}

// For a personal prayer saved from the community, returns the original author
// label ('anonymous' marker or a name), or null for the user's own prayers.
export function originAuthor(prayer) {
  if (prayer?.origin_is_anonymous) return { anonymous: true };
  if (prayer?.origin_author_name) return { name: prayer.origin_author_name };
  return null;
}
