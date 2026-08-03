import { devWarn } from '../logger';

const FADE_IN_MS = 1400;
const FADE_OUT_MS = 900;

// First-party, instrumental-only prayer atmospheres. They are served from the
// app's own origin, so changing music never shares prayer data with a third
// party. Silence remains a full session choice.
export const AUDIO_TRACKS = Object.freeze([
  { id: 'soft-piano', src: '/audio/piano-and-rain.mp3', labelKey: 'audioSoftPiano' },
  { id: 'ambient-pad', src: '/audio/ambient-pad.mp3', labelKey: 'audioAmbientPad' },
  { id: 'nature', src: '/audio/nature.mp3', labelKey: 'audioNature' },
  { id: 'soft-pad', src: '/audio/soft-pad.mp3', labelKey: 'audioSoftPad' },
  { id: 'silence', src: null, labelKey: 'audioSilence' },
]);

// Prayer sessions begin quietly. A visitor can opt into music, and that choice
// is remembered for later sessions, but we never start audio before consent.
export const DEFAULT_AUDIO_TRACK_ID = 'silence';

export function resolveTrack(id) {
  return AUDIO_TRACKS.find((track) => track.id === id) || null;
}

export function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

// ── iOS-safe playback engine ────────────────────────────────────────────────
// iOS Safari has two habits that quietly break a naive <audio> element:
//   1. HTMLMediaElement.volume is read-only there — reading it always returns
//      1.0 and writing is a no-op — so a "gentle 16%" atmosphere would blare at
//      full volume (or the fade-in from 0 would never rise).
//   2. Programmatic play() is refused unless it happens inside a user gesture.
// So we keep ONE reused element (created lazily), feature-detect whether the
// element's own volume is honoured, and only on the phones where it is NOT
// (iOS) route the element through a Web Audio GainNode — the single volume
// control iOS respects. Playback is always kicked from the tap that selects a
// track (see PrayerMusicControl), and the whole engine stays failure-soft: a
// missing asset or an autoplay block yields silence and leaves prayer usable.

let el = null; // the single reused HTMLAudioElement
let ctx = null; // AudioContext, created only when the gain path is needed
let gain = null; // GainNode — the iOS-honoured volume control
let useGain = false; // true once we've detected element.volume is ignored (iOS)
let graphReady = false; // MediaElementSource can be created only once per element
let loadedSrc = null; // which track src is currently attached to `el`
let playing = false;
let playingTrackId = 'silence';
let fadeTimer = null;
let operationId = 0;

function browserAudioAvailable() {
  // jsdom deliberately leaves HTMLMediaElement.play() unimplemented; treat it
  // like any other audio-less environment so component tests stay quiet.
  const isJsdom = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');
  return typeof Audio === 'function' && !isJsdom;
}

function ensureElement() {
  if (el || !browserAudioAvailable()) return el;
  try {
    el = new Audio();
  } catch {
    el = null;
    return null;
  }
  el.loop = true;
  el.preload = 'auto';
  // Harmless for audio, and keeps iOS from ever promoting it to fullscreen.
  el.setAttribute('playsinline', '');
  return el;
}

// True when writing element.volume actually changes it. iOS reports 1.0 no
// matter what — that tells us to fall back to the Web Audio gain path.
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

