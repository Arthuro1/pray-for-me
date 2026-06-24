import { describe, it, expect } from 'vitest';
import { getAuthorName, originAuthor, communityAuthor } from './user.js';
import { t } from '../i18n.js';

describe('communityAuthor', () => {
  it('shows the localized "Me" for the current user', () => {
    expect(communityAuthor({ user_id: 'u1', author_name: 'Marie' }, 'u1', 'fr')).toBe(t('fr', 'meAuthor'));
  });

  it('shows the author name for others', () => {
    expect(communityAuthor({ user_id: 'u2', author_name: 'Marie' }, 'u1', 'fr')).toBe('Marie');
  });

  it('shows Anonymous regardless of who it is', () => {
    expect(communityAuthor({ user_id: 'u1', author_name: 'Marie', is_anonymous: true }, 'u1', 'fr')).toBe(t('fr', 'anonymous'));
  });
});

describe('getAuthorName', () => {
  it('prefers full_name from metadata', () => {
    expect(getAuthorName({ user_metadata: { full_name: 'Marie Dupont' }, email: 'm@x.com' })).toBe('Marie Dupont');
  });

  it('falls back to the email local-part', () => {
    expect(getAuthorName({ email: 'jean.mbarga@example.com' })).toBe('jean.mbarga');
  });

  it("returns '?' when nothing is available", () => {
    expect(getAuthorName(null)).toBe('?');
    expect(getAuthorName({})).toBe('?');
  });
});

describe('originAuthor', () => {
  it('returns an anonymous marker when the origin was anonymous', () => {
    expect(originAuthor({ origin_is_anonymous: true, origin_author_name: null })).toEqual({ anonymous: true });
  });

  it('returns the name when present and not anonymous', () => {
    expect(originAuthor({ origin_is_anonymous: false, origin_author_name: 'Paul' })).toEqual({ name: 'Paul' });
  });

  it('returns null for a prayer with no community origin', () => {
    expect(originAuthor({})).toBeNull();
    expect(originAuthor(null)).toBeNull();
  });

  it('prioritises anonymity over a stray name', () => {
    expect(originAuthor({ origin_is_anonymous: true, origin_author_name: 'leak' })).toEqual({ anonymous: true });
  });
});
