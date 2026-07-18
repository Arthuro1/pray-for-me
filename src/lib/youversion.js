// Client for the YouVersion Platform API, reached through the app's own proxy
// (the dev Vite proxy or the /api/youversion serverless function) so the App Key
// stays server-side. The feature is opt-in: it's only attempted when
// VITE_YOUVERSION_ENABLED is set, so an unconfigured deploy never makes a wasted
// round-trip and silently falls back to reference-only in verseText.js.
import { supabase } from './supabase';

export function youVersionEnabled() {
  return import.meta.env.VITE_YOUVERSION_ENABLED === 'true';
}

// Fetch one passage by numeric version id + USFM reference (e.g. "JHN.3.16").
// Returns { data: { text, reference } | null, error }. The dev proxy returns
// YouVersion's raw { content, reference } while the prod function returns
// { text, reference }, so we accept either shape.
export async function fetchYouVersionPassage({ versionId, usfm }) {
  const url = `/api/youversion?version=${encodeURIComponent(versionId)}&ref=${encodeURIComponent(usfm)}`;
  const headers = {};
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

  let res;
  try {
    res = await fetch(url, { headers });
  } catch {
    return { data: null, error: { status: 0 } };
  }
  if (!res.ok) return { data: null, error: { status: res.status } };

  const body = await res.json().catch(() => null);
  // format=text returns plain text; strip any stray markup defensively so the
  // reader never shows raw tags.
  const text = (body?.text ?? body?.content ?? '').replace(/<[^>]*>/g, '').trim();
  if (!text) return { data: null, error: { status: 502 } };
  return { data: { text, reference: body?.reference || null }, error: null };
}
