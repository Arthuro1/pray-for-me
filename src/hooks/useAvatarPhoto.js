import { useCallback, useEffect, useState } from 'react';
import { signedAvatarUrl } from '../lib/avatarPhotos';

// Resolve the `photo` part of a resolved avatar to something an <img> can use.
//
// Two sources, one shape: an identity-provider picture is already a URL and is
// returned as-is, while an uploaded Praystead photo is an opaque object key that
// has to be signed. Signing goes through a module-level cache, so a group with
// forty members asks for at most forty signatures for the whole session — not
// one per render.
//
// There is deliberately no retry. A tile that cannot resolve reports a failure
// once and lets the caller fall back to the preset; the cache holds the
// negative answer for a couple of minutes so scrolling a list does not turn
// into a request loop.
export function useAvatarPhoto(photo) {
  const source = photo?.source || null;
  const key = source === 'storage' ? photo.path : source === 'identity' ? photo.url : null;

  const [url, setUrl] = useState(source === 'identity' ? key : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (!key) { setUrl(null); return undefined; }
    if (source === 'identity') { setUrl(key); return undefined; }

    let alive = true;
    setUrl(null);
    signedAvatarUrl(key).then((resolved) => {
      if (!alive) return;
      if (resolved) setUrl(resolved); else setFailed(true);
    });
    return () => { alive = false; };
  }, [key, source]);

  // The image element itself is the last check: a signed URL can still 404, and
  // an account picture can be expired or blocked. Either way the tile falls back
  // instead of showing a browser's broken-image glyph.
  const onError = useCallback(() => setFailed(true), []);

  return { url: failed ? null : url, loading: !!key && !failed && !url, onError };
}
