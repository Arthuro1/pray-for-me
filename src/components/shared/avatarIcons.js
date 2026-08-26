// Preset key -> drawn glyph. Line icons (not emoji) so a group symbol renders
// identically on every platform, inherits the tile's currentColor, and needs no
// emoji font in any of the sixteen locales. The KEY is what the database stores,
// so the drawing can change here without a migration.
import { Bird, Cross, Church, HandHeart, UsersRound, Heart, BookOpen, Globe } from 'lucide-react';

export const AVATAR_ICON_COMPONENTS = {
  dove: Bird,
  cross: Cross,
  church: Church,
  hands: HandHeart,
  family: UsersRound,
  heart: Heart,
  bible: BookOpen,
  globe: Globe,
};
