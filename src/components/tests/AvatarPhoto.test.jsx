// @vitest-environment jsdom
//
// What the shared tile draws once photos exist — and, more importantly, what it
// draws when a photo does not arrive. A member list must render whatever
// happens to an avatar: no broken-image glyph, no empty hole, no retry loop.
// Tested against the bundled `fr` fallback locale.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import Avatar from '../shared/Avatar';
import { AVATAR_COLORS, fallbackAvatarIcon } from '../../lib/avatar';

const signedAvatarUrl = vi.fn();
vi.mock('../../lib/avatarPhotos', () => ({ signedAvatarUrl: (...args) => signedAvatarUrl(...args) }));

const ME = '11111111-2222-4333-8444-555555555555';
const GROUP = '99999999-8888-4777-8666-555555555555';
const OBJ = 'abcdef0123456789abcdef0123456789';
const MY_PHOTO = `profiles/${ME}/${OBJ}.webp`;
const GROUP_PHOTO = `groups/${GROUP}/${OBJ}.webp`;
const SIGNED = 'https://signed.example/avatar.webp';
const GOOGLE = 'https://lh3.googleusercontent.com/a/opaque=s96-c';

const tile = () => document.body.querySelector('.avatar');
const photo = () => document.body.querySelector('.avatar__photo');

beforeEach(() => {
  signedAvatarUrl.mockReset();
  signedAvatarUrl.mockResolvedValue(SIGNED);
});

afterEach(() => {
  cleanup();
  document.documentElement.dir = '';
  document.documentElement.removeAttribute('data-theme');
});

