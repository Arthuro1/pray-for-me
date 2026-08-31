// @vitest-environment jsdom
// Container detection is kept independent from the heavyweight FFmpeg import:
// ordinary MP4/WebM uploads must stay on the fast path, while AVI is normalized.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { needsVideoTranscode, mp4Name } from './videoTranscode';

afterEach(() => vi.restoreAllMocks());

describe('video transcoding selection', () => {
  it('recognizes AVI by MIME or filename', () => {
    expect(needsVideoTranscode({ type: 'video/x-msvideo', name: 'movie.bin' })).toBe(true);
    expect(needsVideoTranscode({ type: 'video/video', name: 'MOV08533.AVI' })).toBe(true);
    expect(needsVideoTranscode({ type: 'video', mime: 'video/avi', name: 'legacy' })).toBe(true);
  });

  it('keeps browser-native MP4 and WebM on the zero-download fast path', () => {
    expect(needsVideoTranscode({ type: 'video/mp4', name: 'clip.mp4' })).toBe(false);
    expect(needsVideoTranscode({ type: 'video/webm', name: 'clip.webm' })).toBe(false);
  });

  it('uses browser capability detection for less common containers', () => {
    const canPlayType = vi.fn(() => '');
    vi.spyOn(document, 'createElement').mockReturnValue({ canPlayType });
    expect(needsVideoTranscode({ type: 'video/quicktime', name: 'clip.mov' })).toBe(true);
    expect(canPlayType).toHaveBeenCalledWith('video/quicktime');
  });

  it('renames converted files as MP4 without losing the original stem', () => {
    expect(mp4Name('MOV08533.AVI')).toBe('MOV08533.mp4');
    expect(mp4Name('video')).toBe('video.mp4');
  });
});
