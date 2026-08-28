import { useState } from 'react';
import { ExternalLink, ChevronDown } from 'lucide-react';
import { t, LANGUAGES } from '../i18n';
import { pick } from '../content/teaching';
import { track, EVENTS } from '../lib/analytics';
import { isLowDataMode } from '../lib/lowData';
import { resolveResourceThumbnail } from '../lib/resourceThumbnail';
import ResourceThumbnail from './shared/ResourceThumbnail';

// The collapsed "Go deeper" shelf under a plan day.
//
// It is deliberately the LAST thing on the day and visually the quietest: a
// recommended book must never look like it carries the authority of the passage
// above it. The caller resolves the resources (src/lib/resources.js) and simply
// does not render this component when there are none — we never tell a reader
// that their language has nothing, we just leave the section out.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THE SHELF OPENS COMPLETE
// ─────────────────────────────────────────────────────────────────────────────
// It used to preview three cards behind a second "load more" tap. That put two
// gates in front of a book the resolver had ALREADY judged relevant to today,
// and it hid the shape of the shelf: a day matching fifteen titles looked
// exactly like a day matching three. The count is on the header, so a reader
// who expands has asked for the whole set — give them the whole set, and let
// the covers do the scanning. On a wide screen the cards run two-up; on a
// phone they stay one column, because a cover plus a sentence of "why" is what
// makes fifteen books triageable rather than a wall.
const TYPE_LABEL_KEYS = {
  book: 'resourceTypeBook',
  article: 'resourceTypeArticle',
  podcast: 'resourceTypePodcast',
  teaching: 'resourceTypeTeaching',
  video: 'resourceTypeVideo',
  study: 'resourceTypeStudy',
  prayerGuide: 'resourceTypePrayerGuide',
};

// The resource's own language, named in the reader's script where we have a
// label for it. Always shown, so a fallback-language recommendation is obvious
// before it is opened.
function languageLabel(code) {
  return LANGUAGES.find((l) => l.code === code)?.label || code.toUpperCase();
}

function ResourceCard({ resource, lang, lowData = false }) {
  const typeLabel = t(lang, TYPE_LABEL_KEYS[resource.type] || 'resourceTypeBook');
  const { title, author, url, thumbnail } = resource.edition;
  const why = pick(resource.description, lang);
  // Decoration only: the tile never carries information the text below it does
  // not already say, so a reader who never loads an image loses nothing.
  const cover = resolveResourceThumbnail({ id: resource.id, type: resource.type, thumbnail, lowData });
  // The whole card is one link rather than a "Learn more" tail: a cover the
  // reader is already looking at is the obvious thing to tap, and it makes the
  // target the size of the card instead of a line of 11px text.
  const body = (
    <>
      <ResourceThumbnail thumbnail={cover} size="shelf" />
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{title}</span>
        {author && <span className="mt-0.5 block break-words text-xs" style={{ color: 'var(--text-2)' }}>{author}</span>}
        {/* Type AND language, always — the language of a recommendation is
            never left for the reader to discover after tapping. */}
        <span className="mt-1 block text-xs" style={{ color: 'var(--text-3)' }}>
          {typeLabel} · {languageLabel(resource.lang)}
        </span>
        {why && <span className="mt-2 block text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{why}</span>}
        {url && (
          <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--accent)' }}>
            {t(lang, 'resourceLearnMore')}
            <ExternalLink size={11} aria-hidden="true" />
          </span>
        )}
      </span>
    </>
  );
  const surface = { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' };

  return (
    <li>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          // Content-free: THAT a recommendation was opened, never which one,
          // which topic surfaced it, or anything about the reader.
          onClick={() => track(EVENTS.RESOURCE_OPENED)}
          // The cover is decoration; the accessible name says what this opens,
          // who wrote it, and that it leaves the app.
          aria-label={`${title}${author ? ` — ${author}` : ''} (${t(lang, 'resourceOpensExternally')})`}
          className="flex h-full items-start gap-3 rounded-xl p-3.5"
          style={surface}
        >
          {body}
        </a>
      ) : (
        <div className="flex h-full items-start gap-3 rounded-xl p-3.5" style={surface}>{body}</div>
      )}
    </li>
  );
}

export default function GoDeeper({ resources, lang, id = 'plan-go-deeper' }) {
  const [open, setOpen] = useState(false);
  // Read once for the whole shelf rather than per card — it is the same device
  // setting for all of them.
  const lowData = isLowDataMode();
  if (!resources?.length) return null;

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-start"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{t(lang, 'goDeeper')}</span>
          <span
            aria-hidden="true"
            className="inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
          >
            {resources.length}
          </span>
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          style={{ color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
        />
      </button>
      {open && (
        <div id={id} className="pb-3">
          <p className="mb-2 text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'goDeeperNote')}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {resources.map((r) => <ResourceCard key={r.id} resource={r} lang={lang} lowData={lowData} />)}
          </ul>
        </div>
      )}
    </section>
  );
}
