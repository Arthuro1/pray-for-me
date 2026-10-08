// A Latin cross in the icon set's stroke: lucide's own "Cross" has equal arms
// and reads as a plus sign.
export default function LatinCross({ size = 24, strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 3v18M6.5 8.5h11" />
    </svg>
  );
}
