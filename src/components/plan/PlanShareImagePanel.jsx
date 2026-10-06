import { useEffect, useState } from 'react';
import { Download, Loader2, Share2 } from 'lucide-react';
import { PrimaryButton, SecondaryButton, SegmentedControl } from '../shared/Primitives';
import { toast } from '../../store/toastStore';
import { t } from '../../i18n';
import { renderPlanCard } from '../../lib/planCard';
import { FILE_PREFIX } from '../../lib/brand';

// The plan as a picture, for Stories and Status, where a bare link travels
// badly. Square or story frame, then the phone's share sheet (the picture plus
// the link as text) or a plain download. With no 2D canvas the panel says so
// and the link in the sheet carries on alone.
export default function PlanShareImagePanel({ plan, lang, message, url, onShared }) {
  const [size, setSize] = useState('square');
  const [image, setImage] = useState(null);
  const [rendering, setRendering] = useState(true);

  const title = t(lang, plan.titleKey);
  const fileName = `${FILE_PREFIX}-plan-${plan.id}-${size}.png`;

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;
    setRendering(true);
    renderPlanCard({
      label: t(lang, 'planShareCardLabel'),
      title,
      meta: t(lang, 'planDays', { n: plan.count }),
      sub: t(lang, plan.subKey),
      lang,
      size,
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
  const SaveButton = canUseNativeSheet ? SecondaryButton : PrimaryButton;

  if (!rendering && !image) {
    return <p className="plan-detail__body q-meta">{t(lang, 'errorGeneric')}</p>;
  }

  return (
    <div className="plan-detail__body min-h-0 flex-1 overflow-y-auto">
      <SegmentedControl
        className="mb-4"
        label={t(lang, 'planShareImage')}
        value={size}
        onChange={setSize}
        options={[
          { value: 'square', label: t(lang, 'verseCardSquare') },
          { value: 'story', label: t(lang, 'verseCardStory') },
        ]}
      />
      <div className={`share-image ${size === 'story' ? 'share-image--story' : ''}`}>
        {image
          ? <img src={image.url} alt={title} />
          : <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
      </div>
      {image && (
        <div className="mt-5 grid gap-2">
          {canUseNativeSheet && (
            <PrimaryButton icon={Share2} onClick={shareImage}>{t(lang, 'verseShareImage')}</PrimaryButton>
          )}
          <SaveButton icon={Download} iconSize={16} onClick={saveImage}>{t(lang, 'verseSaveImage')}</SaveButton>
        </div>
      )}
    </div>
  );
}
