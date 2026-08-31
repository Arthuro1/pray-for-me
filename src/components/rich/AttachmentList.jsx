// Rich attachment rendering shared by posted updates/testimonies and the
// composer preview. Stored media is downloaded + decrypted lazily; media that
// has just been selected uses a local object URL so it can be checked before it
// is sent.
import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Film, ImageOff, Loader2, Music, Pause, Play, X } from 'lucide-react';
import { useAttachmentUrl } from '../../hooks/useAttachmentUrl';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { t } from '../../i18n';

const itemWidthClass = 'w-full max-w-md';

function MediaFrame({ loading, error, lang, children, className = '' }) {
  if (error) {
    return (
      <div className={`attachment-load-state ${itemWidthClass} ${className}`}>
        <ImageOff size={16} aria-hidden="true" />
        <span>{t(lang, 'mediaLoadError')}</span>
      </div>
    );
  }
  if (loading) {
    return (
      <div className={`attachment-load-state attachment-load-state--loading ${itemWidthClass} ${className}`} aria-label={t(lang, 'mediaLoading')}>
        <Loader2 size={17} className="animate-spin" aria-hidden="true" />
      </div>
    );
  }
  return children;
}

function ImageAttachment({ att, url, loading, error, lang }) {
  const [open, setOpen] = useState(false);
  useEscapeKey(open ? () => setOpen(false) : null);
  return (
    <MediaFrame loading={loading} error={error} lang={lang}>
      <button type="button" onClick={() => setOpen(true)} className="attachment-image" aria-label={att.name || t(lang, 'attachPhoto')}>
        <img src={url} alt={att.name || ''} loading="lazy" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button type="button" onClick={() => setOpen(false)} aria-label={t(lang, 'close')} className="absolute top-4 end-4 w-11 h-11 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            <X size={18} aria-hidden="true" />
          </button>
          <img src={url} alt={att.name || ''} className="max-h-full max-w-full rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </MediaFrame>
  );
}

function finiteDuration(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function formatTime(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function isVoiceNote(att) {
  return /(?:voice|prayer)[-_ ]?note/i.test(att.name || '');
}

function AudioAttachment({ att, url, loading, error, lang }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setElapsed(0);
    setDuration(0);
    setPlaybackError(false);
  }, [url]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      await audio.play();
    } catch {
      setPlaybackError(true);
    }
  };

  const seek = (event) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Number(event.target.value);
    audio.currentTime = next;
    setElapsed(next);
  };

  const voiceNote = isVoiceNote(att);
  const label = voiceNote ? t(lang, 'voiceNoteLabel') : t(lang, 'attachAudio');
  const safeDuration = finiteDuration(duration);

  return (
    <MediaFrame loading={loading} error={error || playbackError} lang={lang}>
      <div className={`attachment-audio ${itemWidthClass}`}>
        <button
          type="button"
          onClick={togglePlayback}
          className="attachment-audio__play"
          aria-label={t(lang, playing ? 'mediaPause' : 'mediaPlay')}
          title={t(lang, playing ? 'mediaPause' : 'mediaPlay')}
        >
          {playing ? <Pause size={18} fill="currentColor" aria-hidden="true" /> : <Play size={18} fill="currentColor" aria-hidden="true" />}
        </button>
        <div className="attachment-audio__body">
          <div className="attachment-audio__heading">
            <Music size={14} aria-hidden="true" />
            <span>{label}</span>
            {!voiceNote && att.name && <span className="attachment-audio__name">· {att.name}</span>}
          </div>
          <div className="attachment-audio__timeline">
            <span>{formatTime(elapsed)}</span>
            <input
              type="range"
              min="0"
              max={safeDuration || 0}
              step="0.1"
              value={Math.min(elapsed, safeDuration || 0)}
              onChange={seek}
              disabled={!safeDuration}
              aria-label={t(lang, 'mediaSeek')}
            />
            <span>{safeDuration ? formatTime(safeDuration) : '--:--'}</span>
          </div>
        </div>
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime || 0)}
          onLoadedMetadata={(event) => setDuration(finiteDuration(event.currentTarget.duration))}
          onDurationChange={(event) => setDuration(finiteDuration(event.currentTarget.duration))}
          onError={() => setPlaybackError(true)}
        />
      </div>
    </MediaFrame>
  );
}

