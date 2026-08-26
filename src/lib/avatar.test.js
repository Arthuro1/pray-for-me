// The deterministic avatar rules: same name in, same avatar out, forever and on
// every device — and nothing outside the preset list ever reaches the DOM.
import { describe, it, expect } from 'vitest';
import {
  AVATAR_COLORS, AVATAR_ICONS, DEFAULT_AVATAR_COLOR,
  avatarColumns, avatarConfigFrom, canEditGroupAvatar,
  fallbackAvatarColor, fallbackAvatarIcon, initialsFrom, isAvatarColor, isAvatarIcon, resolveAvatar,
} from './avatar';

describe('deterministic fallbacks', () => {
  it('gives the same name the same colour and symbol every time', () => {
    for (const name of ['Marie Dupont', 'Prayer Warriors', 'أحمد', '祈祷小组']) {
      expect(fallbackAvatarColor(name)).toBe(fallbackAvatarColor(name));
      expect(fallbackAvatarIcon(name)).toBe(fallbackAvatarIcon(name));
    }
  });

  it('only ever draws from the curated palette and preset list', () => {
    for (const name of ['a', 'bb', 'Groupe de prière', 'x'.repeat(200), '']) {
      expect(AVATAR_COLORS).toContain(fallbackAvatarColor(name));
      expect(AVATAR_ICONS).toContain(fallbackAvatarIcon(name));
    }
  });

  it('spreads names across the palette rather than parking them on one colour', () => {
    const names = Array.from({ length: 60 }, (_, i) => `Member ${i}`);
    const used = new Set(names.map(fallbackAvatarColor));
    expect(used.size).toBeGreaterThan(AVATAR_COLORS.length / 2);
  });

  it('does not move a colour and a symbol in lockstep', () => {
    const colours = AVATAR_COLORS.map((_, i) => fallbackAvatarColor(`g${i}`));
    const icons = AVATAR_COLORS.map((_, i) => fallbackAvatarIcon(`g${i}`));
    const paired = colours.map((c, i) => `${c}|${icons[i]}`);
    expect(new Set(paired).size).toBeGreaterThan(1);
  });

  it('ignores case and surrounding whitespace, so one person keeps one avatar', () => {
    expect(resolveAvatar({ name: '  Marie Dupont ' }).color).toBe(resolveAvatar({ name: 'marie dupont' }).color);
  });
});

describe('initials', () => {
  it('takes the first letter of the first and last words', () => {
    expect(initialsFrom('Marie Dupont')).toBe('MD');
    expect(initialsFrom('Jean Michel Baptiste')).toBe('JB');
  });

  it('falls back to one letter for a single word', () => {
    expect(initialsFrom('Marie')).toBe('M');
  });

  it('handles empty, whitespace and missing names without throwing', () => {
    expect(initialsFrom('')).toBe('?');
    expect(initialsFrom('   ')).toBe('?');
    expect(initialsFrom(undefined)).toBe('?');
    expect(initialsFrom(null)).toBe('?');
  });

  it('splits on code points, so a non-Latin or emoji-leading name is not cut in half', () => {
    expect(initialsFrom('Élodie Ngo')).toBe('ÉN');
    expect(initialsFrom('أحمد حسن')).toBe('أح');
    expect(Array.from(initialsFrom('👨‍👩‍👧 Famille'))[0]).toBe('👨');
  });
});

describe('resolveAvatar', () => {
  it('defaults a group to a symbol and a person to their initials', () => {
    expect(resolveAvatar({ name: 'Prayer Warriors', kind: 'group' }).type).toBe('icon');
    expect(resolveAvatar({ name: 'Marie Dupont', kind: 'user' }).type).toBe('initials');
  });

  it('honours a stored preset', () => {
    const r = resolveAvatar({ config: { type: 'icon', value: 'dove', color: '#1f7d76' }, name: 'X', kind: 'group' });
    expect(r).toMatchObject({ type: 'icon', icon: 'dove', color: '#1f7d76' });
  });

  it('lets a person choose a symbol and a group choose initials', () => {
    expect(resolveAvatar({ config: { type: 'icon', value: 'heart' }, name: 'Marie', kind: 'user' }).icon).toBe('heart');
    expect(resolveAvatar({ config: { type: 'initials' }, name: 'Prayer Warriors', kind: 'group' }).initials).toBe('PW');
  });

  // Existing rows have none of the three columns. They must resolve, not crash.
  it('resolves rows that predate the migration', () => {
    for (const config of [null, undefined, {}, { type: null, value: null, color: null }]) {
      const r = resolveAvatar({ config, name: 'Ancien groupe', kind: 'group' });
      expect(AVATAR_ICONS).toContain(r.icon);
      expect(AVATAR_COLORS).toContain(r.color);
    }
    const user = resolveAvatar({ config: null, name: 'Vieux compte', kind: 'user' });
    expect(user.initials).toBe('VC');
    expect(AVATAR_COLORS).toContain(user.color);
  });

  it('refuses a colour outside the palette instead of writing it into a style', () => {
    const injected = resolveAvatar({ config: { color: 'red; background:url(http://evil)' }, name: 'Marie' });
    expect(AVATAR_COLORS).toContain(injected.color);
    expect(injected.color).toBe(fallbackAvatarColor('marie'));
  });

  it('refuses an unknown symbol key and an unknown type', () => {
    expect(AVATAR_ICONS).toContain(resolveAvatar({ config: { type: 'icon', value: 'skull' }, name: 'G', kind: 'group' }).icon);
    expect(resolveAvatar({ config: { type: 'photo' }, name: 'Marie', kind: 'user' }).type).toBe('initials');
  });

  it('resolves with no arguments at all', () => {
    const r = resolveAvatar();
    expect(r.initials).toBe('?');
    expect(AVATAR_COLORS).toContain(r.color);
  });
});

