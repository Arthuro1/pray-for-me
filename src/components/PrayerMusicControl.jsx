import { useEffect, useState } from 'react';
import { Check, ChevronDown, Music, VolumeX } from 'lucide-react';
import { t } from '../i18n';
import {
  AUDIO_TRACKS,
  DEFAULT_AUDIO_TRACK_ID,
  resolveTrack,
  startBackgroundInstrumental,
  stopBackgroundAudio,
} from '../lib/audio/backgroundAudio';

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
  const track = resolveTrack(trackId) || resolveTrack('silence');

  useEffect(() => {
    if (!active || trackId === 'silence') {
      void stopBackgroundAudio({ fade: !active });
      return;
    }
    void startBackgroundInstrumental({ trackId, volume: 0.16 });
  }, [active, trackId]);

  useEffect(() => () => {
    void stopBackgroundAudio();
  }, []);

  const selectTrack = (nextTrackId) => {
    localStorage.setItem(AUDIO_STORAGE_KEY, nextTrackId);
    setOpen(false);

    if (nextTrackId === trackId) {
      if (nextTrackId === 'silence') void stopBackgroundAudio();
      else void startBackgroundInstrumental({ trackId: nextTrackId, volume: 0.16 });
      return;
    }
    setTrackId(nextTrackId);
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`${t(lang, 'prayerMusic')}: ${t(lang, track.labelKey)}`}
        title={t(lang, 'prayerMusic')}
        className="pressable flex min-h-11 max-w-[8.5rem] items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold sm:max-w-none sm:px-3"
        style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,.82)', border: '1px solid rgba(255,255,255,.1)' }}
      >
        {trackId === 'silence' ? <VolumeX size={13} /> : <Music size={13} />}
        <span className="min-w-0 truncate">{t(lang, track.labelKey)}</span>
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div
          className="fixed left-5 right-5 top-[calc(4.25rem+env(safe-area-inset-top))] z-30 w-auto rounded-xl p-1.5 shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(26rem,calc(100vw-2.5rem))]"
          style={{ background: 'var(--plum-deep)', border: '1px solid rgba(255,255,255,.14)' }}
          role="radiogroup"
          aria-label={t(lang, 'prayerMusic')}
        >
          <p className="px-3 pb-1.5 pt-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.68)' }}>
            {t(lang, 'prayerMusicSub')}
          </p>
          <div className="grid gap-1 sm:grid-cols-2">
            {AUDIO_TRACKS.map((option) => {
              const selected = option.id === trackId;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectTrack(option.id)}
                  className="pressable flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left"
                  style={selected ? { background: 'rgba(255,255,255,0.12)' } : {}}
                >
                  {option.id === 'silence' ? <VolumeX size={13} /> : <Music size={13} />}
                  <span className="flex-1 text-xs font-semibold text-white">{t(lang, option.labelKey)}</span>
                  {selected && <Check size={12} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
