import { create } from 'zustand';
import { canHoldPrivateMetadata } from '../lib/crypto/prayerCrypto';

// One app-wide "place this carried prayer on your altar" dialog
// (components/circles/CarryPlacementHost.jsx), like confirmStore: it is opened
// from the "carried" confirmation toast, which outlives the row that was tapped.
const useCarryPlacementStore = create((set) => ({
  copyId: null, // the carrier's own copy of a group request
  close: () => set({ copyId: null }),
}));

// A copy can hold the carrier's circle only where it is encrypted and readable
// on this device.
export const canPlaceCarried = (copy) => !!copy && !copy._locked && canHoldPrivateMetadata(copy);

// Usable outside React.
export const placeCarriedPrayer = (copyId) => useCarryPlacementStore.setState({ copyId });

export default useCarryPlacementStore;
