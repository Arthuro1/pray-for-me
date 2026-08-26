import { useId, useState } from 'react';
import { Loader2, Type } from 'lucide-react';
import Avatar from './Avatar';
import { AVATAR_ICON_COMPONENTS } from './avatarIcons';
import { AVATAR_COLORS, AVATAR_ICONS, resolveAvatar } from '../../lib/avatar';
import { t } from '../../i18n';

const ICON_LABEL_KEYS = {
  dove: 'avatarIconDove', cross: 'avatarIconCross', church: 'avatarIconChurch', hands: 'avatarIconHands',
  family: 'avatarIconFamily', heart: 'avatarIconHeart', bible: 'avatarIconBible', globe: 'avatarIconGlobe',
};
const COLOR_LABEL_KEYS = [
  'avatarColorPlum', 'avatarColorIndigo', 'avatarColorSky', 'avatarColorTeal',
  'avatarColorGreen', 'avatarColorAmber', 'avatarColorClay', 'avatarColorRose',
];

// A single-select row of tiles with real radio semantics: one tab stop, arrow
// keys move (and select) within the group, and the choice is marked by a ring
// as well as by colour. `dir` is read from the document so Left/Right follow
// what the reader sees in RTL instead of the array order.
function OptionRow({ label, options, value, onChange }) {
  // A generated id, not the translated label: a label can contain spaces (never
  // valid in an id) and two editors can be mounted at once.
  const labelId = useId();
  const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  const onKeyDown = (e) => {
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    let next = null;
    if (e.key === forward || e.key === 'ArrowDown') next = (index + 1) % options.length;
    else if (e.key === back || e.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = options.length - 1;
    if (next === null) return;
    e.preventDefault();
    onChange(options[next].value);
  };

  return (
    <div className="mb-4">
      <p id={labelId} className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>{label}</p>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2" onKeyDown={onKeyDown}>
        {options.map((o, i) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            aria-label={o.label}
            tabIndex={i === index ? 0 : -1}
            onClick={() => onChange(o.value)}
            className="avatar-option"
            style={o.style}
          >
            {o.render}
          </button>
        ))}
      </div>
    </div>
  );
}

// The whole avatar editing experience, in one small component shared by group
// settings and the profile: pick a symbol, pick a colour, save. Deliberately not
// a profile-customisation screen — three controls and nothing else.
//
// `onSave` receives { type, value, color } and returns a promise; the caller owns
// persistence (and the permission check that let this render at all).
export default function AvatarEditor({ lang, kind = 'user', name, avatar, onSave }) {
  const initial = resolveAvatar({ config: avatar, name, kind });
  const [type, setType] = useState(initial.type);
  const [icon, setIcon] = useState(initial.icon || AVATAR_ICONS[0]);
  const [color, setColor] = useState(initial.color);
  const [saving, setSaving] = useState(false);

  const draft = { type, value: type === 'icon' ? icon : null, color };

  const symbolOptions = [
    {
      value: 'initials',
      label: t(lang, 'avatarInitials'),
      render: <Type size={18} aria-hidden="true" />,
    },
    ...AVATAR_ICONS.map((key) => {
      const Icon = AVATAR_ICON_COMPONENTS[key];
      return { value: key, label: t(lang, ICON_LABEL_KEYS[key]), render: <Icon size={18} strokeWidth={1.9} aria-hidden="true" /> };
    }),
  ];

  const colorOptions = AVATAR_COLORS.map((hex, i) => ({
    value: hex,
    label: t(lang, COLOR_LABEL_KEYS[i]),
    render: <span className="block w-5 h-5 rounded-full" style={{ background: hex }} aria-hidden="true" />,
  }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Avatar kind={kind} name={name} avatar={draft} size={52} label={t(lang, 'avatarPreview')} />
        <p className="text-sm min-w-0 truncate" style={{ color: 'var(--text-2)' }}>{name}</p>
      </div>

      <OptionRow
        label={t(lang, 'avatarSymbol')}
        options={symbolOptions}
        value={type === 'initials' ? 'initials' : icon}
        onChange={(v) => { if (v === 'initials') setType('initials'); else { setType('icon'); setIcon(v); } }}
      />

      <OptionRow label={t(lang, 'avatarColor')} options={colorOptions} value={color} onChange={setColor} />

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
        style={{ background: 'var(--accent)' }}
      >
        {saving ? <Loader2 size={14} className="animate-spin mx-auto" aria-hidden="true" /> : t(lang, 'avatarSave')}
      </button>
    </div>
  );
}
