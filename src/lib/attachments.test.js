// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { prepareVideoFile, encryptBlob, upload } = vi.hoisted(() => ({
  prepareVideoFile: vi.fn(),
  encryptBlob: vi.fn(),
  upload: vi.fn(),
}));

vi.mock('./videoTranscode', () => ({ prepareVideoFile }));
vi.mock('./crypto/mediaCrypto', () => ({ encryptBlob, decryptToBlob: vi.fn() }));
vi.mock('./supabase', () => ({
  supabase: { storage: { from: () => ({ upload, download: vi.fn(), remove: vi.fn() }) } },
}));

const { uploadAttachment } = await import('./attachments');

beforeEach(() => {
  prepareVideoFile.mockReset();
  encryptBlob.mockReset();
  upload.mockReset();
  encryptBlob.mockResolvedValue({ bytes: new Uint8Array([1]), key: 'key', iv: 'iv', encryptionVersion: 2 });
  upload.mockResolvedValue({ error: null });
});

describe('uploadAttachment video normalization', () => {
  it('encrypts and uploads the converted MP4 and returns it for local preview', async () => {
    const avi = new File(['avi'], 'MOV08533.AVI', { type: 'video/x-msvideo' });
    const mp4 = new File(['mp4'], 'MOV08533.mp4', { type: 'video/mp4' });
    prepareVideoFile.mockResolvedValue(mp4);

    const result = await uploadAttachment(avi, 'user-1');

    expect(prepareVideoFile).toHaveBeenCalledWith(avi);
    expect(encryptBlob).toHaveBeenCalledWith(mp4, expect.any(Object));
    expect(result.previewFile).toBe(mp4);
    expect(result.attachment).toMatchObject({
      type: 'video', mime: 'video/mp4', name: 'MOV08533.mp4', size: mp4.size,
    });
  });

  it('reports an unsupported file instead of uploading an unreadable video when conversion fails', async () => {
    const avi = new File(['avi'], 'broken.avi', { type: 'video/x-msvideo' });
    prepareVideoFile.mockRejectedValue(new Error('decode failed'));

    await expect(uploadAttachment(avi, 'user-1')).resolves.toEqual({ error: 'attachUnsupported' });
    expect(upload).not.toHaveBeenCalled();
  });

  it('rejects an oversized video before allocating converter memory', async () => {
    const huge = { name: 'huge.avi', type: 'video/x-msvideo', size: 51 * 1024 * 1024 };
    await expect(uploadAttachment(huge, 'user-1')).resolves.toEqual({ error: 'attachTooLarge' });
    expect(prepareVideoFile).not.toHaveBeenCalled();
  });
});
