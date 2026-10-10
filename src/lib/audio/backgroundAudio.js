import { devWarn } from '../logger';

const FADE_IN_MS = 1400;
// Let the atmosphere settle gently when finishing a prayer or choosing silence.
const FADE_OUT_MS = 1800;

// First-party prayer atmospheres. Changing music never shares prayer data with
// a third party. Silence remains a full session choice.
export const AUDIO_TRACKS = Object.freeze([
  { id: 'soft-piano', src: '/audio/piano-and-rain.mp3', labelKey: 'audioSoftPiano' },
  { id: 'ambient-pad', src: '/audio/ambient-pad.mp3', labelKey: 'audioAmbientPad' },
  { id: 'nature', src: '/audio/nature.mp3', labelKey: 'audioNature' },
  { id: 'soft-pad', src: '/audio/soft-pad.mp3', labelKey: 'audioSoftPad' },
  { id: 'silence', src: null, labelKey: 'audioSilence' },
]);

export const DEFAULT_AUDIO_TRACK_ID = 'silence';

export function resolveTrack(id) {
  return AUDIO_TRACKS.find((track) => track.id === id) || null;
}

export function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

// Prayer playback reuses one lazily created element. iOS ignores
// HTMLMediaElement.volume, so use a Web Audio gain there. The engine leaves
// the saved music preference to the prayer control.
let el = null;
let ctx = null;
let gain = null;
let useGain = false;
let graphReady = false;
let loadedSrc = null;
let playing = false;
let playingTrackId = 'silence';
let fadeTimer = null;
let operationId = 0;
let cancelPendingPlay = null;
let cancelPendingStop = null;
let stopPromise = null;
let snapshot = { owner: null, status: 'idle', playing: false, trackId: 'silence' };
const listeners = new Set();

// A stable snapshot supports useSyncExternalStore without render loops.
export function getBackgroundAudioState() {
  return snapshot;
}

