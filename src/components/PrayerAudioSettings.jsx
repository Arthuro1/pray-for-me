import { Check, Music, Volume2, MessageSquare, Timer } from 'lucide-react';
import { t } from '../i18n';
import { AUDIO_TRACKS } from '../lib/audio/backgroundAudio';

// Pre-session atmosphere settings for Hands-free Prayer Mode. Deliberately shown
// BEFORE the session starts (and never required mid-session) so that, for
// driving, everything is chosen while stopped. Controlled: the parent owns the
// values and persists them, so the choice is remembered next time.
//
// Silence is listed first and is the default — a quiet room with the Lord is
// always a first-class option, never a lesser one.
const TRACK_EMOJI = {
  silence: '🤍',
  'soft-piano': '🎹',
  'ambient-pad': '🌫️',
  nature: '🌧️',
  'soft-pad': '〰️',
};

const PAUSE_OPTIONS = ['short', 'medium', 'long'];

export default function PrayerAudioSettings({
  lang,
  trackId,
  volume,
  voiceEnabled,
  pauseLength,
  speechSupported = true,
  onChangeTrack,
  onChangeVolume,
  onToggleVoice,
  onChangePause,
}) {
  const isSilent = trackId === 'silence';

  return (
    <div className="space-y-6">
      {/* Atmosphere */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
          <Music size={12} /> {t(lang, 'handsFreeAtmosphereTitle')}
        </p>
        <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{t(lang, 'handsFreeAtmosphereSub')}</p>
        <div className="space-y-2">
          {AUDIO_TRACKS.map((track) => {
            const selected = track.id === trackId;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => onChangeTrack(track.id)}
                aria-pressed={selected}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors"
                style={selected
                  ? { background: 'var(--accent-soft)', border: '0.5px solid var(--accent-border)' }
                  : { background: 'var(--surface)', border: '0.5px solid var(--border)' }}
              >
                <span className="text-lg shrink-0" aria-hidden="true">{TRACK_EMOJI[track.id] || '🎵'}</span>
                <span className="flex-1 text-sm font-medium" style={{ color: selected ? 'var(--accent)' : 'var(--text-1)' }}>
                  {t(lang, track.labelKey)}
                </span>
                {selected && <Check size={16} style={{ color: 'var(--accent)' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Music volume — only relevant when an instrumental is chosen */}
      {!isSilent && (
        <div>
          <label htmlFor="hf-volume" className="text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
            <Volume2 size={12} /> {t(lang, 'audioVolume')}
          </label>
          <input
            id="hf-volume"
            type="range"
            min="0.04"
            max="0.5"
            step="0.02"
            value={volume}
            onChange={(e) => onChangeVolume(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: 'var(--accent)' }}
          />
        </div>
      )}

      {/* Spoken guide */}
      <div>
        <button
          type="button"
          onClick={() => speechSupported && onToggleVoice(!voiceEnabled)}
          disabled={!speechSupported}
          aria-pressed={voiceEnabled && speechSupported}
          className="w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left disabled:opacity-60"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
        >
          <span className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-1)' }}>
            <MessageSquare size={15} style={{ color: 'var(--accent)' }} /> {t(lang, 'audioVoice')}
          </span>
          <span
            className="relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors"
            style={{ background: voiceEnabled && speechSupported ? 'var(--accent)' : 'var(--input-border)' }}
          >
            <span
              className="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
              style={{ transform: voiceEnabled && speechSupported ? 'translateX(18px)' : 'translateX(2px)' }}
            />
          </span>
        </button>
        {!speechSupported && (
          <p className="text-xs mt-2 px-1" style={{ color: 'var(--text-3)' }}>{t(lang, 'audioVoiceUnavailable')}</p>
        )}
      </div>

      {/* Silence length */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
          <Timer size={12} /> {t(lang, 'audioPauseLength')}
        </p>
        <div className="flex gap-2">
          {PAUSE_OPTIONS.map((key) => {
            const selected = key === pauseLength;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChangePause(key)}
                aria-pressed={selected}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors"
                style={selected
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-2)' }}
              >
                {t(lang, `pause_${key}`)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
