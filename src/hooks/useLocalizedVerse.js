import { useState, useEffect } from 'react';
import { localizeRef } from '../content/teaching';
import { usfmFromReference } from '../lib/bibleRef';
import { fetchScriptureText } from '../lib/verseText';

// Resolve a stored prayer verse into the reader's language.
//
// A verse is saved in whatever language the prayer was created in (its reference
// AND its text), so after a language switch the stored wording no longer matches
// the reader's settings. Bible text is NEVER machine-translated (that is the app's
// single most sensitive correctness boundary — see verseText.js); instead we map
// the reference to a USFM id deterministically and offline (usfmFromReference
// already recognises book names in every supported language) and pull AUTHORITATIVE
// text for the current language from the offline bundle or YouVersion.
//
// Returns an authoritative { ref, text } pair — both in the reader's language — or
// null when no authoritative text exists for the language (e.g. no YouVersion
// edition, or an unrecognised reference). The caller then keeps the ORIGINAL
// reference and text together, so the citation never disagrees with the wording it
// labels: the two are always shown as one consistent pair, in one language.
export function useLocalizedVerse(reference, lang) {
  const [resolved, setResolved] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setResolved(null);
    if (!reference) return undefined;

    const localized = localizeRef(reference, lang);
    const usfm = usfmFromReference(reference);
    fetchScriptureText({ reference: localized, lang, usfm }).then((res) => {
      if (!cancelled && res?.text) setResolved({ ref: localized, text: res.text });
    });
    return () => { cancelled = true; };
  }, [reference, lang]);

  return resolved;
}
