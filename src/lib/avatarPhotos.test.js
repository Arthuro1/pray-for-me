// Avatar storage: what an object is called, who signs a URL for it, and the
// order a replacement happens in.
//
// The order is the point. Nobody may end up without the avatar they had
// because a new upload or a database write failed halfway through, and no
// object may be left behind that the row still thinks it owns.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const upload = vi.fn();
const remove = vi.fn();
const createSignedUrl = vi.fn();
const list = vi.fn();
const buckets = [];
const calls = []; // ordered log, so a replacement can be checked as a sequence

vi.mock('./supabase', () => ({
  supabase: {
    storage: {
      from: (bucket) => {
        buckets.push(bucket);
        return {
          upload: (...a) => { calls.push('upload'); return upload(...a); },
          remove: (...a) => { calls.push('remove'); return remove(...a); },
          createSignedUrl: (...a) => createSignedUrl(...a),
          list: (...a) => list(...a),
        };
      },
    },
  },
}));

const {
  AVATARS_BUCKET, AVATAR_SCOPES, clearAvatarUrlCache, commitAvatarChoice, commitAvatarPhoto,
  removeAllAvatarObjects, removeAvatarPhoto, signedAvatarUrl, uploadAvatarPhoto,
} = await import('./avatarPhotos');

const ME = '11111111-2222-4333-8444-555555555555';
const OBJ = 'abcdef0123456789abcdef0123456789';
const OLD = `profiles/${ME}/${OBJ}.webp`;
const blob = { type: 'image/webp', size: 1234 };

beforeEach(() => {
  [upload, remove, createSignedUrl, list].forEach((m) => m.mockReset());
  buckets.length = 0;
  calls.length = 0;
  clearAvatarUrlCache();
  upload.mockResolvedValue({ error: null });
  remove.mockResolvedValue({ error: null });
  createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://signed.example/x' }, error: null });
  vi.stubGlobal('navigator', { onLine: true });
});

afterEach(() => vi.unstubAllGlobals());

describe('object naming', () => {
  it('names an object with an opaque id under its owner folder', async () => {
    const { path } = await uploadAvatarPhoto({ scope: AVATAR_SCOPES.user, ownerId: ME, blob, ext: 'webp' });
    expect(path).toMatch(new RegExp(`^profiles/${ME}/[0-9a-f]{32}\\.webp$`));
    expect(buckets).toContain(AVATARS_BUCKET);
  });

  it('gives every upload a fresh key, so a replacement never overwrites in place', async () => {
    const a = await uploadAvatarPhoto({ scope: AVATAR_SCOPES.group, ownerId: ME, blob, ext: 'jpg' });
    const b = await uploadAvatarPhoto({ scope: AVATAR_SCOPES.group, ownerId: ME, blob, ext: 'jpg' });
    expect(a.path).not.toBe(b.path);
    expect(upload.mock.calls[0][2]).toMatchObject({ upsert: false, contentType: 'image/webp' });
  });

  it('refuses to upload while offline instead of pretending it worked', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    expect(await uploadAvatarPhoto({ scope: 'profiles', ownerId: ME, blob, ext: 'webp' })).toEqual({ error: 'avatarPhotoOffline' });
    expect(upload).not.toHaveBeenCalled();
  });

  it('reports a failed upload rather than throwing', async () => {
    upload.mockResolvedValue({ error: { message: 'denied' } });
    expect(await uploadAvatarPhoto({ scope: 'profiles', ownerId: ME, blob, ext: 'webp' })).toEqual({ error: 'uploadFailed' });
  });
});

