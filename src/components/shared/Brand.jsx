// The Qetoret brand, drawn inline from the generated master geometry
// (src/brand/marks.js ← scripts/build-brand.mjs) so it takes its colours from
// the theme: a purple Q with gold incense on light, alabaster on dark.
// tone: 'brand' (follows the theme), 'inverse' (on deep-violet surfaces) or
// 'mono' (currentColor). Decorative unless a `title` is given.
import { SYMBOL, SYMBOL_SMALL, WORDMARK } from '../../brand/marks';
import { APP_NAME } from '../../lib/brand';

const TONES = {
  brand: ['var(--q-mark)', 'var(--q-mark-incense)'],
  inverse: ['#F7F5EF', '#C6A15C'],
  mono: ['currentColor', 'currentColor'],
};

const ratio = (viewBox) => {
  const [, , w, h] = viewBox.split(' ').map(Number);
  return w / h;
};

function a11y(title) {
  return title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true, focusable: 'false' };
}

// The symbol alone. Below ~48px the small-size cut is used automatically: one
// sturdier wisp instead of two fine ones. `rising` lets the incense rise and
// fade on a slow loop (loaders); reduced motion keeps it still.
export function BrandMark({ size = 32, tone = 'brand', title, rising = false, className = '' }) {
  const mark = size < 48 ? SYMBOL_SMALL : SYMBOL;
  const [q, incense] = TONES[tone] || TONES.brand;
  return (
    <svg
      viewBox={mark.viewBox}
      height={size}
      width={Math.round(size * ratio(mark.viewBox))}
      className={`brand-mark ${rising ? 'brand-mark--rising' : ''} ${className}`}
      {...a11y(title)}
    >
      <g fill={q}>{mark.q.map((d, i) => <path key={i} d={d} />)}</g>
      <g fill={incense} className="brand-mark__incense">{mark.incense.map((d, i) => <path key={i} d={d} />)}</g>
    </svg>
  );
}

// "Qetoret" set from outlines — never a runtime font, so it reads the same in
// every language. `height` is the height of the drawn word including the swash.
export function Wordmark({ height = 20, tone = 'brand', title = APP_NAME, className = '' }) {
  const [q] = TONES[tone] || TONES.brand;
  return (
    <svg
      viewBox={WORDMARK.viewBox}
      height={height}
      width={Math.round(height * ratio(WORDMARK.viewBox))}
      className={`brand-wordmark-art ${className}`}
      {...a11y(title)}
    >
      <g fill={q}>
        {WORDMARK.q.map((d, i) => <path key={i} d={d} />)}
        <path d={WORDMARK.letters} transform={WORDMARK.lettersTransform} />
      </g>
    </svg>
  );
}

// Symbol + wordmark, side by side: the app's sidebar, headers and footers.
export function BrandLockup({ size = 30, tone = 'brand', className = '' }) {
  return (
    <span className={`brand-lockup ${className}`} role="img" aria-label={APP_NAME}>
      <BrandMark size={size} tone={tone} />
      <Wordmark height={Math.round(size * 0.62)} tone={tone} title={null} />
    </span>
  );
}

// Boot and route loading: the mark with its incense quietly rising, nothing else.
export function BrandLoader({ label = APP_NAME }) {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--q-canvas)' }} role="status">
      <BrandMark size={64} rising />
      <span className="sr-only">{label}</span>
    </div>
  );
}
