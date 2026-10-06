// The Qetoret Rise Mark: the gold line from the logo, rising. Decoration only —
// always aria-hidden, always beside text that says what happened ("Amen",
// "Prayed today"), so nothing depends on seeing it. One per screen at most.
// motion: 'rise' (once), 'breathe' (slow repeat, Remain with God) or 'still'.
// Reduced-motion readers always get the line at rest (components.css).
export default function RiseMark({ motion = 'rise', size = 36, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-testid="rise-mark"
      viewBox="0 0 24 40"
      width={size * 0.6}
      height={size}
      className={`rise-mark ${motion === 'still' ? '' : `rise-mark--${motion}`} ${className}`}
    >
      <path
        d="M8 36C14 33 16 28 13.5 23C11.5 19 11 15 13.5 11C15.5 7.5 17 6 18 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
