import { useEffect, useState } from 'react';
import { Download, Loader2, Share2 } from 'lucide-react';
import { SegmentedControl } from '../shared/Primitives';
import { toast } from '../../store/toastStore';
import { t } from '../../i18n';
import { renderPlanCard } from '../../lib/planCard';

// The plan as a picture, for Stories and Status, where a bare link travels
// badly. Square or story frame, then the phone's share sheet (the picture plus
// the link as text) or a plain download. With no 2D canvas the panel says so
// and the link in the sheet carries on alone.
export default function PlanShareImagePanel({ plan, lang, message, url, onShared }) {
  const [size, setSize] = useState('square');
  const [image, setImage] = useState(null);
  const [rendering, setRendering] = useState(true);

  const title = t(lang, plan.titleKey);
  const fileName = `praystead-plan-${plan.id}-${size}.png`;

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    setRendering(true);
    renderPlanCard({
      label: t(lang, 'planShareCardLabel'),
      title,
      meta: t(lang, 'planDays', { n: plan.count }),
      sub: t(lang, plan.subKey),
      count: plan.count,
      lang,
      size,
      seed: plan.id,
    })
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
        if (!cancelled) { setImage(null); setRendering(false); }
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [plan, title, lang, size]);

  const saveImage = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image.url;
    link.download = fileName;
    link.click();
    toast.success(t(lang, 'verseImageSaved'));
    onShared();
  };

  const shareImage = async () => {
    if (!image) return;
    const file = new File([image.blob], fileName, { type: 'image/png' });
    if (!navigator.canShare?.({ files: [file] })) { saveImage(); return; }
    try {
      await navigator.share({ files: [file], text: `${message} ${url}` });
      onShared();
    } catch { /* dismissed, or the target refused the file */ }
  };

  const canUseNativeSheet = typeof navigator !== 'undefined' && !!navigator.share;

  if (!rendering && !image) {
    return <p className="px-5 py-6 text-sm" style={{ color: 'var(--text-3)' }}>{t(lang, 'errorGeneric')}</p>;
  }

  return (
    <div className="px-5 py-4 overflow-y-auto">
      <SegmentedControl
        className="mb-3"
        label={t(lang, 'planShareImage')}
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
          maxHeight: '18rem',
        }}
      >
        {image
          ? <img src={image.url} alt={title} className="h-full w-full object-contain" />
          : <Loader2 size={18} className="animate-spin" style={{ color: 'var(--text-3)' }} aria-hidden="true" />}
      </div>
      {image && (
        <div className="flex flex-col gap-2">
          {canUseNativeSheet && (
            <button
              type="button"
              onClick={shareImage}
              className="pressable flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'var(--accent)' }}
            >
              <Share2 size={16} aria-hidden="true" /> {t(lang, 'verseShareImage')}
            </button>
          )}
          <button
            type="button"
            onClick={saveImage}
            className="pressable flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium"
            style={canUseNativeSheet
              ? { background: 'var(--input-bg)', color: 'var(--text-2)', border: '0.5px solid var(--input-border)' }
              : { background: 'var(--accent)', color: '#fff' }}
          >
            <Download size={15} aria-hidden="true" /> {t(lang, 'verseSaveImage')}
          </button>
        </div>
      )}
    </div>
  );
}
