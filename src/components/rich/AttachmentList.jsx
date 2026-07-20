// Renders an update/testimony's attachments in the timeline: image thumbnails
// with a tap-to-open lightbox, inline audio/video players, and link cards.
// Media is downloaded + decrypted lazily per attachment (useAttachmentUrl), so
// opening a prayer never blocks on its media. When the caller passes onRemove
// (author-only), each attachment gets a delete badge behind a confirmation.
import { useState } from 'react';
import { ExternalLink, ImageOff, Loader2, X } from 'lucide-react';
import { useAttachmentUrl } from '../../hooks/useAttachmentUrl';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import ConfirmDialog from '../shared/ConfirmDialog';
import { t } from '../../i18n';

function MediaFrame({ loading, error, lang, children }) {
  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs italic" style={{ background: 'var(--input-bg)', color: 'var(--text-3)', border: '0.5px solid var(--input-border)' }}>
        <ImageOff size={13} aria-hidden="true" /> {t(lang, 'mediaLoadError')}
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl h-20 w-28" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
        <Loader2 size={15} className="animate-spin" style={{ color: 'var(--text-3)' }} />
      </div>
    );
  }
  return children;
}

function ImageAttachment({ att, lang }) {
  const { url, error } = useAttachmentUrl(att);
  const [open, setOpen] = useState(false);
  useEscapeKey(open ? () => setOpen(false) : null);
  return (
    <MediaFrame loading={!url} error={error} lang={lang}>
      <button onClick={() => setOpen(true)} className="block" aria-label={att.name || 'photo'}>
        <img src={url} alt={att.name || ''} loading="lazy" className="rounded-xl max-h-48 max-w-full object-cover" style={{ border: '0.5px solid var(--border)' }} />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button onClick={() => setOpen(false)} aria-label={t(lang, 'close')} className="absolute top-4 end-4 w-11 h-11 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
            <X size={18} aria-hidden="true" />
          </button>
          <img src={url} alt={att.name || ''} className="max-h-full max-w-full rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </MediaFrame>
  );
}

function AudioAttachment({ att, lang }) {
  const { url, error } = useAttachmentUrl(att);
  return (
    <MediaFrame loading={!url} error={error} lang={lang}>
      <audio controls src={url} preload="metadata" className="w-full max-w-xs h-10" />
    </MediaFrame>
  );
}

function VideoAttachment({ att, lang }) {
  const { url, error } = useAttachmentUrl(att);
  return (
    <MediaFrame loading={!url} error={error} lang={lang}>
      <video controls src={url} preload="metadata" className="rounded-xl max-h-64 max-w-full" style={{ border: '0.5px solid var(--border)' }} />
    </MediaFrame>
  );
}

function LinkAttachment({ att }) {
  let host = att.url;
  try { host = new URL(att.url).hostname.replace(/^www\./, ''); } catch { /* show raw */ }
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 max-w-full rounded-xl px-3 py-2 text-xs font-medium"
      style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '0.5px solid var(--accent-border)' }}
    >
      <ExternalLink size={12} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{host}</span>
    </a>
  );
}

const RENDERERS = { image: ImageAttachment, audio: AudioAttachment, video: VideoAttachment, link: LinkAttachment };

export default function AttachmentList({ attachments, lang, className = '', onRemove = null }) {
  const [confirmAtt, setConfirmAtt] = useState(null);
  const [removing, setRemoving] = useState(false);
  const items = (attachments || []).filter((a) => a && RENDERERS[a.type]);
  if (items.length === 0) return null;

  const confirmRemove = async () => {
    setRemoving(true);
    try {
      await onRemove(confirmAtt);
    } finally {
      setRemoving(false);
      setConfirmAtt(null);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {confirmAtt && (
        <ConfirmDialog
          title={t(lang, 'attachRemove')}
          message={t(lang, 'deleteWarning')}
          confirmLabel={t(lang, 'delete')}
          cancelLabel={t(lang, 'cancel')}
          loading={removing}
          onConfirm={confirmRemove}
          onCancel={() => setConfirmAtt(null)}
        />
      )}
      {items.map((att) => {
        const Renderer = RENDERERS[att.type];
        if (!onRemove) return <Renderer key={att.id} att={att} lang={lang} />;
        return (
          <div key={att.id} className="relative max-w-full">
            <Renderer att={att} lang={lang} />
            <button
              type="button"
              onClick={() => setConfirmAtt(att)}
              aria-label={t(lang, 'attachRemove')}
              title={t(lang, 'attachRemove')}
              className="absolute -top-1.5 -end-1.5 w-6 h-6 flex items-center justify-center rounded-full shadow-sm"
              style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '0.5px solid var(--border)' }}
            >
              <X size={12} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
