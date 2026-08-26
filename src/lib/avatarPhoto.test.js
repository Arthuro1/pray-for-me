// The photo layer of the avatar model: which image wins, what survives
// underneath it, and what an account picture is (and is not) allowed to do.
//
// The rule these tests pin down, in order:
//   an explicit Pray4Me photo → an explicit preset → the identity photo → initials
// An explicit choice ALWAYS beats an automatically discovered account picture.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  avatarColumns, avatarConfigFrom, isAvatarPhotoPath, isIdentityPhotoUrl, resolveAvatar,
} from './avatar';
import { identityPhotoUrlFrom, setIdentityUser, withIdentityPhoto } from './identityPhoto';

const ME = '11111111-2222-4333-8444-555555555555';
const GROUP = '99999999-8888-4777-8666-555555555555';
const OBJ = 'abcdef0123456789abcdef0123456789';
const MY_PHOTO = `profiles/${ME}/${OBJ}.webp`;
const GROUP_PHOTO = `groups/${GROUP}/${OBJ}.jpg`;
const GOOGLE = 'https://lh3.googleusercontent.com/a/opaque=s96-c';

beforeEach(() => setIdentityUser(null));

describe('object keys', () => {
  it('accepts only an opaque id under a scoped owner folder', () => {
    expect(isAvatarPhotoPath(MY_PHOTO)).toBe(true);
    expect(isAvatarPhotoPath(GROUP_PHOTO)).toBe(true);
  });

  it('refuses anything that could carry a name, a traversal, or another format', () => {
    for (const bad of [
      `profiles/${ME}/marie-baptism.jpg`,            // a filename, not an id
      `profiles/${ME}/../${GROUP}/${OBJ}.webp`,      // traversal
      `profiles/${ME}/${OBJ}.svg`,                   // active content
      `attachments/${ME}/${OBJ}.webp`,               // another bucket's shape
      `profiles/not-a-uuid/${OBJ}.webp`,
      `${MY_PHOTO}?download=1`,
      'https://example.com/photo.webp',
      '', null, undefined, 42,
    ]) expect(isAvatarPhotoPath(bad)).toBe(false);
  });
});

describe('identity photo URLs', () => {
  it('takes an https account picture from either metadata field or the provider identity', () => {
    expect(identityPhotoUrlFrom({ user_metadata: { avatar_url: GOOGLE } })).toBe(GOOGLE);
    expect(identityPhotoUrlFrom({ user_metadata: { picture: GOOGLE } })).toBe(GOOGLE);
    expect(identityPhotoUrlFrom({ identities: [{ identity_data: { picture: GOOGLE } }] })).toBe(GOOGLE);
  });

  it('prefers avatar_url when Supabase mirrors the claim into both fields', () => {
    const other = 'https://example.com/other.png';
    expect(identityPhotoUrlFrom({ user_metadata: { avatar_url: GOOGLE, picture: other } })).toBe(GOOGLE);
  });

  // user_metadata is writable by its own user, so it is untrusted input even
  // though it can only ever affect that user's own screen.
  it('refuses anything that is not an https URL', () => {
    for (const bad of ['javascript:alert(1)', 'http://insecure.example/p.png', 'data:image/png;base64,AAA', 'not a url', '']) {
      expect(isIdentityPhotoUrl(bad)).toBe(false);
      expect(identityPhotoUrlFrom({ user_metadata: { avatar_url: bad } })).toBeNull();
    }
  });

  it('returns nothing for an account that signed up with an email address', () => {
    expect(identityPhotoUrlFrom({ user_metadata: { full_name: 'Marie Dupont' } })).toBeNull();
    expect(identityPhotoUrlFrom(null)).toBeNull();
  });
});

describe('withIdentityPhoto', () => {
  it('only ever answers for the signed-in user', () => {
    setIdentityUser({ id: ME, user_metadata: { avatar_url: GOOGLE } });
    expect(withIdentityPhoto(ME, null).photoUrl).toBe(GOOGLE);
    // There is no way to ask about anyone else — by construction, not by policy.
    expect(withIdentityPhoto('someone-else', null)).toBeNull();
  });

  it('supplies a config even when the row is missing, so the picture still shows', () => {
    setIdentityUser({ id: ME, user_metadata: { avatar_url: GOOGLE } });
    expect(withIdentityPhoto(ME, null)).toEqual({ type: null, value: null, color: null, photoPath: null, photoUrl: GOOGLE });
  });

  it('does not outlive its session', () => {
    setIdentityUser({ id: ME, user_metadata: { avatar_url: GOOGLE } });
    setIdentityUser(null);
    expect(withIdentityPhoto(ME, null)).toBeNull();
  });
});

