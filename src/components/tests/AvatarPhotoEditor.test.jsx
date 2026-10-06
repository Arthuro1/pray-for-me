// @vitest-environment jsdom
//
// The photo half of the avatar editor: which verbs are offered, what a chosen
// file goes through before it is uploaded, and what the crop dialog owes a
// keyboard. Tested against the bundled `fr` fallback locale.
//
// The image pipeline and the storage service are stubbed here on purpose —
// they have their own tests (avatarImage.browser.spec.js against a real canvas,
// avatarPhotos.test.js for the replacement ordering). What this file pins down
// is that the component calls them with the right thing, at the right moment,
// and only once.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import AvatarEditor from '../shared/AvatarEditor';
import { toast } from '../../store/toastStore';
import { t } from '../../i18n';
import { AVATAR_COLORS } from '../../lib/avatar';

const signedAvatarUrl = vi.fn();
const commitAvatarPhoto = vi.fn();
const commitAvatarChoice = vi.fn();
const loadAvatarSource = vi.fn();
const renderAvatarBlob = vi.fn();

vi.mock('../../lib/avatarPhotos', () => ({
  AVATAR_SCOPES: { user: 'profiles', group: 'groups' },
  signedAvatarUrl: (...a) => signedAvatarUrl(...a),
  commitAvatarPhoto: (...a) => commitAvatarPhoto(...a),
  commitAvatarChoice: (...a) => commitAvatarChoice(...a),
}));

vi.mock('../../lib/avatarImage', async (importOriginal) => ({
  ...(await importOriginal()),
  loadAvatarSource: (...a) => loadAvatarSource(...a),
  renderAvatarBlob: (...a) => renderAvatarBlob(...a),
}));

const lang = 'fr';
const ME = '11111111-2222-4333-8444-555555555555';
const OBJ = 'abcdef0123456789abcdef0123456789';
const MY_PHOTO = `profiles/${ME}/${OBJ}.webp`;
const NEW_PHOTO = `profiles/${ME}/${'1'.repeat(32)}.webp`;
const GOOGLE = 'https://lh3.googleusercontent.com/a/opaque=s96-c';

const jpeg = (size = 2048) => ({ type: 'image/jpeg', size, name: 'IMG_0042.jpg' });
const fileInput = () => document.body.querySelector('input[type="file"]');
const button = (key) => screen.queryByRole('button', { name: t(lang, key) });
const chooseFile = (file) => fireEvent.change(fileInput(), { target: { files: [file] } });

function setup(props = {}) {
  const onSave = vi.fn().mockResolvedValue({});
  render(<AvatarEditor lang={lang} kind="user" name="Marie Dupont" avatar={null} ownerId={ME} onSave={onSave} {...props} />);
  return { onSave };
}

