import { useState } from 'react';
import { ExternalLink, ChevronDown } from 'lucide-react';
import { t, LANGUAGES } from '../i18n';
import { pick } from '../content/teaching';
import { track, EVENTS } from '../lib/analytics';
import { isLowDataMode } from '../lib/lowData';
import { resolveResourceThumbnail } from '../lib/resourceThumbnail';
import { availableResourceLanguages } from '../lib/resources';
import { useResourceLanguages } from '../hooks/useResourceLanguages';
import ResourceThumbnail from './shared/ResourceThumbnail';
import LanguageChip from './shared/LanguageChip';

// The collapsed "Go deeper" shelf under a plan day.
//
// It is deliberately the LAST thing on the day and visually the quietest: a
// recommended book must never look like it carries the authority of the passage
// above it. The caller resolves the resources (src/lib/resources.js); when there
// are none the shelf renders nothing — we never tell a reader that their
// language has nothing, we just leave the section out.
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

// ─────────────────────────────────────────────────────────────────────────────
// WHY THE SHELF CARRIES ITS OWN LANGUAGE CHOICE
// ─────────────────────────────────────────────────────────────────────────────
// Resource languages used to live only in Settings, next to the app language,
// where a reader had no way to know which of eleven languages would bring
// anything for today. Here the shelf offers exactly the languages that WOULD add
// to it, each with how many works it adds, beside the ones already chosen so
// an accidental tap is undone in place. It is the same device setting as in
// Settings (a newly ticked language still goes first), so every shelf updates.
const DISPLAYABLE_RESOURCE_LANGUAGES = new Set(availableResourceLanguages());

function ShelfLanguages({ lang, enabled, offers, onToggle }) {
  const gains = new Map(offers.map((offer) => [offer.lang, offer.count]));
  // Stable catalogue order, not priority order, so a chip never jumps out from
  // under the finger that just ticked it.
  const shown = LANGUAGES.filter((l) => l.code !== lang
    && (gains.has(l.code) || (enabled.includes(l.code) && DISPLAYABLE_RESOURCE_LANGUAGES.has(l.code))));
  if (!shown.length) return null;

  return (
    <div className="mb-3">
      <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
        {t(lang, 'resourceLanguagesTitle')}
      </h4>
      <div role="group" aria-label={t(lang, 'resourceLanguagesTitle')} className="flex flex-wrap gap-2">
        {shown.map((l) => {
          const on = enabled.includes(l.code);
          const gain = on ? 0 : gains.get(l.code) || 0;
          return (
            <LanguageChip
              key={l.code}
              label={l.label}
              on={on}
              gain={gain}
              ariaLabel={gain ? t(lang, 'resourceLanguageAdd', { language: l.label, count: gain }) : undefined}
              onToggle={() => onToggle(l.code)}
            />
          );
        })}
      </div>
    </div>
  );
}

// `framed` draws the quiet card the plan day puts around the shelf; it lives
// here so the frame disappears with the shelf instead of lingering empty.
export default function GoDeeper({ resources, lang, id = 'plan-go-deeper', languageOffers = [], framed = false }) {
  const [open, setOpen] = useState(false);
  // Once the reader has changed a language on this shelf it stays on screen,
  // even if that emptied it: unticking the one language that filled it must not
  // also take away the chip that brings it back.
  const [adjusted, setAdjusted] = useState(false);
  const { languages: enabled, toggle } = useResourceLanguages();
  // Read once for the whole shelf rather than per card — it is the same device
  // setting for all of them.
  const lowData = isLowDataMode();
  if (!resources?.length && !adjusted) return null;

  const toggleLanguage = (code) => {
    setAdjusted(true);
    toggle(code);
  };

  return (
    <section
      className={framed ? 'rounded-xl px-3' : undefined}
      style={framed ? { background: 'var(--input-bg)', border: '0.5px solid var(--input-border)' } : undefined}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-start"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{t(lang, 'goDeeper')}</span>
          {resources.length > 0 && (
            <span
              aria-hidden="true"
              className="inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              {resources.length}
            </span>
          )}
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
          <ShelfLanguages lang={lang} enabled={enabled} offers={languageOffers} onToggle={toggleLanguage} />
          <ul className="grid gap-2 sm:grid-cols-2">
            {resources.map((r) => <ResourceCard key={r.id} resource={r} lang={lang} lowData={lowData} />)}
          </ul>
        </div>
      )}
    </section>
  );
}
