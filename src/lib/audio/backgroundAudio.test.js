import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AUDIO_TRACKS,
  DEFAULT_AUDIO_TRACK_ID,
  clamp01,
  currentBackgroundTrack,
  isBackgroundPlaying,
  resolveTrack,
  startBackgroundInstrumental,
  stopBackgroundAudio,
} from './backgroundAudio';

afterEach(async () => {
  await stopBackgroundAudio();
  vi.unstubAllGlobals();
});

describe('background prayer audio', () => {
  it('offers unique first-party tracks plus a first-class silence option', () => {
    expect(DEFAULT_AUDIO_TRACK_ID).toBe('silence');
    expect(AUDIO_TRACKS.at(-1)).toMatchObject({ id: 'silence', src: null });
    expect(new Set(AUDIO_TRACKS.map(({ id }) => id)).size).toBe(AUDIO_TRACKS.length);
    expect(AUDIO_TRACKS.filter(({ src }) => src).every(({ src }) => src.startsWith('/audio/'))).toBe(true);
  });

  it('resolves known tracks and rejects unknown ids', () => {
    expect(resolveTrack('nature')?.labelKey).toBe('audioNature');
    expect(resolveTrack('missing')).toBeNull();
  });

  it('clamps volume safely', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0.16)).toBe(0.16);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(Number.NaN)).toBe(0);
  });

  it('treats a silent session as a no-op', async () => {
    await expect(startBackgroundInstrumental({ trackId: 'silence' })).resolves.toEqual({
      started: false,
      trackId: 'silence',
    });
    expect(isBackgroundPlaying()).toBe(false);
    expect(currentBackgroundTrack()).toBe('silence');
  });

  it('fails softly when browser audio is unavailable', async () => {
    vi.stubGlobal('Audio', undefined);
    await expect(startBackgroundInstrumental({ trackId: 'soft-piano' })).resolves.toEqual({
      started: false,
      trackId: 'soft-piano',
    });
    expect(isBackgroundPlaying()).toBe(false);
  });
});