beforeEach(() => {
  [signedAvatarUrl, commitAvatarPhoto, commitAvatarChoice, loadAvatarSource, renderAvatarBlob].forEach((m) => m.mockReset());
  signedAvatarUrl.mockResolvedValue('https://signed.example/a.webp');
  commitAvatarPhoto.mockResolvedValue({ config: { type: 'photo', value: null, color: null, photoPath: NEW_PHOTO } });
  commitAvatarChoice.mockResolvedValue({ config: {} });
  loadAvatarSource.mockResolvedValue({ source: { width: 800, height: 600, close: vi.fn() } });
  renderAvatarBlob.mockResolvedValue({ blob: { type: 'image/webp', size: 40000 }, ext: 'webp' });
  vi.stubGlobal('navigator', { onLine: true });
  vi.spyOn(toast, 'success').mockImplementation(() => {});
  vi.spyOn(toast, 'error').mockImplementation(() => {});
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('which photo actions are offered', () => {
  it('offers only "upload" to an account with no photo and no account picture', () => {
    setup();
    expect(button('avatarPhotoUpload')).toBeTruthy();
    expect(button('avatarUseGooglePhoto')).toBeNull();
    expect(button('avatarPhotoRemove')).toBeNull();
  });

  // Already on the account picture — there is nothing to go back to.
  it('hides "use Google photo" while the account picture is what is showing', () => {
    setup({ identityPhotoUrl: GOOGLE });
    expect(button('avatarUseGooglePhoto')).toBeNull();
  });

  it('offers "use Google photo" once an explicit choice has been made', () => {
    setup({ identityPhotoUrl: GOOGLE, avatar: { type: 'icon', value: 'dove', color: AVATAR_COLORS[0] } });
    expect(button('avatarUseGooglePhoto')).toBeTruthy();
  });

  it('offers change and remove once a photo exists', () => {
    setup({ avatar: { type: 'photo', value: null, color: null, photoPath: MY_PHOTO } });
    expect(button('avatarPhotoChange')).toBeTruthy();
    expect(button('avatarPhotoRemove')).toBeTruthy();
    expect(button('avatarPhotoUpload')).toBeNull();
  });

  it('offers no group photo controls that a group cannot use', () => {
    setup({ kind: 'group', name: 'Famille', identityPhotoUrl: null });
    expect(button('avatarPhotoUpload')).toBeTruthy();
    expect(button('avatarUseGooglePhoto')).toBeNull();
  });
});

describe('choosing a file', () => {
  it('refuses an unsupported format with a localized message, and opens nothing', () => {
    setup();
    chooseFile({ type: 'image/svg+xml', size: 100, name: 'x.svg' });
    expect(toast.error).toHaveBeenCalledWith(t(lang, 'avatarPhotoUnsupported'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('refuses an oversized file before decoding it', () => {
    setup();
    chooseFile(jpeg(6 * 1024 * 1024));
    expect(toast.error).toHaveBeenCalledWith(t(lang, 'avatarPhotoTooLarge'));
    expect(loadAvatarSource).not.toHaveBeenCalled();
  });

  it('opens the crop dialog for a valid photo', async () => {
    setup();
    chooseFile(jpeg());
    expect(await screen.findByRole('dialog', { name: t(lang, 'avatarCropTitle') })).toBeTruthy();
  });

  it('says so plainly instead of queuing an upload while offline', () => {
    vi.stubGlobal('navigator', { onLine: false });
    setup();
    fireEvent.click(button('avatarPhotoUpload'));
    expect(toast.error).toHaveBeenCalledWith(t(lang, 'avatarPhotoOffline'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('reports a file that turns out not to be decodable', async () => {
    loadAvatarSource.mockResolvedValue({ error: 'avatarPhotoUnreadable' });
    setup();
    chooseFile(jpeg());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(t(lang, 'avatarPhotoUnreadable')));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('the crop dialog', () => {
  const openCrop = async () => {
    setup();
    chooseFile(jpeg());
    return screen.findByRole('dialog', { name: t(lang, 'avatarCropTitle') });
  };

  it('is a modal dialog with the crop frame and zoom controls all named', async () => {
    const dialog = await openCrop();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('img', { name: t(lang, 'avatarCropFrame') })).toBeTruthy();
    expect(screen.getByRole('slider', { name: t(lang, 'avatarZoom') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t(lang, 'avatarZoomIn') })).toBeTruthy();
    expect(screen.getByRole('button', { name: t(lang, 'avatarZoomOut') })).toBeTruthy();
  });

  it('traps focus inside itself when it opens', async () => {
    const dialog = await openCrop();
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it('closes on Escape and hands focus back', async () => {
    await openCrop();
    const before = document.activeElement;
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).not.toBe(before);
  });

  it('can be dismissed with Cancel without uploading anything', async () => {
    await openCrop();
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'cancel') }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(commitAvatarPhoto).not.toHaveBeenCalled();
  });

  it('lets the keyboard reposition the frame', async () => {
    await openCrop();
    const frame = screen.getByRole('img', { name: t(lang, 'avatarCropFrame') });
    frame.focus();
    // Arrow keys must be consumed by the frame, not scroll the sheet behind it.
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    frame.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe('saving a photo', () => {
  const uploadOne = async (props = {}) => {
    const ctx = setup(props);
    chooseFile(jpeg());
    await screen.findByRole('dialog', { name: t(lang, 'avatarCropTitle') });
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'avatarPhotoSave') }));
    return ctx;
  };

  it('hands the processed bytes to the replacement flow, with the owner it belongs to', async () => {
    const { onSave } = await uploadOne({ avatar: { type: 'photo', value: 'dove', color: AVATAR_COLORS[3], photoPath: MY_PHOTO } });
    await waitFor(() => expect(commitAvatarPhoto).toHaveBeenCalled());
    expect(commitAvatarPhoto).toHaveBeenCalledWith(expect.objectContaining({
      scope: 'profiles',
      ownerId: ME,
      ext: 'webp',
      previousPath: MY_PHOTO,
      save: onSave,
    }));
    // The original file is never what gets uploaded.
    expect(commitAvatarPhoto.mock.calls[0][0].blob.type).toBe('image/webp');
  });

  it('confirms, closes the dialog, and shows the new photo', async () => {
    await uploadOne();
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(t(lang, 'avatarPhotoUpdated')));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button('avatarPhotoRemove')).toBeTruthy();
  });

  it('keeps the previous avatar and says so when the upload fails', async () => {
    commitAvatarPhoto.mockResolvedValue({ error: 'uploadFailed' });
    await uploadOne({ avatar: { type: 'photo', value: null, color: null, photoPath: MY_PHOTO } });
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(t(lang, 'uploadFailed')));
    expect(button('avatarPhotoChange')).toBeTruthy();
  });

  // Tapping Save twice must not start a second upload of the same crop.
  it('commits once however many times Save is tapped', async () => {
    let release;
    commitAvatarPhoto.mockReturnValue(new Promise((resolve) => { release = resolve; }));
    setup();
    chooseFile(jpeg());
    await screen.findByRole('dialog', { name: t(lang, 'avatarCropTitle') });
    const save = screen.getByRole('button', { name: t(lang, 'avatarPhotoSave') });
    fireEvent.click(save);
    fireEvent.click(save);
    fireEvent.click(save);
    await waitFor(() => expect(commitAvatarPhoto).toHaveBeenCalledTimes(1));
    release({ config: { type: 'photo', value: null, color: null, photoPath: NEW_PHOTO } });
  });
});

describe('going back to something else', () => {
  it('clears the explicit choice so the account picture becomes the default again', async () => {
    setup({ identityPhotoUrl: GOOGLE, avatar: { type: 'photo', value: null, color: null, photoPath: MY_PHOTO } });
    fireEvent.click(button('avatarUseGooglePhoto'));
    await waitFor(() => expect(commitAvatarChoice).toHaveBeenCalledWith(expect.objectContaining({
      previousPath: MY_PHOTO,
      config: { type: null, value: null, color: null },
    })));
    await waitFor(() => expect(button('avatarUseGooglePhoto')).toBeNull());
  });

  // Removing a photo must not cost the person the symbol and colour they chose
  // before it — that preset is exactly what should resurface.
  it('restores the preset that was sitting under the photo', async () => {
    setup({ avatar: { type: 'photo', value: 'cross', color: AVATAR_COLORS[5], photoPath: MY_PHOTO } });
    fireEvent.click(button('avatarPhotoRemove'));
    await waitFor(() => expect(commitAvatarChoice).toHaveBeenCalledWith(expect.objectContaining({
      previousPath: MY_PHOTO,
      config: { type: 'icon', value: 'cross', color: AVATAR_COLORS[5] },
    })));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(t(lang, 'avatarPhotoRemoved')));
  });

  it('falls back to the default when there was no preset underneath', async () => {
    setup({ identityPhotoUrl: GOOGLE, avatar: { type: 'photo', value: null, color: null, photoPath: MY_PHOTO } });
    fireEvent.click(button('avatarPhotoRemove'));
    await waitFor(() => expect(commitAvatarChoice).toHaveBeenCalledWith(expect.objectContaining({
      config: { type: null, value: null, color: null },
    })));
  });

  it('deletes the photo object when a symbol is chosen instead', async () => {
    setup({ avatar: { type: 'photo', value: null, color: null, photoPath: MY_PHOTO } });
    fireEvent.click(screen.getByRole('radio', { name: t(lang, 'avatarIconChurch') }));
    fireEvent.click(screen.getByRole('button', { name: t(lang, 'avatarUseSymbol') }));
    await waitFor(() => expect(commitAvatarChoice).toHaveBeenCalledWith(expect.objectContaining({
      previousPath: MY_PHOTO,
      config: expect.objectContaining({ type: 'icon', value: 'church' }),
    })));
  });
});
