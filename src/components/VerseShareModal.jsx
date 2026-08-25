import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, Loader2, Share2, X } from 'lucide-react';
import ShareButtons from './shared/ShareButtons';
import { SegmentedControl } from './shared/Primitives';
import { toast } from '../store/toastStore';
import { t } from '../i18n';
import { track, EVENTS } from '../lib/analytics';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { versionForSource } from '../lib/bibleVersions';
import { renderVerseCard } from '../lib/verseCard';

// Sharing the verse of the day. The card image is the point: a verse that leaves
// the app lands in someone else's chat, where the picture carries the words and
// the reference on its own instead of relying on a link nobody opens.
//
// Every action degrades rather than fails. If canvas isn't available the image
// block disappears and the text actions carry on; if the native sheet can't take
// a file we save the PNG instead; if the clipboard is blocked we say so.
export default function VerseShareModal({ verse, lang, dayKey, onClose }) {
  const [size, setSize] = useState('square');
  const [image, setImage] = useState(null);
  const [rendering, setRendering] = useState(true);

  useEscapeKey(onClose);
  const trapRef = useFocusTrap(true);

  // Cite the edition alongside the reference when we know it (never for the
  // unlabelled embedded SEED wording), so a shared verse can be verified.
  const { cardReference, shareText } = useMemo(() => {
    const version = verse.source ? versionForSource(verse.source, lang) : null;
    return {
      cardReference: version ? `${verse.ref} · ${version.abbr}` : verse.ref,
      shareText: verse.text
        ? `“${verse.text}” — ${version ? `${verse.ref} (${version.abbr})` : verse.ref}`
        : verse.ref,
    };
  }, [verse.ref, verse.text, verse.source, lang]);

  const label = t(lang, 'verseOfDay');
  const invite = t(lang, 'verseReadInBible');
  const fileName = `pray4me-verse-${dayKey}.png`;
  const linkUrl = typeof window === 'undefined' ? '' : window.location.origin;

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    setRendering(true);
    renderVerseCard({ label, verse: verse.text, reference: cardReference, invite, lang, size, seed: dayKey })
      .then((blob) => {
        if (cancelled) return;
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setImage({ url: objectUrl, blob });
        } else {
          setImage(null);
        }
        setRendering(false);
      })
      .catch(() => {
        if (cancelled) return;
        setImage(null);
        setRendering(false);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [label, invite, verse.text, cardReference, lang, size, dayKey]);

  const saveImage = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image.url;
    link.download = fileName;
    link.click();
    toast.success(t(lang, 'verseImageSaved'));
    track(EVENTS.VERSE_SHARED, { channel: 'image' });
  };

  const shareImage = async () => {
    if (!image) return;
    const file = new File([image.blob], fileName, { type: 'image/png' });
    if (!navigator.canShare?.({ files: [file] })) {
      saveImage();
      return;
    }
    try {
      await navigator.share({ files: [file], text: shareText });
      track(EVENTS.VERSE_SHARED, { channel: 'image' });
    } catch {
      // the user dismissed the sheet, or the target refused the file — nothing to say
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${linkUrl}`);
      toast.success(t(lang, 'verseCopied'));
      track(EVENTS.VERSE_SHARED, { channel: 'text' });
    } catch {
      toast.error(t(lang, 'errorGeneric'));
    }
  };

  const canUseNativeSheet = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t(lang, 'shareVerse')}
        className="w-full max-w-sm rounded-2xl p-5"
        style={{ background: 'var(--surface)', border: '0.5px solid var(--border)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>{t(lang, 'shareVerse')}</h3>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>{verse.ref}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(lang, 'close')}
            className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ color: 'var(--text-3)' }}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        {(image || rendering) && (
          <>
            <SegmentedControl
              className="mb-3"
              label={t(lang, 'shareVerse')}
              value={size}
              onChange={setSize}
              options={[
                { value: 'square', label: t(lang, 'verseCardSquare') },
                { value: 'story', label: t(lang, 'verseCardStory') },
              ]}
            />
            <div
              className="mb-4 flex items-center justify-center overflow-hidden rounded-xl"
              style={{
                background: 'var(--surface-2)',
                border: '0.5px solid var(--border)',
                aspectRatio: size === 'story' ? '9 / 16' : '1 / 1',
                maxHeight: '15rem',
              }}
            >
              {image
                ? <img src={image.url} alt={`${label} — ${verse.ref}`} className="h-full w-full object-contain" />
                : <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-3)' }} aria-hidden="true" />}
            </div>
          </>
        )}

        <div className="mb-4 flex flex-col gap-2">
          {image && (
            <button
              type="button"
              onClick={canUseNativeSheet ? shareImage : saveImage}
              className="pressable flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'var(--accent)' }}
            >
              {canUseNativeSheet
                ? <><Share2 size={16} aria-hidden="true" /> {t(lang, 'verseShareImage')}</>
                : <><Download size={16} aria-hidden="true" /> {t(lang, 'verseSaveImage')}</>}
            </button>
          )}
          <div className="flex gap-2">
            {image && canUseNativeSheet && (
              <button
                type="button"
                onClick={saveImage}
                className="pressable flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
              >
                <Download size={15} aria-hidden="true" /> {t(lang, 'verseSaveImage')}
              </button>
            )}
            <button
              type="button"
              onClick={copyText}
              className="pressable flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }}
            >
              <Copy size={15} aria-hidden="true" /> {t(lang, 'verseCopyText')}
            </button>
          </div>
        </div>

        {/* The web targets can't carry the PNG, so they pass on the verse as text
            plus the link — the same message the clipboard action copies. */}
        <p className="mb-2 text-center text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'verseShareTextLabel')}</p>
        <ShareButtons
          url={linkUrl}
          text={shareText}
          copiedLabel={t(lang, 'verseCopied')}
          onShared={() => track(EVENTS.VERSE_SHARED, { channel: 'text' })}
        />
      </div>
    </div>
  );
}
