import { useCallback, useEffect, useState } from 'react';
import { createPlanShareLink, fetchPlanShareStatus, stopPlanShareLink } from '../lib/planShareApi';
import { planShareUrl } from '../lib/planShareLink';

// The sharer's public link to one plan, as the Share sheet needs it:
//
//   status  'loading' | 'ready' | 'stopped' | 'plain'
//   url     what to share ('' while loading or stopped)
//   joinCount, friendNames   who began the plan through the link
//   stop(), renew()
//
// Opening the sheet mints the link the first time, so sharing is one tap. After
// "Stop sharing" it deliberately does NOT: reopening shows the link as off until
// the person asks for a new one, or stopping would last only until next time.
// 'plain' is the fallback when the link can't be reached (offline, or the
// migration not yet run in production): a tokenless plan page, no name, no count.
const PLAIN = Object.freeze({ status: 'plain', token: null, joinCount: 0, friendNames: [] });

export function usePlanShareLink(planId, lang) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const [state, setState] = useState({ status: 'loading', token: null, joinCount: 0, friendNames: [] });

  const mint = useCallback(async (base) => {
    const created = await createPlanShareLink(planId);
    return created.error ? PLAIN : { ...base, status: 'ready', token: created.data };
  }, [planId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await fetchPlanShareStatus(planId);
      let next;
      if (error) next = PLAIN;
      else {
        const base = { joinCount: data.joinCount, friendNames: data.friendNames };
        if (data.activeToken) next = { ...base, status: 'ready', token: data.activeToken };
        else if (data.stopped) next = { ...base, status: 'stopped', token: null };
        else next = await mint(base);
      }
      if (alive) setState(next);
    })();
    return () => { alive = false; };
  }, [planId, mint]);

  const stop = useCallback(async () => {
    const { error } = await stopPlanShareLink(planId);
    if (error) return false;
    setState((prev) => ({ ...prev, status: 'stopped', token: null }));
    return true;
  }, [planId]);

  const renew = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    const next = await mint({ joinCount: state.joinCount, friendNames: state.friendNames });
    setState(next);
  }, [mint, state.joinCount, state.friendNames]);

  const url = state.status === 'ready' || state.status === 'plain'
    ? planShareUrl({ origin, planId, token: state.token, lang })
    : '';

  return { ...state, url, stop, renew };
}
