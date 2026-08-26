// @vitest-environment jsdom
//
// The shared Avatar tile and its editor: what gets drawn, what a screen reader
// hears, what a keyboard can reach, and that neither theme nor writing direction
// changes the answer. Tested against the bundled `fr` fallback locale.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import Avatar from '../shared/Avatar';
import AvatarEditor from '../shared/AvatarEditor';
import { AVATAR_COLORS, AVATAR_ICONS, fallbackAvatarColor, fallbackAvatarIcon } from '../../lib/avatar';
import { t } from '../../i18n';

const lang = 'fr';

// The tile is the only element carrying the .avatar class.
const tile = (root = document.body) => root.querySelector('.avatar');

afterEach(() => {
  cleanup();
  document.documentElement.dir = '';
  document.documentElement.removeAttribute('data-theme');
});

describe('Avatar rendering', () => {
  it('draws a person as their initials on a deterministic fill', () => {
    render(<Avatar name="Marie Dupont" />);
    const el = tile();
    expect(el.textContent).toBe('MD');
    expect(el.style.background).toBeTruthy();
    expect(AVATAR_COLORS.map((c) => c.toLowerCase())).toContain(rgbToHex(el.style.background));
  });

  it('draws a group as a symbol, not as letters', () => {
    render(<Avatar kind="group" name="Guerriers de prière" />);
    const el = tile();
    expect(el.textContent).toBe('');
    expect(el.querySelector('svg')).not.toBeNull();
  });

  it('honours a stored preset over the deterministic fallback', () => {
    const chosen = AVATAR_COLORS.find((c) => c !== fallbackAvatarColor('groupe'));
    render(<Avatar kind="group" name="Groupe" avatar={{ type: 'icon', value: 'dove', color: chosen }} />);
    expect(rgbToHex(tile().style.background)).toBe(chosen);
  });

  it('renders a row with no avatar columns at all, as an existing group would', () => {
    render(<Avatar kind="group" name="Ancien groupe" avatar={{ type: null, value: null, color: null }} />);
    const el = tile();
    expect(el.querySelector('svg')).not.toBeNull();
    expect(rgbToHex(el.style.background)).toBe(fallbackAvatarColor('ancien groupe'));
    expect(AVATAR_ICONS).toContain(fallbackAvatarIcon('ancien groupe'));
  });

  it('shows the anonymous mask instead of a name-derived tile', () => {
    render(<Avatar name="Marie Dupont" anonymous />);
    const el = tile();
    expect(el.className).toContain('avatar--anonymous');
    expect(el.textContent).toBe('');
    // Never leaks initials of the person who chose to stay anonymous.
    expect(document.body.textContent).not.toContain('MD');
  });

  it('scales the tile and its glyph with the requested size', () => {
    render(<Avatar name="Marie" size={64} />);
    expect(tile().style.width).toBe('64px');
    expect(tile().style.height).toBe('64px');
  });

  it('drops to one legible initial in the inline sizes', () => {
    const { unmount } = render(<Avatar name="Marie Dupont" size={18} />);
    expect(tile().textContent).toBe('M');
    expect(tile().querySelector('span').style.fontSize).toBe('9px');
    unmount();
    render(<Avatar name="Marie Dupont" size={32} />);
    expect(tile().textContent).toBe('MD');
  });

  it('rounds a person fully and a group softly, so the two read apart', () => {
    const { unmount } = render(<Avatar name="Marie" size={40} />);
    expect(tile().style.borderRadius).toBe('50%');
    unmount();
    render(<Avatar kind="group" name="Groupe" size={40} />);
    expect(tile().style.borderRadius).toBe('12px');
  });
});

