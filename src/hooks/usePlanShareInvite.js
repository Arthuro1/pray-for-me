import { useEffect, useState } from 'react';
import { resolvePlanShareLink } from '../lib/planShareApi';

// Who is inviting, for the page a shared plan link opens:
//
//   { loading, firstName, inviterId, active }
//
// A missing or unknown token, a stopped link, a block, or an unreachable
// database all read the same way: no name, and the page is simply the plan.
// `inviterId` is only ever set for a signed-in visitor (the RPC enforces it).
// `userId` re-runs the lookup once a visitor signs in on the same page.
export function usePlanShareInvite(token, planId, userId = null) {
  const [invite, setInvite] = useState({ loading: !!token, firstName: null, inviterId: null, active: false });

  useEffect(() => {
    if (!token) {
      setInvite({ loading: false, firstName: null, inviterId: null, active: false });
      return undefined;
    }
    let alive = true;
    resolvePlanShareLink(token).then(({ data }) => {
      if (!alive) return;
      const valid = data && data.planId === planId;
      setInvite({
        loading: false,
        firstName: valid ? data.inviterFirstName : null,
        inviterId: valid ? data.inviterId : null,
        active: !!(valid && data.active),
      });
    });
    return () => { alive = false; };
  }, [token, planId, userId]);

  return invite;
}
