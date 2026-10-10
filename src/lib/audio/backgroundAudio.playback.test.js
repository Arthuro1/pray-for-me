// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let audio;
let elements;

class MockAudio extends EventTarget {
  constructor() {
    super();
    this.volume = 1;
    this.currentTime = 0;
    this.src = '';
    this.paused = true;
    this.play = vi.fn(() => { this.paused = false; return Promise.resolve(); });
    this.pause = vi.fn(() => { this.paused = true; this.dispatchEvent(new Event('pause')); });
    this.setAttribute = vi.fn();
    elements.push(this);
  }
}

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  elements = [];
  vi.stubGlobal('Audio', MockAudio);
  vi.stubGlobal('AudioContext', undefined);
  vi.stubGlobal('navigator', { userAgent: 'test browser' });
  audio = await import('./backgroundAudio');
});

afterEach(async () => {
  await audio.stopBackgroundAudio();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const startPrayer = () => audio.startBackgroundInstrumental({ trackId: 'ambient-pad' });

describe('prayer audio playback', () => {
  it('creates no audio element or preload on import, and returns a stable silent snapshot', () => {
    expect(elements).toHaveLength(0);
    expect(audio.getBackgroundAudioState()).toEqual({
      owner: null, status: 'idle', playing: false, trackId: 'silence',
    });
    expect(audio.getBackgroundAudioState()).toBe(audio.getBackgroundAudioState());
    expect(vi.getTimerCount()).toBe(0);
  });

  it('starts directly in the play gesture and fades from silence to a comfortable level', async () => {
    const start = startPrayer();
    const element = elements[0];
    expect(element.play).toHaveBeenCalledOnce();
    expect(element.src).toBe('/audio/ambient-pad.mp3');
    expect(element.preload).toBe('none');
    expect(element.loop).toBe(true);
    expect(element.volume).toBe(0);
    expect(audio.getBackgroundAudioState()).toMatchObject({ owner: 'prayer', status: 'starting' });
    await expect(start).resolves.toEqual({ started: true, trackId: 'ambient-pad' });
    await vi.advanceTimersByTimeAsync(700);
    expect(element.volume).toBeCloseTo(0.08);
    await vi.advanceTimersByTimeAsync(700);
    expect(element.volume).toBeCloseTo(0.16);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('shares an in-progress fade stop until the prayer falls silent', async () => {
    await startPrayer();
    await vi.advanceTimersByTimeAsync(1400);
    const element = elements[0];
    const firstStop = audio.stopBackgroundAudio({ fade: true });
    expect(audio.getBackgroundAudioState()).toMatchObject({ owner: 'prayer', status: 'stopping', playing: false });
    const secondStop = audio.stopBackgroundAudio({ fade: true });
    expect(secondStop).toBe(firstStop);
    await vi.advanceTimersByTimeAsync(900);
    expect(element.volume).toBeCloseTo(0.08);
    expect(audio.getBackgroundAudioState().status).toBe('stopping');
    await vi.advanceTimersByTimeAsync(900);
    await firstStop;
    expect(element.volume).toBe(0);
    expect(element.pause).toHaveBeenCalledTimes(2);
    expect(audio.getBackgroundAudioState()).toMatchObject({ owner: null, status: 'idle' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels a pending play on session cleanup, including its timeout and late resolution', async () => {
    let completePlay;
    const originalPlay = MockAudio;
    vi.stubGlobal('Audio', class extends originalPlay {
      constructor() {
        super();
        this.play = vi.fn(() => new Promise((resolve) => { completePlay = resolve; }));
      }
    });
    const start = startPrayer();
    await audio.stopBackgroundAudio({ fade: false });
    await expect(start).resolves.toEqual({ started: false, trackId: 'ambient-pad' });
    completePlay();
    await Promise.resolve();
    expect(audio.isBackgroundPlaying()).toBe(false);
    expect(audio.getBackgroundAudioState().owner).toBeNull();
    expect(elements[0].volume).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('allows rapid pause then play without a stale fade stopping the new music', async () => {
    await startPrayer();
    await vi.advanceTimersByTimeAsync(1400);
    const oldStop = audio.stopBackgroundAudio({ fade: true });
    await vi.advanceTimersByTimeAsync(100);
    await startPrayer();
    await oldStop;
    const pausesAfterRestart = elements[0].pause.mock.calls.length;
    await vi.advanceTimersByTimeAsync(2000);
    expect(elements[0].pause).toHaveBeenCalledTimes(pausesAfterRestart);
    expect(audio.getBackgroundAudioState()).toMatchObject({ owner: 'prayer', status: 'playing' });
    expect(elements[0].volume).toBeCloseTo(0.16);
  });

  it('switches prayer tracks during a fade without an old stop interrupting the new choice', async () => {
    await startPrayer();
    await vi.advanceTimersByTimeAsync(1400);
    const previousFade = audio.stopBackgroundAudio({ fade: true });
    await audio.startBackgroundInstrumental({ trackId: 'nature' });
    await previousFade;
    const element = elements[0];
    const pauses = element.pause.mock.calls.length;
    await vi.advanceTimersByTimeAsync(2000);
    expect(elements).toHaveLength(1);
    expect(element.src).toBe('/audio/nature.mp3');
    expect(element.pause).toHaveBeenCalledTimes(pauses);
    expect(audio.currentBackgroundTrack()).toBe('nature');
    expect(audio.getBackgroundAudioState()).toMatchObject({ owner: 'prayer', status: 'playing' });
  });

  it('leaves the persisted prayer music choice to the prayer control', async () => {
    const storage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
    vi.stubGlobal('localStorage', storage);
    await startPrayer();
    const stop = audio.stopBackgroundAudio({ fade: true });
    await vi.advanceTimersByTimeAsync(1800);
    await stop;
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('reports a rejected play promise without leaving playback or timeout work behind', async () => {
    vi.stubGlobal('Audio', class extends MockAudio {
      constructor() {
        super();
        this.play = vi.fn(() => Promise.reject(new Error('NotAllowedError')));
      }
    });
    await expect(startPrayer()).resolves.toEqual({ started: false, trackId: 'ambient-pad' });
    expect(audio.getBackgroundAudioState()).toMatchObject({ owner: 'prayer', status: 'error', playing: false });
    expect(elements[0].volume).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('times out a hung playback request and allows a later user retry', async () => {
    vi.stubGlobal('Audio', class extends MockAudio {
      constructor() {
        super();
        this.play = vi.fn(() => new Promise(() => {}));
      }
    });
    const start = startPrayer();
    await vi.advanceTimersByTimeAsync(3500);
    await expect(start).resolves.toEqual({ started: false, trackId: 'ambient-pad' });
    expect(audio.getBackgroundAudioState().status).toBe('error');
    elements[0].play.mockResolvedValue(undefined);
    await expect(startPrayer()).resolves.toEqual({ started: true, trackId: 'ambient-pad' });
  });

  it('reflects missing assets and late media failures in subscribed playback state', async () => {
    const listener = vi.fn();
    const unsubscribe = audio.subscribeBackgroundAudio(listener);
    await startPrayer();
    elements[0].dispatchEvent(new Event('error'));
    expect(audio.getBackgroundAudioState()).toMatchObject({ status: 'error', playing: false });
    expect(audio.isBackgroundPlaying()).toBe(false);
    expect(elements[0].volume).toBe(0);
    expect(listener).toHaveBeenLastCalledWith(audio.getBackgroundAudioState());
    unsubscribe();
    listener.mockClear();
    await audio.stopBackgroundAudio({ fade: false });
    expect(listener).not.toHaveBeenCalled();
  });

  it('reports an external media pause as silence', async () => {
    await startPrayer();
    elements[0].paused = true;
    elements[0].dispatchEvent(new Event('pause'));
    expect(audio.getBackgroundAudioState()).toMatchObject({ owner: null, status: 'idle', playing: false });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('treats silence and unknown track choices as silence without creating an audio element', async () => {
    for (const trackId of ['silence', 'missing']) {
      await expect(audio.startBackgroundInstrumental({ trackId })).resolves.toEqual({ started: false, trackId: 'silence' });
    }
    expect(elements).toHaveLength(0);
    expect(audio.getBackgroundAudioState()).toMatchObject({ owner: null, status: 'idle', playing: false });
  });

  it('stays silent when a mobile browser cannot control volume and has no gain support', async () => {
    vi.stubGlobal('Audio', class extends MockAudio {
      get volume() { return 1; }
      set volume(value) { void value; }
    });
    await expect(startPrayer()).resolves.toEqual({ started: false, trackId: 'ambient-pad' });
    expect(elements[0].play).not.toHaveBeenCalled();
    expect(audio.getBackgroundAudioState().status).toBe('error');
  });

  it('ignores a queued pause event when the reused element has already restarted', async () => {
    await startPrayer();
    const running = audio.getBackgroundAudioState();
    expect(elements[0].paused).toBe(false);
    elements[0].dispatchEvent(new Event('pause'));
    expect(audio.getBackgroundAudioState()).toBe(running);
    expect(audio.isBackgroundPlaying()).toBe(true);
  });

  it('adjusts the current prayer track volume without restarting playback', async () => {
    await startPrayer();
    await vi.advanceTimersByTimeAsync(1400);
    elements[0].currentTime = 20;
    await audio.startBackgroundInstrumental({ trackId: 'ambient-pad', volume: 0.3 });
    expect(elements).toHaveLength(1);
    expect(elements[0].play).toHaveBeenCalledOnce();
    expect(elements[0].currentTime).toBe(20);
    expect(elements[0].volume).toBeCloseTo(0.3);
    expect(audio.getBackgroundAudioState()).toMatchObject({ owner: 'prayer', trackId: 'ambient-pad', status: 'playing' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels a pending load immediately when its media resource fails', async () => {
    vi.stubGlobal('Audio', class extends MockAudio {
      constructor() {
        super();
        this.play = vi.fn(() => new Promise(() => {}));
      }
    });
    const start = startPrayer();
    elements[0].dispatchEvent(new Event('error'));
    await expect(start).resolves.toEqual({ started: false, trackId: 'ambient-pad' });
    expect(audio.getBackgroundAudioState().status).toBe('error');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('uses a gain node for comfortable mobile volume and resumes it in the gesture', async () => {
    const param = {
      value: 0,
      cancelScheduledValues: vi.fn(),
      setValueAtTime: vi.fn(function (value) { this.value = value; }),
      linearRampToValueAtTime: vi.fn(),
    };
    const resume = vi.fn(() => Promise.resolve());
    vi.stubGlobal('AudioContext', class {
      state = 'suspended';
      currentTime = 0;
      destination = {};
      resume = resume;
      createMediaElementSource = () => ({ connect: vi.fn() });
      createGain = () => ({ gain: param, connect: vi.fn() });
    });
    vi.stubGlobal('Audio', class extends MockAudio {
      get volume() { return 1; }
      set volume(value) { void value; }
    });
    const start = startPrayer();
    expect(resume).toHaveBeenCalledOnce();
    await expect(start).resolves.toEqual({ started: true, trackId: 'ambient-pad' });
    expect(param.linearRampToValueAtTime).toHaveBeenLastCalledWith(0.16, 1.4);
    const stop = audio.stopBackgroundAudio({ fade: true });
    expect(param.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 1.8);
    await vi.advanceTimersByTimeAsync(1800);
    await stop;
    expect(audio.isBackgroundPlaying()).toBe(false);
  });

  it('handles a rejected mobile context resume without an unhandled promise', async () => {
    vi.stubGlobal('AudioContext', class {
      state = 'suspended';
      currentTime = 0;
      destination = {};
      resume = () => Promise.reject(new Error('resume blocked'));
      createMediaElementSource = () => ({ connect: vi.fn() });
      createGain = () => ({
        gain: { value: 0, cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      });
    });
    vi.stubGlobal('Audio', class extends MockAudio {
      get volume() { return 1; }
      set volume(value) { void value; }
    });
    await expect(startPrayer()).resolves.toEqual({ started: false, trackId: 'ambient-pad' });
    expect(audio.getBackgroundAudioState().status).toBe('error');
    expect(elements[0].paused).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('never plays at full volume when a mobile gain node fails', async () => {
    vi.stubGlobal('AudioContext', class {
      state = 'running';
      currentTime = 0;
      destination = {};
      createMediaElementSource = () => ({ connect: vi.fn() });
      createGain = () => ({
        gain: { value: 0, cancelScheduledValues: vi.fn(), setValueAtTime: () => { throw new Error('gain failed'); } },
        connect: vi.fn(),
      });
    });
    vi.stubGlobal('Audio', class extends MockAudio {
      get volume() { return 1; }
      set volume(value) { void value; }
    });
    await expect(startPrayer()).resolves.toEqual({ started: false, trackId: 'ambient-pad' });
    expect(elements[0].play).not.toHaveBeenCalled();
    expect(audio.getBackgroundAudioState().status).toBe('error');
  });

});


