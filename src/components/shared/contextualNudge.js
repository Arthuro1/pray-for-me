import { createContext, useContext, useEffect } from 'react';

export const ContextualNudgeContext = createContext(null);

const noop = () => {};

export function useContextualNudgeSlot(id, eligible, priority) {
  const coordinator = useContext(ContextualNudgeContext);
  const register = coordinator?.register;

  useEffect(() => {
    if (!register || !eligible) return undefined;
    return register(id, priority);
  }, [eligible, id, priority, register]);

  // Components remain independently testable and reusable outside the product
  // shell; without a provider, eligibility alone controls their visibility.
  return {
    visible: !!eligible && (!coordinator || coordinator.activeId === id),
    complete: coordinator?.complete || noop,
  };
}