describe('validation helpers', () => {
  it('accepts palette colours and preset keys, and nothing else', () => {
    expect(isAvatarColor(DEFAULT_AVATAR_COLOR)).toBe(true);
    expect(isAvatarColor('#60457B')).toBe(true); // case-insensitive
    expect(isAvatarColor('#ff0000')).toBe(false);
    expect(isAvatarColor(null)).toBe(false);
    expect(isAvatarIcon('dove')).toBe(true);
    expect(isAvatarIcon('rocket')).toBe(false);
  });

  it('reads the three columns off any row shape, missing ones included', () => {
    expect(avatarConfigFrom({ avatar_type: 'icon', avatar_value: 'cross', avatar_color: '#4a4f9e' }))
      .toEqual({ type: 'icon', value: 'cross', color: '#4a4f9e', photoPath: null });
    expect(avatarConfigFrom({ name: 'legacy row' })).toEqual({ type: null, value: null, color: null, photoPath: null });
    expect(avatarConfigFrom(null)).toBeNull();
  });

  it('never persists a value it would refuse to read back', () => {
    expect(avatarColumns({ type: 'icon', value: 'dove', color: '#2f6ea8' }))
      .toEqual({ avatar_type: 'icon', avatar_value: 'dove', avatar_color: '#2f6ea8', avatar_photo_path: null });
    // Initials carry no symbol, so the symbol column is cleared.
    expect(avatarColumns({ type: 'initials', value: 'dove', color: '#2f6ea8' }).avatar_value).toBeNull();
    // A photo whose object key is junk is not a photo: the type collapses too,
    // so the row falls back to the deterministic avatar instead of claiming an
    // image it cannot show.
    expect(avatarColumns({ type: 'photo', value: '<script>', color: 'javascript:alert(1)' }))
      .toEqual({ avatar_type: null, avatar_value: null, avatar_color: null, avatar_photo_path: null });
    expect(avatarColumns()).toEqual({ avatar_type: null, avatar_value: null, avatar_color: null, avatar_photo_path: null });
  });
});

describe('group avatar editing permission', () => {
  it('allows admins and the creator', () => {
    expect(canEditGroupAvatar({ id: 'g1', role: 'admin', created_by: 'someone' }, 'me')).toBe(true);
    expect(canEditGroupAvatar({ id: 'g1', role: 'member', created_by: 'me' }, 'me')).toBe(true);
  });

  it('refuses a plain member, a signed-out caller and a missing group', () => {
    expect(canEditGroupAvatar({ id: 'g1', role: 'member', created_by: 'someone' }, 'me')).toBe(false);
    expect(canEditGroupAvatar({ id: 'g1', role: 'admin' }, null)).toBe(false);
    expect(canEditGroupAvatar(null, 'me')).toBe(false);
  });
});

describe('palette contrast', () => {
  // The tile carries white glyphs and initials, so every fill must clear the
  // 4.5:1 text threshold. The fill is a constant, so this holds in every theme.
  const luminance = (hex) => {
    const parts = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2];
  };

  it('carries white text at AA on every swatch', () => {
    for (const hex of AVATAR_COLORS) {
      expect(1.05 / (luminance(hex) + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps the palette and the database check constraint the same size', () => {
    expect(AVATAR_COLORS).toHaveLength(8);
    expect(new Set(AVATAR_COLORS).size).toBe(8);
    expect(new Set(AVATAR_ICONS).size).toBe(AVATAR_ICONS.length);
  });
});