describe('signed URLs', () => {
  it('signs one URL per photo, however many tiles ask for it', async () => {
    await Promise.all([signedAvatarUrl(OLD), signedAvatarUrl(OLD), signedAvatarUrl(OLD)]);
    expect(createSignedUrl).toHaveBeenCalledTimes(1);
    expect(await signedAvatarUrl(OLD)).toBe('https://signed.example/x');
  });

  it('answers null for an unreadable object and stops asking for a while', async () => {
    createSignedUrl.mockResolvedValue({ data: null, error: { message: 'not found' } });
    expect(await signedAvatarUrl(OLD)).toBeNull();
    expect(await signedAvatarUrl(OLD)).toBeNull();
    expect(createSignedUrl).toHaveBeenCalledTimes(1);
  });

  it('never reaches the network for a key it would refuse to store', async () => {
    expect(await signedAvatarUrl('../../etc/passwd')).toBeNull();
    expect(await signedAvatarUrl(`profiles/${ME}/marie.jpg`)).toBeNull();
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
});

describe('replacing an avatar', () => {
  const config = { value: 'dove', color: '#1f7d76' };

  it('uploads, then points the row at the new object, then deletes the old one', async () => {
    const save = vi.fn().mockResolvedValue({});
    const { config: next, error } = await commitAvatarPhoto({
      scope: 'profiles', ownerId: ME, blob, ext: 'webp', previousPath: OLD, config, save,
    });

    expect(error).toBeUndefined();
    expect(calls).toEqual(['upload', 'remove']);
    // The row was updated between the two, and points at the NEW object.
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ type: 'photo', value: 'dove' }));
    expect(next.photoPath).not.toBe(OLD);
    expect(remove).toHaveBeenCalledWith([OLD]);
  });

  // The failure this ordering exists to prevent: the person must not lose the
  // avatar they already had because the new one could not be saved.
  it('keeps the previous avatar when the database write fails', async () => {
    const save = vi.fn().mockResolvedValue({ error: 'denied' });
    const { error } = await commitAvatarPhoto({
      scope: 'profiles', ownerId: ME, blob, ext: 'webp', previousPath: OLD, config, save,
    });

    expect(error).toBe('uploadFailed');
    // The old object is untouched; the orphaned new one is cleaned up.
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove.mock.calls[0][0][0]).not.toBe(OLD);
  });

  it('does not touch the row when the upload itself fails', async () => {
    upload.mockResolvedValue({ error: { message: 'quota' } });
    const save = vi.fn();
    expect(await commitAvatarPhoto({ scope: 'profiles', ownerId: ME, blob, ext: 'webp', previousPath: OLD, config, save }))
      .toEqual({ error: 'uploadFailed' });
    expect(save).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  // Cleanup is best-effort: an unreferenced object is a sweep problem, not a
  // reason to tell the user their new picture did not save.
  it('still succeeds when the old object cannot be deleted', async () => {
    remove.mockRejectedValue(new Error('storage down'));
    const save = vi.fn().mockResolvedValue({});
    const { error } = await commitAvatarPhoto({ scope: 'profiles', ownerId: ME, blob, ext: 'webp', previousPath: OLD, config, save });
    expect(error).toBeUndefined();
  });
});

describe('switching away from a photo', () => {
  it('clears the reference first, then deletes the object', async () => {
    const save = vi.fn().mockResolvedValue({});
    const { config } = await commitAvatarChoice({ previousPath: OLD, config: { type: 'icon', value: 'dove', color: '#1f7d76' }, save });
    expect(save).toHaveBeenCalledWith({ type: 'icon', value: 'dove', color: '#1f7d76', photoPath: null });
    expect(remove).toHaveBeenCalledWith([OLD]);
    expect(config.photoPath).toBeNull();
  });

  it('leaves the photo in place when the row could not be updated', async () => {
    const save = vi.fn().mockResolvedValue({ error: 'denied' });
    expect(await commitAvatarChoice({ previousPath: OLD, config: { type: 'initials' }, save })).toEqual({ error: 'errorGeneric' });
    expect(remove).not.toHaveBeenCalled();
  });

  it('asks for nothing when there was no photo to begin with', async () => {
    const save = vi.fn().mockResolvedValue({});
    await commitAvatarChoice({ previousPath: null, config: { type: 'initials' }, save });
    expect(remove).not.toHaveBeenCalled();
  });
});

describe('deletion cleanup', () => {
  it('deletes exactly the object it was given, and nothing shaped like a folder', async () => {
    await removeAvatarPhoto(OLD);
    expect(remove).toHaveBeenCalledWith([OLD]);

    remove.mockClear();
    for (const bad of [`profiles/${ME}`, `profiles/${ME}/%`, 'profiles', '', null]) await removeAvatarPhoto(bad);
    expect(remove).not.toHaveBeenCalled();
  });

  it('sweeps one owner folder when the account or group is deleted', async () => {
    list.mockResolvedValue({ data: [{ name: `${OBJ}.webp` }, { name: 'stray-note.txt' }], error: null });
    await removeAllAvatarObjects(AVATAR_SCOPES.user, ME);
    expect(list).toHaveBeenCalledWith(`profiles/${ME}`);
    // Only well-formed avatar keys inside that folder — never a bucket-wide sweep.
    expect(remove).toHaveBeenCalledWith([`profiles/${ME}/${OBJ}.webp`]);
  });

  it('never lets storage failure block the deletion it belongs to', async () => {
    list.mockRejectedValue(new Error('storage down'));
    await expect(removeAllAvatarObjects(AVATAR_SCOPES.user, ME)).resolves.toBeUndefined();

    list.mockResolvedValue({ data: [], error: null });
    await removeAllAvatarObjects(AVATAR_SCOPES.user, ME);
    expect(remove).not.toHaveBeenCalled();
  });

  it('does nothing at all without an owner', async () => {
    await removeAllAvatarObjects(AVATAR_SCOPES.user, null);
    expect(list).not.toHaveBeenCalled();
  });
});
