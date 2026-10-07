import { useState } from 'react';
import usePrayerStore from '../../store/prayerStore';
import { t } from '../../i18n';
import { circleLabelKey, circleOf } from '../../lib/circles';
import { canHoldPrivateMetadata } from '../../lib/crypto/prayerCrypto';
import CircleGlyph from '../shared/CircleGlyph';
import PlaceCircleModal from './PlaceCircleModal';

// The quiet link itself: "Place on your altar", or the carrier's own circle.
export function CarryPlacementLink({ circle, lang, onOpen, className = '' }) {
  const name = circle ? t(lang, circleLabelKey(circle)) : null;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={name ? t(lang, 'carryPlacedIn', { circle: name }) : undefined}
      className={`carry-placement pressable ${className}`}
    >
      {circle && <CircleGlyph circle={circle} size={14} selected />}
      <span>{name || t(lang, 'placeOnAltarLabel')}</span>
    </button>
  );
}

// After "Carry this prayer": a quiet way to place the carried request on one's
// own altar. It is never a step of carrying — carrying is already done, and
// ignoring this is fine. The circle is the CARRIER's relationship to the
// prayer (the author's mother may be the carrier's "My people"), so it is set
// on their own encrypted copy and nowhere else; only they ever see it.
//
// `copy` is the carrier's saved copy of the request. An unplaced copy shows the
// invitation only where `offer` asks for it (right after carrying, or on the
// request's own page); a placed copy always says where it is carried.
export default function CarryPlacement({ copy, offer = false, lang, className = '' }) {
  const updatePrayer = usePrayerStore((s) => s.updatePrayer);
  const [open, setOpen] = useState(false);

  if (!copy || copy._locked || !canHoldPrivateMetadata(copy)) return null;
  const circle = circleOf(copy);
  if (!circle && !offer) return null;

  return (
    <>
      <CarryPlacementLink circle={circle} lang={lang} onOpen={() => setOpen(true)} className={className} />
      {open && (
        <PlaceCircleModal
          value={circle}
          onPlace={(next) => updatePrayer(copy.id, { circle: next })}
          onClose={() => setOpen(false)}
          lang={lang}
          carried
          idPrefix={`carry-circle-${copy.id}`}
        />
      )}
    </>
  );
}
