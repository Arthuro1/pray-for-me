// Pure-logic tests for the background instrumental engine. The Web Audio /
// HTMLAudioElement paths need a browser and are exercised manually; here we lock
// down the track manifest, the volume maths, and that Silence + a missing asset
// degrade quietly (never throw, never leave audio "playing").
import { describe, it, expect } from 'vitest';
import {
  AUDIO_TRACKS,
  resolveTrack,
  clamp01,
  duckedLevel,
  startBackgroundInstrumental,
  isBackgroundPlaying,
  stopBackgroundAudio,
} from './backgroundAudio';

describe('AUDIO_TRACKS manifest', () => {
  it('lists Silence first and as a real option (default + first-class)', () => {
    expect(AUDIO_TRACKS[0].id).toBe('silence');
    expect(AUDIO_TRACKS[0].kind).toBe('silence');
  });

  it('gives every track a label key, and every non-silence track a source', () => {
    for (const track of AUDIO_TRACKS) {
      expect(typeof track.labelKey).toBe('string');
      expect(track.labelKey.length).toBeGreaterThan(0);
      if (track.kind === 'file') expect(typeof track.src).toBe('string');
    }
  });

  it('has unique track ids', () => {
    const ids = AUDIO_TRACKS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('resolveTrack', () => {
  it('finds a known track and returns null otherwise', () => {
    expect(resolveTrack('silence')?.id).toBe('silence');
    expect(resolveTrack('soft-piano')?.kind).toBe('file');
    expect(resolveTrack('does-not-exist')).toBeNull();
  });
});

describe('clamp01', () => {
  it('keeps values within [0, 1] and treats non-finite as 0', () => {
    expect(clamp01(0.18)).toBe(0.18);
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(5)).toBe(1);
    expect(clamp01(NaN)).toBe(0);
    expect(clamp01(undefined)).toBe(0);
  });
});

describe('duckedLevel', () => {
  it('lowers the base volume so speech stays clearly audible', () => {
    expect(duckedLevel(0.2)).toBeCloseTo(0.07, 5);
    expect(duckedLevel(0)).toBe(0);
    // Always below the base level it was given.
    expect(duckedLevel(0.5)).toBeLessThan(0.5);
  });
});

describe('startBackgroundInstrumental — graceful paths (no browser audio)', () => {
  it('treats Silence as a no-op and never reports playing', async () => {
    const res = await startBackgroundInstrumental({ trackId: 'silence' });
    expect(res).toEqual({ started: false, trackId: 'silence' });
    expect(isBackgroundPlaying()).toBe(false);
  });

  it('degrades to not-playing (no throw) when neither audio API is available', async () => {
    // In the Node test environment there is no Audio element or AudioContext, so
    // a file track can neither load nor fall back — it must fail soft to silence.
    const res = await startBackgroundInstrumental({ trackId: 'soft-piano' });
    expect(res.started).toBe(false);
    expect(isBackgroundPlaying()).toBe(false);
    await stopBackgroundAudio(); // idempotent, must not throw
  });
});
