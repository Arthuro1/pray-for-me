import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, Loader2, Share2, X } from 'lucide-react';
import ShareButtons from './shared/ShareButtons';
import { Modal, PrimaryButton, SecondaryButton, SegmentedControl } from './shared/Primitives';
import { toast } from '../store/toastStore';
import { t } from '../i18n';
import { track, EVENTS } from '../lib/analytics';
import { versionForSource } from '../lib/bibleVersions';
import { renderVerseCard } from '../lib/verseCard';
import { FILE_PREFIX } from '../lib/brand';

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
  const fileName = `${FILE_PREFIX}-verse-${dayKey}.png`;
  const linkUrl = typeof window === 'undefined' ? '' : window.location.origin;

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    setRendering(true);
    renderVerseCard({ label, verse: verse.text, reference: cardReference, invite, lang, size })
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
    <Modal label={t(lang, 'shareVerse')} onClose={onClose} size="sm">
      <div className="q-dialog__header">
        <div className="min-w-0">
          <h2 className="q-dialog__title">{t(lang, 'shareVerse')}</h2>
          <p className="scripture-ref min-h-0 mt-1">{verse.ref}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t(lang, 'close')} className="icon-button pressable -me-2 -mt-2 shrink-0">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {(image || rendering) && (
        <>
          <SegmentedControl
            className="mb-4"
            label={t(lang, 'shareVerse')}
            value={size}
            onChange={setSize}
            options={[
              { value: 'square', label: t(lang, 'verseCardSquare') },
              { value: 'story', label: t(lang, 'verseCardStory') },
            ]}
          />
          <div className={`share-image ${size === 'story' ? 'share-image--story' : ''}`}>
            {image
              ? <img src={image.url} alt={`${label} — ${verse.ref}`} />
              : <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
          </div>
        </>
      )}

      <div className="mt-5 grid gap-2">
        {image && (
          <PrimaryButton icon={canUseNativeSheet ? Share2 : Download} onClick={canUseNativeSheet ? shareImage : saveImage}>
            {t(lang, canUseNativeSheet ? 'verseShareImage' : 'verseSaveImage')}
          </PrimaryButton>
        )}
        <div className="flex gap-2">
          {image && canUseNativeSheet && (
            <SecondaryButton icon={Download} iconSize={16} onClick={saveImage} className="flex-1">{t(lang, 'verseSaveImage')}</SecondaryButton>
          )}
          <SecondaryButton icon={Copy} iconSize={16} onClick={copyText} className="flex-1">{t(lang, 'verseCopyText')}</SecondaryButton>
        </div>
      </div>

      {/* The web targets can't carry the PNG, so they pass on the verse as text
          plus the link — the same message the clipboard action copies. */}
      <p className="q-meta mt-6 text-center">{t(lang, 'verseShareTextLabel')}</p>
      <ShareButtons
        url={linkUrl}
        text={shareText}
        copiedLabel={t(lang, 'verseCopied')}
        onShared={() => track(EVENTS.VERSE_SHARED, { channel: 'text' })}
      />
    </Modal>
  );
}
