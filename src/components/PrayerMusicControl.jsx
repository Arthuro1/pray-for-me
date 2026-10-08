import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Music, VolumeX } from 'lucide-react';
import { t } from '../i18n';
import {
  AUDIO_TRACKS,
  DEFAULT_AUDIO_TRACK_ID,
  resolveTrack,
  startBackgroundInstrumental,
  stopBackgroundAudio,
} from '../lib/audio/backgroundAudio';
import './PrayerMusicControl.css';

const AUDIO_STORAGE_KEY = 'pfm_prayer_audio_track';

function initialAudioTrack() {
  const saved = localStorage.getItem(AUDIO_STORAGE_KEY);
  return resolveTrack(saved) ? saved : DEFAULT_AUDIO_TRACK_ID;
}

// Shared by authenticated and guest prayer sessions. Music is entirely
// first-party and device-local: the control stores only a track id, never prayer
// content. A failed autoplay attempt stays failure-soft; choosing the same track
// again retries from that direct user gesture.
export default function PrayerMusicControl({ lang, active = true }) {
  const [trackId, setTrackId] = useState(initialAudioTrack);
  const [open, setOpen] = useState(false);
  const controlRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();
  const track = resolveTrack(trackId) || resolveTrack('silence');

  useEffect(() => {
    if (!open) return undefined;
    const dismissOutside = (event) => {
      if (!controlRef.current?.contains(event.target)) setOpen(false);
    };
    const dismissOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      // Close this disclosure before the surrounding prayer dialog handles Esc.
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('keydown', dismissOnEscape, true);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('keydown', dismissOnEscape, true);
    };
  }, [open]);

  // Auto-resume a remembered atmosphere when a session opens, and fade out when
  // it closes. On iOS a start from here is blocked (no user gesture), which is
  // fine — the tap in selectTrack is what actually unlocks audio there. Desktop
  // and Android honour this resume, so returning users hear their track again.
  useEffect(() => {
    if (!active || trackId === 'silence') {
      void stopBackgroundAudio({ fade: !active });
      return;
    }
    void startBackgroundInstrumental({ trackId, volume: 0.16 });
  }, [active, trackId]);

  // Finishing a prayer with "Amen" swaps in the done screen, which unmounts this
  // control. Fade the atmosphere out on teardown (session finished OR closed) so
  // it settles gently instead of being cut off mid-note. The engine is a module
  // singleton, so the fade keeps running after this component is gone.
  useEffect(() => () => {
    void stopBackgroundAudio({ fade: true });
  }, []);

  const selectTrack = (nextTrackId) => {
    localStorage.setItem(AUDIO_STORAGE_KEY, nextTrackId);
    setOpen(false);
    setTrackId(nextTrackId);
    triggerRef.current?.focus();

    // Also start/stop directly from THIS tap. iOS unlocks the audio element and
    // resumes the Web Audio graph only inside a real user gesture, so the
    // effect above (which runs outside the gesture) is blocked there; this call
    // is what makes the chosen atmosphere actually play on iPhone. The engine
    // is idempotent, so the duplicate call on other platforms is a no-op.
    if (nextTrackId === 'silence') void stopBackgroundAudio({ fade: true });
    else void startBackgroundInstrumental({ trackId: nextTrackId, volume: 0.16 });
  };

  return (
    <div ref={controlRef} className="prayer-music">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`${t(lang, 'prayerMusic')}: ${t(lang, track.labelKey)}`}
        title={t(lang, 'prayerMusic')}
        className="prayer-music__trigger pressable"
      >
        {trackId === 'silence' ? <VolumeX size={14} aria-hidden="true" /> : <Music size={14} aria-hidden="true" />}
        <span className="prayer-music__current">{t(lang, track.labelKey)}</span>
        <ChevronDown size={12} className="prayer-music__chevron" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={menuId}
          className="prayer-music__menu"
          role="group"
          aria-label={t(lang, 'prayerMusic')}
          aria-describedby={`${menuId}-description`}
        >
          <p id={`${menuId}-description`} className="prayer-music__description">
            {t(lang, 'prayerMusicSub')}
          </p>
          <div className="prayer-music__options">
            {AUDIO_TRACKS.map((option) => {
              const selected = option.id === trackId;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectTrack(option.id)}
                  className="prayer-music__option pressable"
                >
                  {option.id === 'silence' ? <VolumeX size={16} aria-hidden="true" /> : <Music size={16} aria-hidden="true" />}
                  <span className="prayer-music__label">{t(lang, option.labelKey)}</span>
                  {selected && <Check size={16} className="prayer-music__check" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
