import { Church, Crown, Globe, Heart, Home, Landmark, Users } from 'lucide-react';

// One icon per Intercession Circle (lib/circles.js), shared by the landing page
// and the app so a circle always looks the same wherever it appears.
export const CIRCLE_ICONS = Object.freeze({
  self: Heart,
  household: Home,
  people: Users,
  church: Church,
  authorities: Landmark,
  nations: Globe,
  kingdom: Crown,
});
