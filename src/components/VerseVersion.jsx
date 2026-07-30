import { useState, useEffect } from 'react';
import { usfmFromReference } from '../lib/bibleRef';
import { getBundledVerse } from '../lib/verseBundle';
import { versionForSource, linkVersion, BUNDLE_VERSIONS } from '../lib/bibleVersions';

// Work out which Bible edition a reference is (or would be) shown from, WITHOUT
// fetching the verse text. Mirrors the source order in verseText.js: the offline
// bundle wins when it has the verse (that's what the reader renders in-app for a
// pool verse); otherwise the reference is attributed to the edition its
// "open in Bible" link opens (the YouVersion one). When the caller already knows
// the source of a verse it has resolved, it passes `source` and we use that
// directly — the authoritative, no-guessing path.
function useBibleVersion(reference, lang, source) {
  const [version, setVersion] = useState(() => (source ? versionForSource(source, lang) : null));

  useEffect(() => {
    if (source) { setVersion(versionForSource(source, lang)); return undefined; }

    let cancelled = false;
    setVersion(null);
    const resolve = async () => {
      // Prefer the bundle edition when this exact verse ships offline — that's the
      // text the app shows in-app, so it's what the tag must name.
      if (BUNDLE_VERSIONS[lang] && reference) {
        const usfm = usfmFromReference(reference);
        const hit = await getBundledVerse({ reference, lang, usfm });
        if (cancelled) return;
        if (hit) { setVersion(BUNDLE_VERSIONS[lang]); return; }
      }
      // Otherwise attribute it to the edition the outbound Bible link resolves to.
      if (!cancelled) setVersion(linkVersion(lang));
    };
    resolve();
    return () => { cancelled = true; };
  }, [reference, lang, source]);

  return version;
}

// A subtle version tag rendered after a Bible reference (e.g. "· WEB"), with the
// full edition name on tap/hover. Inherits its neighbour's colour and dims itself
// so it reads as a quiet annotation rather than a second citation. Renders nothing
// when no edition can be attributed.
//
// Pass `source` ('bundle' | 'youversion') when the caller has already resolved the
// verse text and knows exactly where it came from (source-accurate). Omit it for a
// bare reference and the tag resolves the likely edition itself.
export default function VerseVersion({ reference, lang, source, className = '', style, separator = ' · ' }) {
  const version = useBibleVersion(reference, lang, source);
  if (!version) return null;
  return (
    <span
      className={className}
      style={{ opacity: 0.65, fontWeight: 400, ...style }}
      title={version.name}
      aria-label={version.name}
    >
      {separator}{version.abbr}
    </span>
  );
}