describe('resolveAvatar with photos', () => {
  it('draws an uploaded photo, and keeps a fallback ready underneath it', () => {
    const a = resolveAvatar({ config: { type: 'photo', value: 'dove', color: '#1f7d76', photoPath: MY_PHOTO }, name: 'Marie Dupont' });
    expect(a.type).toBe('photo');
    expect(a.photo).toEqual({ source: 'storage', path: MY_PHOTO });
    // The preset the person had before the photo is still resolved, so a failed
    // load has somewhere to land without another lookup.
    expect(a.icon).toBe('dove');
    expect(a.color).toBe('#1f7d76');
  });

  it('falls back to initials under a photo when no symbol was ever chosen', () => {
    const a = resolveAvatar({ config: { type: 'photo', value: null, color: null, photoPath: MY_PHOTO }, name: 'Marie Dupont' });
    expect(a.initials).toBe('MD');
    expect(a.icon).toBeNull();
  });

  it('keeps a group under a photo falling back to a symbol, not to letters', () => {
    const a = resolveAvatar({ config: { type: 'photo', value: null, color: null, photoPath: GROUP_PHOTO }, name: 'Famille', kind: 'group' });
    expect(a.photo.source).toBe('storage');
    expect(a.icon).toBeTruthy();
    expect(a.initials).toBeNull();
  });

  it('uses the account picture when the person has made no choice at all', () => {
    const a = resolveAvatar({ config: { type: null, value: null, color: null, photoUrl: GOOGLE }, name: 'Marie Dupont' });
    expect(a.type).toBe('photo');
    expect(a.photo).toEqual({ source: 'identity', url: GOOGLE });
    expect(a.initials).toBe('MD');
  });

  it('shows initials, not a broken image, when there is no account picture', () => {
    const a = resolveAvatar({ config: { type: null, value: null, color: null }, name: 'Marie Dupont' });
    expect(a.type).toBe('initials');
    expect(a.photo).toBeNull();
    expect(a.initials).toBe('MD');
  });

  // The heart of the rule: an explicit choice is never silently overruled.
  it('lets an explicit preset beat the account picture', () => {
    const a = resolveAvatar({ config: { type: 'icon', value: 'cross', color: '#4a4f9e', photoUrl: GOOGLE }, name: 'Marie Dupont' });
    expect(a.type).toBe('icon');
    expect(a.icon).toBe('cross');
    expect(a.photo).toBeNull();
  });

  it('lets an explicit "use initials" beat the account picture', () => {
    const a = resolveAvatar({ config: { type: 'initials', value: null, color: null, photoUrl: GOOGLE }, name: 'Marie Dupont' });
    expect(a.type).toBe('initials');
    expect(a.photo).toBeNull();
  });

  it('lets an uploaded photo beat the account picture', () => {
    const a = resolveAvatar({ config: { type: 'photo', value: null, color: null, photoPath: MY_PHOTO, photoUrl: GOOGLE }, name: 'Marie Dupont' });
    expect(a.photo).toEqual({ source: 'storage', path: MY_PHOTO });
  });

  it('ignores a photo path that is not a well-formed object key', () => {
    const a = resolveAvatar({ config: { type: 'photo', value: null, color: null, photoPath: '../../secrets' }, name: 'Marie Dupont' });
    expect(a.type).toBe('initials');
    expect(a.photo).toBeNull();
  });

  it('renders a row that predates photo support exactly as before', () => {
    const a = resolveAvatar({ config: avatarConfigFrom({ avatar_type: 'icon', avatar_value: 'dove', avatar_color: '#60457b' }), name: 'Ancien groupe', kind: 'group' });
    expect(a).toEqual({ type: 'icon', icon: 'dove', initials: null, color: '#60457b', photo: null });
  });
});

describe('avatarColumns with photos', () => {
  it('persists the object key and marks the row as a photo', () => {
    expect(avatarColumns({ type: 'photo', value: 'dove', color: '#1f7d76', photoPath: MY_PHOTO })).toEqual({
      avatar_type: 'photo', avatar_value: 'dove', avatar_color: '#1f7d76', avatar_photo_path: MY_PHOTO,
    });
  });

  // Removing a photo must not cost the person their symbol and colour, so the
  // preset is written alongside the photo rather than replaced by it.
  it('keeps the preset underneath the photo', () => {
    const cols = avatarColumns({ type: 'photo', value: 'cross', color: '#a35540', photoPath: MY_PHOTO });
    expect(cols.avatar_value).toBe('cross');
    expect(cols.avatar_color).toBe('#a35540');
  });

  it('never writes a photo type without a usable key', () => {
    for (const path of ['../escape', `profiles/${ME}/name.jpg`, null, undefined]) {
      expect(avatarColumns({ type: 'photo', value: 'dove', color: '#1f7d76', photoPath: path })).toEqual({
        avatar_type: null, avatar_value: null, avatar_color: '#1f7d76', avatar_photo_path: null,
      });
    }
  });

  it('clears the key when the person switches to a preset', () => {
    expect(avatarColumns({ type: 'icon', value: 'dove', color: '#1f7d76', photoPath: MY_PHOTO }).avatar_photo_path).toBeNull();
    expect(avatarColumns({ type: null, value: null, color: null, photoPath: MY_PHOTO })).toEqual({
      avatar_type: null, avatar_value: null, avatar_color: null, avatar_photo_path: null,
    });
  });
});
