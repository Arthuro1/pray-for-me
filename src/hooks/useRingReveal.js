import { useEffect, useState } from 'react';

// Whether the reader asked the system for less motion.
export const reducedMotion = () => typeof window !== 'undefined'
  && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// The stage of the circle rings' first drawing (components/circles/CircleRings):
// 'armed' until `ref` is first seen, then 'revealed' — the rings draw outward
// once. Without IntersectionObserver, or with reduced motion, 'static': they
// are simply there.
export function useRingReveal(ref) {
  const [stage, setStage] = useState(() => (
    typeof window !== 'undefined' && 'IntersectionObserver' in window && !reducedMotion() ? 'armed' : 'static'
  ));
  useEffect(() => {
    if (stage !== 'armed' || !ref.current) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setStage('revealed');
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [stage, ref]);
  return stage;
}
