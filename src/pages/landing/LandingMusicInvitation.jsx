import { useId, useState } from 'react';
import { ExternalLink, Play, X } from 'lucide-react';
import { SecondaryButton } from '../../components/shared/Primitives';

// Public recording metadata, verified against YouTube's oEmbed endpoint.
// Keep only the video ids: radio and playlist parameters are not part of this
// invitation. A single visible player keeps the two choices from overlapping.
export const LANDING_RECORDINGS = Object.freeze([
  { id: 'Z5YubX-PfNQ', creator: 'Chords of Light Music' },
  { id: 't3R9KRZlWGA', creator: 'Adi Eze of Africa' },
]);

export default function LandingMusicInvitation({ copy, lang, music, onBeginPrayer }) {
  const labels = copy.music;
  const id = useId();
  const [videoId, setVideoId] = useState(LANDING_RECORDINGS[0].id);
  const recording = LANDING_RECORDINGS.find((item) => item.id === videoId);
  const watchLabel = labels.play.replace('{title}', labels.title);
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const changeRecording = (event) => {
    const nextVideoId = event.target.value;
    music.close();
    setVideoId(nextVideoId);
  };

  return (
    <section className="landing-music" aria-labelledby={`${id}-heading`}>
      <div className="landing-music__copy">
        <h2 id={`${id}-heading`} className="landing-music__heading">{labels.heading}</h2>
        <p className="landing-music__invitation">{labels.invitation}</p>
        <p className="landing-music__caption">{labels.caption}</p>
        <SecondaryButton onClick={() => onBeginPrayer()}>{copy.beginLabel}</SecondaryButton>
      </div>

      <div className="landing-music__video">
        <h3 className="landing-music__title"><bdi lang="en" dir="ltr">{labels.title}</bdi></h3>
        <div className="landing-music__recording">
          <label htmlFor={`${id}-recording`}>{labels.recording}</label>
          <select id={`${id}-recording`} value={videoId} onChange={changeRecording} dir="ltr">
            {LANDING_RECORDINGS.map((item) => <option key={item.id} value={item.id}>{item.creator}</option>)}
          </select>
        </div>
        <div id={`${id}-player`} className="landing-music__frame">
          {music.open ? (
            <iframe
              key={videoId}
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&controls=1&playsinline=1&hl=${encodeURIComponent(lang)}`}
              title={`${labels.title} · ${recording.creator} · YouTube`}
              allow="encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            // A local CSS preview works offline and in low-data mode, with no
            // thumbnail, iframe, SDK or other YouTube request before consent.
            <div className="landing-music__preview" aria-hidden="true">
              <Play size={30} strokeWidth={1.5} />
              <span lang="en" dir="ltr">{labels.title}</span>
              <small dir="ltr">{recording.creator}</small>
            </div>
          )}
        </div>
        <p id={`${id}-privacy`} className="landing-music__privacy">{labels.privacy}</p>
        <div className="landing-music__actions">
          {/* Keep the same button mounted so keyboard focus stays on the
              visitor's action as the player is opened and closed. */}
          <SecondaryButton onClick={music.toggle} aria-expanded={music.open} aria-controls={`${id}-player`} aria-describedby={`${id}-privacy`}>
            {music.open ? <X size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            <span>{music.open ? labels.close : watchLabel}</span>
          </SecondaryButton>
          <a className="landing-music__external" href={watchUrl} target="_blank" rel="noopener noreferrer" onClick={music.close}>
            {labels.external}<ExternalLink size={14} aria-hidden="true" />
            <span className="sr-only"> · {labels.externalNotice}</span>
          </a>
        </div>
        <p className="landing-music__fallback">{labels.fallback}</p>
      </div>
    </section>
  );
}
