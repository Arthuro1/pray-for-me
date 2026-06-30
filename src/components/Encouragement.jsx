import { dailyEncouragement } from '../content/encouragements';

// A tiny, muted Christ-centered word shown at gentle moments (session done,
// empty states). Deliberately understated so Scripture stays the star.
export default function Encouragement({ lang = 'en', className = '' }) {
  const text = dailyEncouragement(lang);
  if (!text) return null;
  return (
    <p className={`text-xs italic leading-relaxed ${className}`} style={{ color: 'var(--text-3)' }}>
      {text}
    </p>
  );
}
