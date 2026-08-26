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

  return (
    <li className="rounded-xl p-3.5" style={{ background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' }}>
      <div className="flex items-start gap-3">
        <ResourceThumbnail thumbnail={cover} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold break-words" style={{ color: 'var(--text-1)' }}>{title}</p>
          {author && <p className="text-xs mt-0.5 break-words" style={{ color: 'var(--text-2)' }}>{author}</p>}
          {/* Type AND language, always — the language of a recommendation is
              never left for the reader to discover after tapping. */}
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            {typeLabel} · {languageLabel(resource.lang)}
          </p>
          {why && <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-2)' }}>{why}</p>}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              // Content-free: THAT a recommendation was opened, never which one,
              // which topic surfaced it, or anything about the reader.
              onClick={() => track(EVENTS.RESOURCE_OPENED)}
              // The icon is decoration; the accessible name says both what this
              // opens and that it leaves the app.
              aria-label={`${t(lang, 'resourceLearnMore')} — ${title} (${t(lang, 'resourceOpensExternally')})`}
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-xs font-medium"
              style={{ color: 'var(--accent)' }}
            >
              {t(lang, 'resourceLearnMore')}
              <ExternalLink size={11} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
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
        <span className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{t(lang, 'goDeeper')}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          style={{ color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
        />
      </button>
      {open && (
        <div id={id}>
          <p className="mb-2 text-xs" style={{ color: 'var(--text-3)' }}>{t(lang, 'goDeeperNote')}</p>
          <ul className="flex flex-col gap-2">
            {resources.map((r) => <ResourceCard key={r.id} resource={r} lang={lang} lowData={lowData} />)}
          </ul>
        </div>
      )}
    </section>
  );
}
