/**
 * Builds every Qetoret brand asset from one master geometry.
 *
 *   npm run build:brand   (then npm run build:icons for the rasters)
 *
 * Sources (edit these, never the outputs):
 *   scripts/brand/geometry.mjs  the Q and the rising incense, as calligraphic
 *                               strokes measured from the approved reference
 *   scripts/brand/letters.json  "etoret" and "PRAYER RISES", outlined once from
 *                               Cormorant Garamond (SIL OFL 1.1) — no runtime font
 *
 * Outputs: public/brand/*.svg (symbol, mono, small, wordmark, lockups, icon),
 * public/logo.svg (the app-icon source read by build-icons.mjs),
 * public/favicon.svg (the small optical cut) and src/brand/marks.js (path data
 * for the in-app <BrandMark>/<Wordmark> components). Plain paths only: no
 * images, filters, gradients or masks.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mark } from './brand/geometry.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const letters = JSON.parse(await readFile(join(root, 'scripts/brand/letters.json'), 'utf8'))

const COLOR = {
  royal: '#4B3A78',
  royalDeep: '#29213F',
  iconGround: '#3A2D5C',
  gold: '#B68A45',
  goldOnDark: '#C6A15C',
  alabaster: '#F7F5EF',
  ink: '#202026',
}

// Geometry space of the mark (see geometry.mjs): bowl radius 170 at (250, 300).
const R = 170
const BASELINE = 300 + 0.95 * R
const CAP = 1.9 * R

const r1 = (n) => Math.round(n * 10) / 10

// Bounding box of absolute M/C/L path data (control points included — a
// slightly generous box is the safe direction for a viewBox).
function bbox(paths) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const d of paths) {
    const nums = d.match(/-?\d+(?:\.\d+)?/g).map(Number)
    for (let i = 0; i < nums.length; i += 2) {
      x0 = Math.min(x0, nums[i]); x1 = Math.max(x1, nums[i])
      y0 = Math.min(y0, nums[i + 1]); y1 = Math.max(y1, nums[i + 1])
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 }
}

const pathEls = (paths, fill) => paths.map((d) => `<path d="${d}" fill="${fill}"/>`).join('')

function svg({ viewBox, title, desc, body, size }) {
  const [, , w, h] = viewBox.split(' ').map(Number)
  const dims = size ? ` width="${size[0]}" height="${size[1]}"` : ` width="${r1(w)}" height="${r1(h)}"`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${dims} role="img" aria-labelledby="title desc">
<title id="title">${title}</title>
<desc id="desc">${desc}</desc>
${body}
</svg>
`
}

// ── Parts ────────────────────────────────────────────────────────────────
const full = mark()
const small = mark({ small: true })
const plainQ = mark({ closed: true, swash: true })

const symbolBox = bbox([...full.parts, ...full.incense])
const smallBox = bbox([...small.parts, ...small.incense])

// Wordmark: the plain Q, then "etoret" scaled so its cap height is the bowl's.
const letterScale = CAP / letters.capHeight
const lettersX = 250 + R + 0.06 * R
const lettersBody = `<path d="${letters.letters.d}" transform="translate(${r1(lettersX)} ${r1(BASELINE)}) scale(${letterScale.toFixed(5)})"/>`
const wordmarkRight = lettersX + letters.letters.advance * letterScale
const wordmarkBox = (() => {
  const q = bbox(plainQ.parts)
  return { x0: q.x0, y0: Math.min(q.y0, BASELINE - CAP - 6), x1: wordmarkRight, y1: q.y1 }
})()
const wordmarkInner = (fill) => `<g fill="${fill}">${plainQ.parts.map((d) => `<path d="${d}"/>`).join('')}${lettersBody}</g>`

const captionScale = (CAP * 0.2) / letters.captionCapHeight
const captionWidth = letters.caption.advance * captionScale

const pad = (box, p) => `${r1(box.x0 - p)} ${r1(box.y0 - p)} ${r1(box.w + 2 * p)} ${r1(box.h + 2 * p)}`

// ── Symbol variants ──────────────────────────────────────────────────────
const symbol = (q, gold, parts = full) => pathEls(parts.parts, q) + pathEls(parts.incense, gold)
const DESC_SYMBOL = 'A royal-purple serif Q, open at the top, with gold incense rising through its centre.'

const outputs = {
  'public/brand/qetoret-symbol.svg': svg({
    viewBox: pad(symbolBox, 12), title: 'Qetoret', desc: DESC_SYMBOL,
    body: symbol(COLOR.royal, COLOR.gold),
  }),
  'public/brand/qetoret-symbol-dark.svg': svg({
    viewBox: pad(symbolBox, 12), title: 'Qetoret', desc: 'An alabaster serif Q with gold incense rising through its centre, for dark backgrounds.',
    body: symbol(COLOR.alabaster, COLOR.goldOnDark),
  }),
  'public/brand/qetoret-symbol-mono.svg': svg({
    viewBox: pad(symbolBox, 12), title: 'Qetoret', desc: 'The Qetoret symbol in one colour: a serif Q, open at the top, with incense rising through it.',
    body: symbol(COLOR.ink, COLOR.ink),
  }),
  'public/brand/qetoret-symbol-small.svg': svg({
    viewBox: pad(smallBox, 10), title: 'Qetoret', desc: 'The Qetoret symbol drawn for small sizes: one sturdier incense stroke.',
    body: symbol(COLOR.royal, COLOR.gold, small),
  }),
  'public/brand/qetoret-wordmark.svg': svg({
    viewBox: pad({ ...wordmarkBox, w: wordmarkBox.x1 - wordmarkBox.x0, h: wordmarkBox.y1 - wordmarkBox.y0 }, 12),
    title: 'Qetoret', desc: 'The Qetoret wordmark in a high-contrast serif.',
    body: wordmarkInner(COLOR.royal),
  }),
}

// Horizontal lockup: symbol left, wordmark right, centred on the cap height.
{
  const s = (CAP * 1.55) / (bbox(full.parts).h)
  const gap = 0.55 * R
  const symW = symbolBox.w * s
  const symX = -symbolBox.x0 * s
  const symY = (BASELINE - CAP / 2) - (300 * s)
  const wordX = symW + gap - wordmarkBox.x0
  const body = (q, gold) => `<g transform="translate(${r1(symX)} ${r1(symY)}) scale(${s.toFixed(4)})">${symbol(q, gold)}</g><g transform="translate(${r1(wordX)} 0)">${wordmarkInner(q)}</g>`
  const top = Math.min(symY + symbolBox.y0 * s, wordmarkBox.y0) - 12
  const bottom = Math.max(symY + symbolBox.y1 * s, wordmarkBox.y1) + 12
  const viewBox = `-12 ${r1(top)} ${r1(wordX + wordmarkBox.x1 + 24)} ${r1(bottom - top)}`
  outputs['public/brand/qetoret-lockup-horizontal.svg'] = svg({ viewBox, title: 'Qetoret', desc: 'The Qetoret symbol beside the Qetoret wordmark.', body: body(COLOR.royal, COLOR.gold) })
  outputs['public/brand/qetoret-lockup-horizontal-dark.svg'] = svg({ viewBox, title: 'Qetoret', desc: 'The Qetoret symbol beside the wordmark, for dark backgrounds.', body: body(COLOR.alabaster, COLOR.goldOnDark) })
}

// Vertical lockup: symbol above the wordmark, optional caption beneath.
function vertical({ q, gold, ground, caption }) {
  const wordW = wordmarkBox.x1 - wordmarkBox.x0
  const s = 2.45
  const symW = symbolBox.w * s
  const width = Math.max(wordW, symW) + 160
  const cxBowl = width / 2
  const symX = cxBowl - 250 * s - 0.08 * R * s
  const symTop = 80
  const symY = symTop - symbolBox.y0 * s
  const symBottom = symY + symbolBox.y1 * s
  const wordY = symBottom + 0.55 * R - (BASELINE - CAP)
  const wordX = (width - wordW) / 2 - wordmarkBox.x0
  let height = wordY + wordmarkBox.y1 + 80
  let captionEl = ''
  if (caption) {
    const capY = wordY + BASELINE + CAP * 0.62
    captionEl = `<path fill="${gold}" d="${letters.caption.d}" transform="translate(${r1((width - captionWidth) / 2)} ${r1(capY)}) scale(${captionScale.toFixed(5)})"/>`
    height = capY + 80
  }
  const backdrop = ground ? `<rect width="${r1(width)}" height="${r1(height)}" fill="${ground}"/>` : ''
  return {
    viewBox: `0 0 ${r1(width)} ${r1(height)}`,
    body: `${backdrop}<g transform="translate(${r1(symX)} ${r1(symY)}) scale(${s})">${symbol(q, gold)}</g><g transform="translate(${r1(wordX)} ${r1(wordY)})">${wordmarkInner(q)}</g>${captionEl}`,
  }
}
{
  const light = vertical({ q: COLOR.royal, gold: COLOR.gold, caption: true })
  outputs['public/brand/qetoret-lockup-vertical.svg'] = svg({ ...light, title: 'Qetoret — Prayer rises', desc: 'The Qetoret symbol above the wordmark and the caption Prayer rises.' })
  const plain = vertical({ q: COLOR.royal, gold: COLOR.gold, caption: false })
  outputs['public/brand/qetoret-lockup-vertical-plain.svg'] = svg({ ...plain, title: 'Qetoret', desc: 'The Qetoret symbol above the wordmark.' })
  const dark = vertical({ q: COLOR.alabaster, gold: COLOR.goldOnDark, ground: COLOR.royalDeep, caption: true })
  outputs['public/brand/qetoret-lockup-vertical-dark.svg'] = svg({ ...dark, title: 'Qetoret — Prayer rises', desc: 'The Qetoret lockup in alabaster and gold on deep royal violet.' })
}

// ── App icon (also public/logo.svg, the build-icons source) ──────────────
// The bowl, not the bounding box, is centred: the tail and the incense tip
// reach out unevenly and would otherwise pull the letter off-centre.
function iconSvg({ parts, size = 0.78, title, desc }) {
  const box = bbox([...parts.parts, ...parts.incense])
  const s = (512 * size) / Math.max(box.w, box.h)
  const bowlX = 250 * s, bowlY = 300 * s
  const boxCx = ((box.x0 + box.x1) / 2) * s, boxCy = ((box.y0 + box.y1) / 2) * s
  // Halfway between the bowl centre and the box centre reads as centred.
  const tx = 256 - (bowlX + boxCx) / 2
  const ty = 256 - (bowlY + boxCy) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-labelledby="title desc">
<title id="title">${title}</title>
<desc id="desc">${desc}</desc>
<defs><clipPath id="iconMask"><rect width="512" height="512" rx="112"/></clipPath></defs>
<g clip-path="url(#iconMask)"><rect width="512" height="512" fill="${COLOR.iconGround}"/></g>
<g transform="translate(${r1(tx)} ${r1(ty)}) scale(${s.toFixed(4)})">${symbol(COLOR.alabaster, COLOR.goldOnDark, parts)}</g>
</svg>
`
}
const ICON_DESC = 'An alabaster serif Q with gold incense rising through its centre, on deep royal violet.'
outputs['public/logo.svg'] = iconSvg({ parts: full, title: 'Qetoret', desc: ICON_DESC })
outputs['public/brand/qetoret-icon.svg'] = outputs['public/logo.svg']
outputs['public/favicon.svg'] = iconSvg({ parts: small, size: 0.86, title: 'Qetoret', desc: ICON_DESC })
outputs['public/brand/qetoret-icon-small.svg'] = outputs['public/favicon.svg']

// ── In-app path data ─────────────────────────────────────────────────────
const marksJs = `// Generated by scripts/build-brand.mjs from scripts/brand/ — do not edit.
// Path data for the in-app brand components (components/shared/Brand.jsx), so
// the mark is drawn inline and takes its colours from the theme tokens.
export const SYMBOL = ${JSON.stringify({ viewBox: pad(symbolBox, 8), q: full.parts, incense: full.incense })};
export const SYMBOL_SMALL = ${JSON.stringify({ viewBox: pad(smallBox, 8), q: small.parts, incense: small.incense })};
// The Rise Mark is the logo's own incense stroke, used alone.
export const RISE = ${JSON.stringify({ viewBox: pad(bbox([full.incense[0]]), 4), d: full.incense[0] })};
export const WORDMARK = ${JSON.stringify({
  viewBox: pad({ ...wordmarkBox, w: wordmarkBox.x1 - wordmarkBox.x0, h: wordmarkBox.y1 - wordmarkBox.y0 }, 6),
  q: plainQ.parts,
  letters: letters.letters.d,
  lettersTransform: `translate(${r1(lettersX)} ${r1(BASELINE)}) scale(${letterScale.toFixed(5)})`,
})};
`
outputs['src/brand/marks.js'] = marksJs

for (const [path, content] of Object.entries(outputs)) {
  await mkdir(dirname(join(root, path)), { recursive: true })
  await writeFile(join(root, path), content)
}
console.log(`brand: wrote ${Object.keys(outputs).length} files`)
