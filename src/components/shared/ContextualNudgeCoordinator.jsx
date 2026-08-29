import { useCallback, useMemo, useState } from 'react';
import { ContextualNudgeContext } from './contextualNudge';

// A screen gets one quiet invitation at a time. Every eligible nudge registers
// its priority here; the coordinator exposes only the strongest one and, once
// that invitation is handled, keeps the rest quiet until the route changes.
export function ContextualNudgeProvider({ children }) {
  const [registrations, setRegistrations] = useState({});
  const [handled, setHandled] = useState(false);
  const complete = useCallback(() => setHandled(true), []);

  const register = useCallback((id, priority) => {
    setRegistrations((current) => (
      current[id] === priority ? current : { ...current, [id]: priority }
    ));
    return () => {
      setRegistrations((current) => {
        if (!(id in current)) return current;
        const next = { ...current };
        delete next[id];
        return next;
      });
    };
  }, []);

  const activeId = handled
    ? null
    : Object.entries(registrations)
      .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))[0]?.[0] || null;

  const value = useMemo(() => ({ activeId, register, complete }), [activeId, complete, register]);
  return <ContextualNudgeContext.Provider value={value}>{children}</ContextualNudgeContext.Provider>;
}