function VideoAttachment({ att, url, loading, error, lang }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setPlaybackError(false);
  }, [url]);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    setPlaybackError(false);
    try {
      // Keep playback directly inside the visible click gesture. Mobile
      // WebViews do not always honour the native control's first tap when a
      // freshly decrypted Blob URL has only just become ready.
      await video.play();
    } catch {
      setPlaybackError(true);
    }
  };

  return (
    <MediaFrame loading={loading} error={error} lang={lang} className="attachment-load-state--video">
      <div className={`attachment-video ${itemWidthClass}`}>
        <div className="attachment-video__heading">
          <Film size={14} aria-hidden="true" />
          <span>{t(lang, 'attachVideo')}</span>
          {att.name && <span>· {att.name}</span>}
        </div>
        <div className="attachment-video__stage">
          <video
            ref={videoRef}
            controls
            playsInline
            src={url}
            preload="auto"
            aria-label={att.name || t(lang, 'attachVideo')}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setPlaybackError(true)}
          />
          {!playing && !playbackError && (
            <button
              type="button"
              onClick={togglePlayback}
              className="attachment-video__play"
              aria-label={t(lang, 'mediaPlay')}
              title={t(lang, 'mediaPlay')}
            >
              <Play size={22} fill="currentColor" aria-hidden="true" />
            </button>
          )}
          {playbackError && (
            <div className="attachment-video__error" role="status">
              <ImageOff size={18} aria-hidden="true" />
              <span>{t(lang, 'mediaLoadError')}</span>
              <button type="button" onClick={togglePlayback}>{t(lang, 'mediaPlay')}</button>
            </div>
          )}
        </div>
      </div>
    </MediaFrame>
  );
}

function safeLink(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

function LinkAttachment({ att, lang }) {
  const parsed = safeLink(att.url);
  if (!parsed) {
    return (
      <div className={`attachment-load-state ${itemWidthClass}`}>
        <ImageOff size={16} aria-hidden="true" />
        <span>{t(lang, 'linkInvalid')}</span>
      </div>
    );
  }
  const host = parsed.hostname.replace(/^www\./, '');
  const detail = `${parsed.pathname === '/' ? '' : parsed.pathname}${parsed.search}` || parsed.href;
  return (
    <a
      href={parsed.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`attachment-link ${itemWidthClass}`}
      aria-label={`${t(lang, 'openLink')}: ${host}`}
    >
      <span className="attachment-link__icon"><ExternalLink size={16} aria-hidden="true" /></span>
      <span className="attachment-link__copy">
        <strong>{host}</strong>
        <span>{detail}</span>
      </span>
      <ExternalLink size={14} className="attachment-link__arrow" aria-hidden="true" />
    </a>
  );
}

const MEDIA_RENDERERS = { image: ImageAttachment, audio: AudioAttachment, video: VideoAttachment };

// Public so the composer can render local media without downloading the copy it
// has just uploaded. Link previews never need a media URL.
export function AttachmentPreview({ att, url = null, loading = false, error = false, lang }) {
  if (!att) return null;
  if (att.type === 'link') return <LinkAttachment att={att} lang={lang} />;
  const Renderer = MEDIA_RENDERERS[att.type];
  if (!Renderer) return null;
  return <Renderer att={att} url={url} loading={loading || !url} error={error} lang={lang} />;
}

function StoredMediaAttachment({ att, lang }) {
  const { url, error } = useAttachmentUrl(att);
  return <AttachmentPreview att={att} url={url} loading={!url && !error} error={error} lang={lang} />;
}

function RemoveAttachmentButton({ onClick, lang }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t(lang, 'attachRemove')}
      title={t(lang, 'attachRemove')}
      className="attachment-list__remove"
    >
      <X size={14} aria-hidden="true" />
    </button>
  );
}

const supported = (att) => att && (att.type === 'link' || MEDIA_RENDERERS[att.type]);

export function PendingAttachmentList({ entries, lang, onRemove }) {
  const items = (entries || []).filter((entry) => entry && (entry.type || entry.meta?.type));
  if (items.length === 0) return null;

  return (
    <div className="attachment-list attachment-list--pending">
      {items.map((entry) => {
        const att = entry.meta || { id: entry.id, type: entry.type, name: entry.name };
        if (!supported(att)) return null;
        return (
          <div key={entry.id} className={`attachment-list__item attachment-list__item--${att.type} attachment-list__item--removable`}>
            {att.type === 'link'
              ? <AttachmentPreview att={att} lang={lang} />
              : <AttachmentPreview att={att} url={entry.previewUrl} loading={!entry.previewUrl} lang={lang} />}
            {entry.status === 'uploading' ? (
              <span className="attachment-list__status" aria-label={t(lang, 'mediaUploading')} title={t(lang, 'mediaUploading')}>
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              </span>
            ) : (
              <RemoveAttachmentButton onClick={() => onRemove(entry)} lang={lang} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AttachmentList({ attachments, lang, className = '', onRemove = null }) {
  const items = (attachments || []).filter(supported);
  if (items.length === 0) return null;

  return (
    <div className={`attachment-list ${className}`}>
      {items.map((att) => (
        <div key={att.id} className={`attachment-list__item attachment-list__item--${att.type}${onRemove ? ' attachment-list__item--removable' : ''}`}>
          {att.type === 'link'
            ? <AttachmentPreview att={att} lang={lang} />
            : <StoredMediaAttachment att={att} lang={lang} />}
          {onRemove && <RemoveAttachmentButton onClick={() => onRemove(att)} lang={lang} />}
        </div>
      ))}
    </div>
  );
}
