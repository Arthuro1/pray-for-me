// The Qetoret "rise" mark: the gold line from the logo, drawn rising once. It is
// decoration only — always aria-hidden, and always placed beside text that says
// what happened ("Amen", "Prayed today"), so nothing depends on seeing it.
// Reduced-motion users get the line at rest (see .rise-wisp in index.css).
export default function RiseMark({ animate = true, size = 36, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-testid="rise-mark"
      viewBox="0 0 24 40"
      width={size * 0.6}
      height={size}
      className={`rise-wisp ${animate ? 'rise-wisp--once' : 'rise-wisp--still'} ${className}`}
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
