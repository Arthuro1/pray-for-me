import { useCallback, useId, useRef, useState } from 'react';
import { ImagePlus, Loader2, Sparkles, Trash2, Type } from 'lucide-react';
import Avatar from './Avatar';
import AvatarCropModal from './AvatarCropModal';
import { AVATAR_ICON_COMPONENTS } from './avatarIcons';
import { AVATAR_COLORS, AVATAR_ICONS, isAvatarColor, isAvatarIcon, resolveAvatar } from '../../lib/avatar';
import { AVATAR_SCOPES, commitAvatarChoice, commitAvatarPhoto } from '../../lib/avatarPhotos';
import { ACCEPTED_INPUT_ACCEPT, validateAvatarFile } from '../../lib/avatarImage';
import { toast } from '../../store/toastStore';
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
function OptionRow({ label, options, value, onChange, disabled }) {
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
            disabled={disabled}
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
// settings and the profile: add a photo, or pick a symbol and a colour.
// Deliberately not a profile-customisation screen — a row of verbs and two rows
// of choices.
//
// A photo change is a commit the moment it succeeds (an upload has no half
// state worth keeping), while symbol and colour are drafts confirmed by Save.
//
// `onSave` receives { type, value, color, photoPath } and resolves to
// { error }; the caller owns persistence — and the permission check that let
// this render at all. `ownerId` is the profile or group the photo belongs to,
// which is what the storage policies authorise against.
export default function AvatarEditor({ lang, kind = 'user', name, avatar, ownerId, identityPhotoUrl = null, onSave }) {
  const initial = resolveAvatar({ config: avatar, name, kind });
  // The preset draft — what the two option rows are showing.
  const [symbol, setSymbol] = useState(initial.photo ? (isAvatarIcon(avatar?.value) ? 'icon' : 'initials') : initial.type);
  const [icon, setIcon] = useState(isAvatarIcon(avatar?.value) ? avatar.value : (initial.icon || AVATAR_ICONS[0]));
  const [color, setColor] = useState(initial.color);
  // What is actually stored right now, so an action knows which object it is
  // replacing and which preset survives underneath.
  const [saved, setSaved] = useState(() => ({
    type: avatar?.type ?? null,
    value: isAvatarIcon(avatar?.value) ? avatar.value : null,
    color: isAvatarColor(avatar?.color) ? avatar.color : null,
    photoPath: avatar?.photoPath ?? null,
  }));
  // null | 'preset' | 'photo' | 'identity' | 'remove' — one action at a time, so
  // a double tap cannot start a second upload.
  const [busy, setBusy] = useState(null);
  const [cropFile, setCropFile] = useState(null);
  const fileRef = useRef(null);

  const scope = AVATAR_SCOPES[kind] || AVATAR_SCOPES.user;
  const hasPhoto = !!saved.photoPath;
  const usingIdentity = !hasPhoto && saved.type == null && !!identityPhotoUrl;
  const presetValue = symbol === 'icon' ? icon : null;

  const preview = hasPhoto
    ? { type: 'photo', value: presetValue, color, photoPath: saved.photoPath }
    : usingIdentity
      ? { type: null, value: null, color, photoUrl: identityPhotoUrl }
      : { type: symbol, value: presetValue, color };

  const finish = (error, successKey) => {
    if (error) { toast.error(t(lang, error)); return false; }
    toast.success(t(lang, successKey));
    return true;
  };

  // ── Photo actions ─────────────────────────────────────────────────────────

  const pickFile = () => {
    if (busy) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      toast.error(t(lang, 'avatarPhotoOffline'));
      return;
    }
    fileRef.current?.click();
  };

  const onFileChosen = (e) => {
    const file = e.target.files?.[0];
    // Reset first: picking the same file twice in a row must still fire.
    e.target.value = '';
    if (!file) return;
    const invalid = validateAvatarFile(file);
    if (invalid) { toast.error(t(lang, invalid)); return; }
    setCropFile(file);
  };

  const closeCrop = useCallback((errorKey) => {
    setCropFile(null);
    if (errorKey) toast.error(t(lang, errorKey));
  }, [lang]);

  const onCropConfirm = async (blob, ext) => {
    setBusy('photo');
    const { config, error } = await commitAvatarPhoto({
      scope,
      ownerId,
      blob,
      ext,
      previousPath: saved.photoPath,
      config: { value: saved.value, color: isAvatarColor(color) ? color : saved.color },
      save: onSave,
    });
    setBusy(null);
    setCropFile(null);
    if (!finish(error, 'avatarPhotoUpdated')) return;
    setSaved({ type: 'photo', value: config.value ?? null, color: config.color ?? null, photoPath: config.photoPath });
  };

  // Back to the account picture: the explicit choice is cleared, which is what
  // lets the identity photo become the default again.
  const useIdentityPhoto = async () => {
    if (busy) return;
    setBusy('identity');
    const { error } = await commitAvatarChoice({
      previousPath: saved.photoPath,
      config: { type: null, value: null, color: null },
      save: onSave,
    });
    setBusy(null);
    if (!finish(error, 'avatarUpdated')) return;
    setSaved({ type: null, value: null, color: null, photoPath: null });
  };

  // Removing the photo restores whatever was underneath it — a chosen symbol if
  // there is one, otherwise the account picture / initials default. The preset
  // and its colour are never wiped by this.
  const removePhoto = async () => {
    if (busy || !hasPhoto) return;
    const restored = saved.value ? { type: 'icon', value: saved.value, color: saved.color } : { type: null, value: null, color: saved.color };
    setBusy('remove');
    const { error } = await commitAvatarChoice({ previousPath: saved.photoPath, config: restored, save: onSave });
    setBusy(null);
    if (!finish(error, 'avatarPhotoRemoved')) return;
    setSaved({ ...restored, photoPath: null });
    setSymbol(restored.type === 'icon' ? 'icon' : 'initials');
  };

  // ── Preset save ───────────────────────────────────────────────────────────

  const savePreset = async () => {
    if (busy) return;
    setBusy('preset');
    const { error } = await commitAvatarChoice({
      previousPath: saved.photoPath,
      config: { type: symbol, value: presetValue, color },
      save: onSave,
    });
    setBusy(null);
    if (!finish(error, 'avatarUpdated')) return;
    setSaved({ type: symbol, value: presetValue, color, photoPath: null });
  };

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

  const spinner = <Loader2 size={14} className="animate-spin" aria-hidden="true" />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Avatar kind={kind} name={name} avatar={preview} size={52} label={t(lang, 'avatarPreview')} />
        <p className="text-sm min-w-0 truncate" style={{ color: 'var(--text-2)' }}>{name}</p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_INPUT_ACCEPT}
        onChange={onFileChosen}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>{t(lang, 'avatarPhoto')}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" onClick={pickFile} disabled={!!busy} className="avatar-action">
          {busy === 'photo' ? spinner : <ImagePlus size={16} aria-hidden="true" />}
          {t(lang, hasPhoto ? 'avatarPhotoChange' : 'avatarPhotoUpload')}
        </button>
        {identityPhotoUrl && !usingIdentity && (
          <button type="button" onClick={useIdentityPhoto} disabled={!!busy} className="avatar-action">
            {busy === 'identity' ? spinner : <Sparkles size={16} aria-hidden="true" />}
            {t(lang, 'avatarUseGooglePhoto')}
          </button>
        )}
        {hasPhoto && (
          <button type="button" onClick={removePhoto} disabled={!!busy} className="avatar-action">
            {busy === 'remove' ? spinner : <Trash2 size={16} aria-hidden="true" />}
            {t(lang, 'avatarPhotoRemove')}
          </button>
        )}
      </div>

      <OptionRow
        label={t(lang, 'avatarSymbol')}
        options={symbolOptions}
        value={symbol === 'initials' ? 'initials' : icon}
        disabled={!!busy}
        onChange={(v) => { if (v === 'initials') setSymbol('initials'); else { setSymbol('icon'); setIcon(v); } }}
      />

      <OptionRow label={t(lang, 'avatarColor')} options={colorOptions} value={color} disabled={!!busy} onChange={setColor} />

      <button
        type="button"
        onClick={savePreset}
        disabled={!!busy}
        className="w-full min-h-11 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40"
        style={{ background: 'var(--accent)' }}
      >
        {busy === 'preset'
          ? <Loader2 size={14} className="animate-spin mx-auto" aria-hidden="true" />
          : t(lang, hasPhoto || usingIdentity ? 'avatarUseSymbol' : 'avatarSave')}
      </button>

      {cropFile && (
        <AvatarCropModal
          lang={lang}
          kind={kind}
          file={cropFile}
          onCancel={closeCrop}
          onConfirm={onCropConfirm}
        />
      )}
    </div>
  );
}