describe('drawing a photo', () => {
  it('signs an uploaded photo once and draws it over the tile', async () => {
    render(<Avatar name="Marie Dupont" avatar={{ type: 'photo', value: null, color: null, photoPath: MY_PHOTO }} />);
    await waitFor(() => expect(photo()).not.toBeNull());
    expect(signedAvatarUrl).toHaveBeenCalledWith(MY_PHOTO);
    expect(photo().getAttribute('src')).toBe(SIGNED);
  });

  it('draws an account picture straight from its URL, with no storage request', async () => {
    render(<Avatar name="Marie Dupont" avatar={{ type: null, value: null, color: null, photoUrl: GOOGLE }} />);
    expect(photo().getAttribute('src')).toBe(GOOGLE);
    expect(signedAvatarUrl).not.toHaveBeenCalled();
  });

  it('does not tell the identity provider which page the reader is on', () => {
    render(<Avatar name="Marie Dupont" avatar={{ type: null, value: null, color: null, photoUrl: GOOGLE }} />);
    expect(photo().getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  it('draws a group photo on the group tile', async () => {
    render(<Avatar kind="group" name="Famille" avatar={{ type: 'photo', value: null, color: null, photoPath: GROUP_PHOTO }} />);
    await waitFor(() => expect(photo()).not.toBeNull());
    expect(signedAvatarUrl).toHaveBeenCalledWith(GROUP_PHOTO);
  });

  // The preset is drawn first and the photo covers it, so there is never a
  // moment of empty tile and never a layout shift when the image lands.
  it('shows the preset underneath while the photo is still being signed', () => {
    signedAvatarUrl.mockReturnValue(new Promise(() => {}));
    render(<Avatar name="Marie Dupont" avatar={{ type: 'photo', value: null, color: '#1f7d76', photoPath: MY_PHOTO }} />);
    expect(tile().textContent).toBe('MD');
    expect(photo()).toBeNull();
  });
});

describe('when a photo does not arrive', () => {
  it('falls back to the preset the person chose, not to a broken image', async () => {
    signedAvatarUrl.mockResolvedValue(null);
    render(<Avatar name="Marie Dupont" avatar={{ type: 'photo', value: 'dove', color: AVATAR_COLORS[3], photoPath: MY_PHOTO }} />);
    await waitFor(() => expect(signedAvatarUrl).toHaveBeenCalled());
    expect(photo()).toBeNull();
    expect(tile().querySelector('svg')).not.toBeNull();
  });

  it('falls back to initials when an account picture fails to load', async () => {
    render(<Avatar name="Marie Dupont" avatar={{ type: null, value: null, color: null, photoUrl: GOOGLE }} />);
    fireEvent.error(photo());
    await waitFor(() => expect(photo()).toBeNull());
    expect(tile().textContent).toBe('MD');
  });

  it('gives up after one failure instead of retrying forever', async () => {
    render(<Avatar name="Marie Dupont" avatar={{ type: 'photo', value: null, color: null, photoPath: MY_PHOTO }} />);
    await waitFor(() => expect(photo()).not.toBeNull());
    fireEvent.error(photo());
    await waitFor(() => expect(photo()).toBeNull());
    expect(signedAvatarUrl).toHaveBeenCalledTimes(1);
  });

  it('ignores a stored key that is not a well-formed object id', () => {
    render(<Avatar name="Marie Dupont" avatar={{ type: 'photo', value: null, color: null, photoPath: '../../secret' }} />);
    expect(photo()).toBeNull();
    expect(tile().textContent).toBe('MD');
    expect(signedAvatarUrl).not.toHaveBeenCalled();
  });
});

describe('an explicit choice beats the account picture', () => {
  it('draws the chosen symbol rather than the Google photo', () => {
    render(<Avatar name="Marie Dupont" avatar={{ type: 'icon', value: 'cross', color: AVATAR_COLORS[1], photoUrl: GOOGLE }} />);
    expect(photo()).toBeNull();
    expect(tile().querySelector('svg')).not.toBeNull();
  });

  it('draws chosen initials rather than the Google photo', () => {
    render(<Avatar name="Marie Dupont" avatar={{ type: 'initials', value: null, color: null, photoUrl: GOOGLE }} />);
    expect(photo()).toBeNull();
    expect(tile().textContent).toBe('MD');
  });

  it('draws an uploaded photo rather than the Google photo', async () => {
    render(<Avatar name="Marie Dupont" avatar={{ type: 'photo', value: null, color: null, photoPath: MY_PHOTO, photoUrl: GOOGLE }} />);
    await waitFor(() => expect(photo()).not.toBeNull());
    expect(photo().getAttribute('src')).toBe(SIGNED);
  });

  it('shows initials when there is no account picture and no choice', () => {
    render(<Avatar name="Marie Dupont" avatar={{ type: null, value: null, color: null }} />);
    expect(photo()).toBeNull();
    expect(tile().textContent).toBe('MD');
  });

  it('renders a row written before photos existed exactly as it did', () => {
    render(<Avatar kind="group" name="Ancien groupe" avatar={{ type: null, value: null, color: null }} />);
    expect(photo()).toBeNull();
    expect(tile().querySelector('svg')).not.toBeNull();
    expect(fallbackAvatarIcon('ancien groupe')).toBeTruthy();
  });
});

describe('accessibility and theming', () => {
  // A member's name sits next to their avatar almost everywhere; the picture
  // must not announce it a second time.
  it('keeps the photo silent when the tile is decorative', async () => {
    render(<Avatar name="Marie Dupont" avatar={{ type: 'photo', value: null, color: null, photoPath: MY_PHOTO }} />);
    await waitFor(() => expect(photo()).not.toBeNull());
    expect(tile().getAttribute('aria-hidden')).toBe('true');
    expect(photo().getAttribute('alt')).toBe('');
    expect(photo().getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps exactly one accessible name when the tile stands alone', async () => {
    render(<Avatar name="Marie Dupont" label="Marie Dupont" avatar={{ type: 'photo', value: null, color: null, photoPath: MY_PHOTO }} />);
    await waitFor(() => expect(photo()).not.toBeNull());
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'Marie Dupont' })).toBe(tile());
  });

  it('never shows the anonymous mask a photo, whatever config is passed', () => {
    render(<Avatar name="Marie Dupont" anonymous avatar={{ type: 'photo', value: null, color: null, photoPath: MY_PHOTO, photoUrl: GOOGLE }} />);
    expect(photo()).toBeNull();
    expect(tile().className).toContain('avatar--anonymous');
    expect(document.body.textContent).not.toContain('MD');
    expect(signedAvatarUrl).not.toHaveBeenCalled();
  });

  it('keeps the tile square-cropped and mirror-safe in dark mode and RTL', async () => {
    document.documentElement.dir = 'rtl';
    document.documentElement.setAttribute('data-theme', 'dark');
    render(<Avatar kind="group" name="عائلة" size={40} avatar={{ type: 'photo', value: null, color: null, photoPath: GROUP_PHOTO }} />);
    await waitFor(() => expect(photo()).not.toBeNull());
    // Positioning is done with `inset` in CSS, so nothing here pins a side.
    expect(photo().style.left).toBe('');
    expect(photo().style.right).toBe('');
    expect(tile().style.width).toBe('40px');
  });
});