export function subscribeBackgroundAudio(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publishState(owner, status, trackId = snapshot.trackId) {
  snapshot = { owner, status, playing, trackId };
  listeners.forEach((listener) => listener(snapshot));
}

function browserAudioAvailable() {
  // jsdom leaves native playback unimplemented; component tests stay quiet.
  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');
  return typeof Audio === 'function' && !isJsdom;
}

function clearFade() {
  if (fadeTimer !== null) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

function supersedeOperation() {
  operationId += 1;
  cancelPendingPlay?.();
  cancelPendingStop?.();
  stopPromise = null;
  clearFade();
  return operationId;
}

function playbackFailed() {
  if (!snapshot.owner) return;
  const { owner, trackId } = snapshot;
  supersedeOperation();
  playing = false;
  playingTrackId = 'silence';
  publishState(owner, 'error', trackId);
  applyLevel(0);
  try { el?.pause(); } catch { /* best effort */ }
}

function playbackPaused() {
  // Ignore the deliberate pause before a new start or at the end of a fade.
  if (snapshot.status !== 'playing' || el?.paused === false) return;
  supersedeOperation();
  playing = false;
  playingTrackId = 'silence';
  applyLevel(0);
  publishState(null, 'idle', 'silence');
}

function ensureElement() {
  if (el || !browserAudioAvailable()) return el;
  try {
    el = new Audio();
  } catch {
    return null;
  }
  el.loop = true;
  // No network request before the visitor asks to listen.
  el.preload = 'none';
  el.setAttribute('playsinline', '');
  el.addEventListener('error', playbackFailed);
  el.addEventListener('pause', playbackPaused);
  el.addEventListener('ended', playbackPaused);
  return el;
}

function volumeControllable() {
  if (!el) return false;
  try {
    const probe = el.volume;
    el.volume = 0.123;
    const honoured = Math.abs(el.volume - 0.123) < 0.001;
    el.volume = probe;
    return honoured;
  } catch {
    return false;
  }
}

function ensureGraph() {
  if (graphReady || !el) return;
  const Ctx = typeof AudioContext !== 'undefined'
    ? AudioContext
    : (typeof window !== 'undefined' ? window.webkitAudioContext : undefined);
  // If neither volume mechanism is available, fail softly in silence.
  if (!Ctx) return;
  try {
    ctx = new Ctx();
    const source = ctx.createMediaElementSource(el);
    gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(ctx.destination);
    graphReady = true;
  } catch {
    ctx = null;
    gain = null;
    graphReady = false;
  }
}

function applyLevel(level, durationMs = 0) {
  const target = clamp01(level);
  clearFade();
  if (useGain && gain && ctx) {
    try {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(clamp01(gain.gain.value), now);
      if (durationMs > 0) gain.gain.linearRampToValueAtTime(target, now + durationMs / 1000);
      else gain.gain.setValueAtTime(target, now);
      return true;
    } catch {
      // An iOS element ignores volume: never fall through to full-volume audio.
      return false;
    }
  }
  if (!el) return false;
  try {
    if (durationMs <= 0) {
      el.volume = target;
      return true;
    }
    const start = el.volume;
    const steps = Math.max(1, Math.round(durationMs / 50));
    let step = 0;
    fadeTimer = setInterval(() => {
      step += 1;
      try { el.volume = clamp01(start + (target - start) * (step / steps)); } catch { playbackFailed(); }
      if (step >= steps) clearFade();
    }, 50);
    return true;
  } catch { return false; }
}

function safePlay(element) {
  return new Promise((resolve) => {
    let settled = false;
    let timeout = null;
    const cancel = () => done(false);
    const done = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (cancelPendingPlay === cancel) cancelPendingPlay = null;
      resolve(ok);
    };
    cancelPendingPlay = cancel;
    timeout = setTimeout(cancel, 3500);
    try {
      const result = element.play?.();
      if (result && typeof result.then === 'function') {
        result.then(() => done(true), () => done(false));
      } else {
        done(true);
      }
    } catch {
      done(false);
    }
  });
}

async function stopInternal({ fade = false } = {}) {
  const thisOperation = operationId;
  const wasPlaying = playing;
  const previous = snapshot;
  playing = false;
  playingTrackId = 'silence';
  clearFade();
  if (fade && wasPlaying && el) {
    publishState(previous.owner, 'stopping');
    applyLevel(0, FADE_OUT_MS);
    await new Promise((resolve) => {
      const finish = () => {
        if (cancelPendingStop === cancel) cancelPendingStop = null;
        resolve();
      };
      const timer = setTimeout(finish, FADE_OUT_MS);
      const cancel = () => { clearTimeout(timer); finish(); };
      cancelPendingStop = cancel;
    });
    // A new gesture can take over during the fade; its track must keep playing.
    if (thisOperation !== operationId) return;
  }
  applyLevel(0);
  try { el?.pause(); } catch { /* best effort */ }
  publishState(null, 'idle', 'silence');
}

export function stopBackgroundAudio({ fade = false } = {}) {
  if (fade && snapshot.status === 'stopping' && stopPromise) return stopPromise;
  supersedeOperation();
  stopPromise = stopInternal({ fade });
  return stopPromise;
}

// A session can resume its saved choice; explicit selection also calls this
// synchronously in the gesture to unlock audio on iOS.
export function startBackgroundInstrumental({
  trackId = DEFAULT_AUDIO_TRACK_ID,
  volume = 0.16,
} = {}) {
  return startTrack(resolveTrack(trackId), volume);
}

async function startTrack(track, volume) {
  const thisOperation = supersedeOperation();
  if (!track || !track.src) {
    await stopInternal();
    return { started: false, trackId: 'silence' };
  }

  if (!browserAudioAvailable() || !ensureElement()) {
    playing = false;
    playingTrackId = 'silence';
    publishState('prayer', 'error', track.id);
    return { started: false, trackId: track.id };
  }
  // Re-selecting the playing source adjusts its volume without restarting it.
  if (playing && playingTrackId === track.id && loadedSrc === track.src) {
    if (!applyLevel(volume)) {
      playbackFailed();
      return { started: false, trackId: track.id };
    }
    publishState('prayer', 'playing', track.id);
    return { started: true, trackId: track.id };
  }

  playing = false;
  playingTrackId = 'silence';
  publishState('prayer', 'starting', track.id);
  try { el.pause(); } catch { /* cancel any previous pending play */ }
  if (!useGain && !graphReady && !volumeControllable()) {
    useGain = true;
    ensureGraph();
  }
  if (useGain && !graphReady) {
    playbackFailed();
    return { started: false, trackId: track.id };
  }
  if (useGain) {
    try { el.volume = 1; } catch { /* gain controls the effective volume */ }
  }
  if (!applyLevel(0)) {
    playbackFailed();
    return { started: false, trackId: track.id };
  }
  if (loadedSrc !== track.src) {
    el.src = track.src;
    loadedSrc = track.src;
  }
  try { el.currentTime = 0; } catch { /* not seekable until loaded */ }

  // Keep play() and context.resume() inside the originating user gesture.
  const playPromise = safePlay(el);
  if (useGain && ctx?.state === 'suspended') {
    try {
      Promise.resolve(ctx.resume()).catch(() => {
        if (thisOperation === operationId) playbackFailed();
      });
    } catch { playbackFailed(); }
  }
  const started = await playPromise;
  if (thisOperation !== operationId) return { started: false, trackId: track.id };
  if (!started) {
    devWarn('backgroundAudio: playback unavailable', track.id);
    playbackFailed();
    return { started: false, trackId: track.id };
  }
  playing = true;
  playingTrackId = track.id;
  if (!applyLevel(volume, FADE_IN_MS)) {
    playbackFailed();
    return { started: false, trackId: track.id };
  }
  publishState('prayer', 'playing', track.id);
  return { started: true, trackId: track.id };
}

export function isBackgroundPlaying() {
  return playing;
}

export function currentBackgroundTrack() {
  return playingTrackId;
}