describe('Avatar accessibility', () => {
  it('is decorative by default — it sits beside the name it would repeat', () => {
    render(<Avatar name="Marie Dupont" />);
    expect(tile().getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('takes a real accessible name when it stands alone', () => {
    render(<Avatar name="Marie Dupont" label="Marie Dupont" />);
    const el = screen.getByRole('img', { name: 'Marie Dupont' });
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });

  it('keeps the decorative rule for the anonymous tile too', () => {
    render(<Avatar name="?" anonymous />);
    expect(tile().getAttribute('aria-hidden')).toBe('true');
  });
});

describe('Avatar theming and direction', () => {
  // The fill is a fixed palette value, not a theme token, precisely so a chosen
  // colour is the same colour in light, dark and night — only the ring adapts.
  it('draws the same fill in light and in dark', () => {
    document.documentElement.removeAttribute('data-theme');
    const { unmount } = render(<Avatar kind="group" name="Groupe" avatar={{ type: 'icon', value: 'cross', color: '#1f7d76' }} />);
    const light = tile().style.background;
    unmount();
    document.documentElement.setAttribute('data-theme', 'dark');
    render(<Avatar kind="group" name="Groupe" avatar={{ type: 'icon', value: 'cross', color: '#1f7d76' }} />);
    expect(tile().style.background).toBe(light);
  });

  it('uses no physical left/right offsets that would break in RTL', () => {
    document.documentElement.dir = 'rtl';
    render(<Avatar name="أحمد حسن" size={32} />);
    const el = tile();
    expect(el.style.marginLeft).toBe('');
    expect(el.style.marginRight).toBe('');
    expect(el.textContent).toBe('أح');
  });
});

describe('AvatarEditor', () => {
  const setup = (props = {}) => {
    const onSave = vi.fn().mockResolvedValue({});
    render(<AvatarEditor lang={lang} kind="group" name="Guerriers de prière" avatar={null} onSave={onSave} {...props} />);
    return { onSave };
  };

  it('offers exactly one symbol group and one colour group, both labelled', () => {
    setup();
    const groups = screen.getAllByRole('radiogroup');
    expect(groups).toHaveLength(2);
    expect(screen.getByRole('radiogroup', { name: t(lang, 'avatarSymbol') })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: t(lang, 'avatarColor') })).toBeTruthy();
  });

  it('labels every swatch and symbol, so none is announced as an empty button', () => {
    setup();
    const colours = within(screen.getByRole('radiogroup', { name: t(lang, 'avatarColor') })).getAllByRole('radio');
    expect(colours).toHaveLength(AVATAR_COLORS.length);
    for (const c of colours) expect(c.getAttribute('aria-label')?.trim()).toBeTruthy();

    const symbols = within(screen.getByRole('radiogroup', { name: t(lang, 'avatarSymbol') })).getAllByRole('radio');
    // The preset symbols plus the "initials" option.
    expect(symbols).toHaveLength(AVATAR_ICONS.length + 1);
    expect(symbols[0].getAttribute('aria-label')).toBe(t(lang, 'avatarInitials'));
  });

  it('exposes the current choice as aria-checked, not by colour alone', () => {
    setup({ avatar: { type: 'icon', value: 'dove', color: '#2f6ea8' } });
    const symbols = within(screen.getByRole('radiogroup', { name: t(lang, 'avatarSymbol') })).getAllByRole('radio');
    const checked = symbols.filter((s) => s.getAttribute('aria-checked') === 'true');
    expect(checked).toHaveLength(1);
    expect(checked[0].getAttribute('aria-label')).toBe(t(lang, 'avatarIconDove'));
  });

  it('keeps one tab stop per group and moves the selection with arrow keys', () => {
    setup({ avatar: { type: 'icon', value: 'dove', color: AVATAR_COLORS[0] } });
    const group = screen.getByRole('radiogroup', { name: t(lang, 'avatarColor') });
    const radios = within(group).getAllByRole('radio');
    expect(radios.filter((r) => r.getAttribute('tabindex') === '0')).toHaveLength(1);

    fireEvent.keyDown(group, { key: 'ArrowRight' });
    const after = within(group).getAllByRole('radio');
    expect(after[1].getAttribute('aria-checked')).toBe('true');
    expect(after[1].getAttribute('tabindex')).toBe('0');

    fireEvent.keyDown(group, { key: 'End' });
    expect(within(group).getAllByRole('radio').at(-1).getAttribute('aria-checked')).toBe('true');
  });

  it('follows the reader in RTL: ArrowLeft advances', () => {
    document.documentElement.dir = 'rtl';
    setup({ avatar: { type: 'icon', value: 'dove', color: AVATAR_COLORS[0] } });
    const group = screen.getByRole('radiogroup', { name: t(lang, 'avatarColor') });
    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(within(group).getAllByRole('radio')[1].getAttribute('aria-checked')).toBe('true');
  });

  it('saves the chosen preset and nothing else', async () => {
    const { onSave } = setup();
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'avatarIconChurch') }));
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'avatarColorTeal') }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'avatarSave') }));
    expect(onSave).toHaveBeenCalledWith({ type: 'icon', value: 'church', color: AVATAR_COLORS[3] });
  });

  it('clears the symbol when the user goes back to initials', () => {
    const { onSave } = setup({ kind: 'user', name: 'Marie Dupont', avatar: { type: 'icon', value: 'heart', color: AVATAR_COLORS[1] } });
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'avatarInitials') }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'avatarSave') }));
    expect(onSave).toHaveBeenCalledWith({ type: 'initials', value: null, color: AVATAR_COLORS[1] });
  });

  it('previews the draft with a named tile, and updates it live', () => {
    setup({ kind: 'user', name: 'Marie Dupont', avatar: null });
    const preview = screen.getByRole('img', { name: t(lang, 'avatarPreview') });
    expect(preview.textContent).toBe('MD');
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'avatarIconDove') }));
    expect(screen.getByRole('img', { name: t(lang, 'avatarPreview') }).textContent).toBe('');
  });
});

// jsdom normalises an inline hex background to rgb(); bring it back for comparison.
function rgbToHex(value) {
  const m = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(value || '');
  if (!m) return value;
  return `#${[1, 2, 3].map((i) => Number(m[i]).toString(16).padStart(2, '0')).join('')}`;
}
