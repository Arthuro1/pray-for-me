import { useEffect, useState } from 'react';
import { attachmentObjectUrl } from '../lib/attachments';

// Resolve a media attachment to a decrypted object URL. Loading → { url: null,
// error: false }; failure (offline, missing object, wrong key) → error: true so
// the UI can show an honest placeholder instead of a broken player.
export function useAttachmentUrl(att) {
  const [state, setState] = useState({ url: null, error: false });
  useEffect(() => {
    let alive = true;
    setState({ url: null, error: false });
    attachmentObjectUrl(att)
      .then((url) => { if (alive) setState({ url, error: false }); })
      .catch(() => { if (alive) setState({ url: null, error: true }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [att.id]);
  return state;
}