// Build element → gain → destination once. Only reached on engines where the
// element's own volume is ignored, so we never touch Web Audio on desktop.
function ensureGraph() {
  if (graphReady || !el) return;
  const Ctx = typeof AudioContext !== 'undefined'
    ? AudioContext
    : (typeof window !== 'undefined' ? window.webkitAudioContext : undefined);
  if (!Ctx) return; // no Web Audio → nothing better than full-volume playback
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

function clearFade() {
  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

// Set the effective level, optionally ramped over durationMs. Uses the Web
// Audio gain when it is the active control (iOS); otherwise element.volume.
function applyLevel(level, durationMs = 0) {
  const target = clamp01(level);

  if (useGain && gain && ctx) {
    try {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(clamp01(gain.gain.value) || 0, now);
      if (durationMs > 0) gain.gain.linearRampToValueAtTime(target, now + durationMs / 1000);
      else gain.gain.setValueAtTime(target, now);
      return;
    } catch {
      // fall through to the element path
    }
  }

  clearFade();
  if (!el) return;
  if (durationMs <= 0) {
    el.volume = target;
    return;
  }
  const start = el.volume;
  const steps = Math.max(1, Math.round(durationMs / 50));
  let step = 0;
  fadeTimer = setInterval(() => {
    step += 1;
    el.volume = clamp01(start + (target - start) * (step / steps));
    if (step >= steps) clearFade();
  }, 50);
}

function safePlay(element) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok) => { if (!settled) { settled = true; resolve(ok); } };
    try {
      const result = element.play?.();
      if (result && typeof result.then === 'function') {
        result.then(() => done(true), () => done(false));
      } else {
        done(true); // no promise (older engines) — assume it started
      }
    } catch {
      done(false);
    }
    // A play() that never fires 'playing' or rejects (rare) must not hang.
    setTimeout(() => done(false), 3500);
  });
}

async function stopInternal({ fade = false } = {}) {
  const wasPlaying = playing;
  playing = false;
  playingTrackId = 'silence';
  clearFade();
  if (!el) return;
  if (fade && wasPlaying) {
    applyLevel(0, FADE_OUT_MS);
    await new Promise((resolve) => setTimeout(resolve, FADE_OUT_MS));
  } else {
    applyLevel(0);
  }
  try { el.pause(); } catch { /* best effort */ }
}

export async function stopBackgroundAudio({ fade = false } = {}) {
  operationId += 1;
  await stopInternal({ fade });
}

// Starts or changes the session atmosphere. MUST be called from the user
// gesture that selects a track so iOS unlocks the element and lets us resume
// the audio graph.
export async function startBackgroundInstrumental({
  trackId = DEFAULT_AUDIO_TRACK_ID,
  volume = 0.16,
} = {}) {
  const thisOperation = ++operationId;

  const track = resolveTrack(trackId);
  if (!track || !track.src) {
    await stopInternal();
    return { started: false, trackId: 'silence' };
  }
  if (!browserAudioAvailable() || !ensureElement()) {
    return { started: false, trackId: track.id };
  }

  // The mount effect (or a stray re-select) can ask for the track that is
  // already playing — keep it running and just settle its level.
  if (playing && playingTrackId === track.id) {
    applyLevel(clamp01(volume), 0);
    return { started: true, trackId: track.id };
  }

  // Decide the volume mechanism once, then wire the gain graph only if needed.
  if (!useGain && !graphReady && !volumeControllable()) {
    useGain = true;
    ensureGraph();
  }

  clearFade();
  if (useGain) el.volume = 1; // the gain node owns the level from here on
  applyLevel(0, 0); // begin silent so the fade-in has somewhere to rise from

  if (loadedSrc !== track.src) {
    el.src = track.src;
    loadedSrc = track.src;
  }
  try { el.currentTime = 0; } catch { /* not seekable until loaded */ }

  // Kick playback synchronously (unlocks the element on iOS) before awaiting,
  // and resume the graph inside the same gesture — a suspended context is silent.
  const playPromise = safePlay(el);
  if (useGain && ctx?.state === 'suspended') {
    try { ctx.resume(); } catch { /* best effort */ }
  }

  const started = await playPromise;
  if (thisOperation !== operationId) {
    // A newer selection or a stop superseded us mid-load.
    return { started: false, trackId: track.id };
  }
  if (!started) {
    devWarn('backgroundAudio: playback unavailable', track.id);
    playing = false;
    try { el.pause(); } catch { /* best effort */ }
    return { started: false, trackId: track.id };
  }

  playing = true;
  playingTrackId = track.id;
  applyLevel(clamp01(volume), FADE_IN_MS);
  return { started: true, trackId: track.id };
}

export function isBackgroundPlaying() {
  return playing;
}

export function currentBackgroundTrack() {
  return playingTrackId;
}
