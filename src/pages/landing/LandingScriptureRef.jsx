import { lazy, Suspense, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { isLocaleLoaded, loadLocale } from '../../i18n';
import { localizeRef } from '../../content/teaching/pick';

// The app's Scripture reader, fetched only when a visitor asks to read a
// passage: the public page itself never loads Supabase. It resolves the text
// the way the app always does — offline bundle, shared cache, YouVersion — and
// otherwise links to the reader's own Bible. Scripture is never authored here.
const VerseAccordion = lazy(() => import('../../components/VerseAccordion'));

export default function LandingScriptureRef({ reference, lang }) {
  const [requested, setRequested] = useState(false);
  // The reader's own words ("Read the whole chapter") come from the app's
  // dictionary, which the public page does not otherwise load.
  const [localeReady, setLocaleReady] = useState(() => isLocaleLoaded(lang));
  const label = localizeRef(reference, lang);
  // Chapter and verse stay left-to-right inside Arabic or Persian text, or
  // "7:9-10" would read "10-7:9".
  const [, book = label, verses = ''] = /^(.+?)\s+(\d.*)$/.exec(label) || [];

  const trigger = ({ onClick, expanded = false, busy = false }) => (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-busy={busy || undefined}
      className="scripture-ref"
    >
      <BookOpen size={13} aria-hidden="true" /> <span>{book}{verses && <> <span dir="ltr">{verses}</span></>}</span>
    </button>
  );

  const request = async () => {
    setRequested(true);
    if (!isLocaleLoaded(lang)) {
      await loadLocale(lang);
      setLocaleReady(true);
    }
  };

  if (!requested) return trigger({ onClick: request });
  if (!localeReady && !isLocaleLoaded(lang)) return trigger({ busy: true });
  return (
    <Suspense fallback={trigger({ busy: true })}>
      <VerseAccordion reference={label} lang={lang} defaultExpanded>
        {({ toggle, expanded }) => trigger({ onClick: toggle, expanded })}
      </VerseAccordion>
    </Suspense>
  );
}
