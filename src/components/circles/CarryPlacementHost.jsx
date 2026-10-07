import usePrayerStore from '../../store/prayerStore';
import useCarryPlacementStore, { canPlaceCarried } from '../../store/carryPlacementStore';
import { circleOf } from '../../lib/circles';
import PlaceCircleModal from './PlaceCircleModal';

// Placing a carried group request on one's own altar. Carrying is ONE action;
// right after it, the "Added to the prayers you're carrying" toast offers
// "Choose a circle", and nothing stays behind on the group's wall. Later, the
// carried copy's own page in the Journal places or moves it like any prayer.
//
// The circle is the CARRIER's relationship to the prayer (the author's mother
// may be the carrier's "My people"), so it is set on their own encrypted copy
// and nowhere else: never copied from the author, never written to a community
// table or action, never seen by the group or the person who asked.
//
// Mounted once at the app root, like ConfirmHost (store/carryPlacementStore.js).
export default function CarryPlacementHost() {
  const { copyId, close } = useCarryPlacementStore();
  const copy = usePrayerStore((s) => (copyId ? s.prayers.find((p) => p.id === copyId) : null));
  const updatePrayer = usePrayerStore((s) => s.updatePrayer);
  const lang = usePrayerStore((s) => s.settings.language) || 'fr';

  if (!canPlaceCarried(copy)) return null;
  return (
    <PlaceCircleModal
      value={circleOf(copy)}
      onPlace={(circle) => updatePrayer(copy.id, { circle })}
      onClose={close}
      lang={lang}
      carried
      idPrefix={`carry-circle-${copy.id}`}
    />
  );
}
