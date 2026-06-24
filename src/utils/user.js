import { t } from '../i18n';

export function getAuthorName(user) {
  return user?.user_metadata?.full_name || user?.email?.split('@')[0] || '?';
}

// Author label for a community record ({ user_id, author_name, is_anonymous }):
// "Anonymous" if anonymous, "Me" if it's the current user, else the author name.
export function communityAuthor(record, userId, lang) {
  if (record?.is_anonymous) return t(lang, 'anonymous');
  if (record?.user_id && record.user_id === userId) return t(lang, 'meAuthor');
  return record?.author_name || '?';
}

// For a personal prayer saved from the community, returns the original author
// label ('anonymous' marker or a name), or null for the user's own prayers.
export function originAuthor(prayer) {
  if (prayer?.origin_is_anonymous) return { anonymous: true };
  if (prayer?.origin_author_name) return { name: prayer.origin_author_name };
  return null;
}
