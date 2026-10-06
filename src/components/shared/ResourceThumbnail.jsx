import { useState } from 'react';
import { BookOpen, FileText, Mic, GraduationCap, PlayCircle, NotebookPen, HandHeart } from 'lucide-react';
import { categoryTint } from '../../lib/categoryColor';

// The cover tile beside a "Go deeper" recommendation.
//
// Two states, one shape: a curated cover file served from our own origin, or —
// far more often — a generated tile carrying the resource's type glyph on a tint
// seeded from its id. Which one is decided by resolveResourceThumbnail(), which
// also explains why a cover may never be hot-linked from a publisher or a
// retailer. If the file 404s or the reader is offline, the generated tile takes
// over: a missing picture must never leave a hole in the shelf.
//
// Wholly decorative. The title, author, type and language sit beside it as real
// text, so the tile is hidden from assistive tech rather than read out twice.

const TYPE_ICONS = {
  book: BookOpen,
  article: FileText,
  podcast: Mic,
  teaching: GraduationCap,
  video: PlayCircle,
  study: NotebookPen,
  prayerGuide: HandHeart,
};

// Portrait, at the 2:3 of an actual trade paperback. `shelf` is the browsing
// size: once a card carries a real cover it is the thing the eye lands on, so
// it is sized to be recognisable rather than merely present.
const SIZES = {
  compact: { width: 44, height: 66, icon: 18, radius: 'rounded-md' },
  shelf: { width: 72, height: 108, icon: 24, radius: 'rounded-lg' },
};

export default function ResourceThumbnail({ thumbnail, surface = 'var(--input-bg)', size = 'compact' }) {
  // Keyed by the src that failed rather than a boolean, so the tile re-tries by
  // itself if the card is ever handed a different cover.
  const [failedSrc, setFailedSrc] = useState(null);
  if (!thumbnail) return null;

  const { src, color, type, spine } = thumbnail;
  const Icon = TYPE_ICONS[type] || BookOpen;
  const showImage = src && failedSrc !== src;
  const dimensions = SIZES[size] || SIZES.compact;

  return (
    <div
      aria-hidden="true"
      className={`relative shrink-0 overflow-hidden ${dimensions.radius}`}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        background: categoryTint(color, 18, surface),
        border: '0.5px solid var(--input-border)',
      }}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          width={dimensions.width}
          height={dimensions.height}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <>
          {/* A hint of a spine, for the types that actually have one. */}
          {spine && (
            <span
              className="absolute inset-y-0 start-0"
              style={{ width: 3, background: color, opacity: 0.5 }}
            />
          )}
          <span className="flex h-full w-full items-center justify-center">
            {/* The hue pulled a little toward the ink: the palette colour on an
                18% tint of itself measures ~2.5:1 at worst, which is under the
                3:1 a graphic should hold. Mixed like this the whole palette
                clears 3.2:1 in both themes, and still reads as its own colour. */}
            <Icon size={dimensions.icon} style={{ color: `color-mix(in srgb, ${color} 85%, var(--ink))` }} />
          </span>
        </>
      )}
    </div>
  );
}
