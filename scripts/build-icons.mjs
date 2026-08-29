/**
 * Regenerates every raster icon from the single vector source (public/logo.svg).
 *
 * Run after any change to the logo:  npm run build:icons
 *
 * The logo is read and recomposed here, never redrawn, so the rasters cannot
 * drift away from the vector the app itself ships.
 *
 * Three variants come out of the same artwork:
 *   rounded  - the logo exactly as designed. Used for the PWA "any" icons, the
 *              Android launcher and the splash, where no extra mask is applied.
 *   square   - full-bleed, the logo's own corner radius dropped. Used for the
 *              Play Store listing icon, because Play applies its own corner mask
 *              and would otherwise round an already-rounded icon.
 *   maskable - full-bleed, with the artwork shrunk into the safe zone (inner
 *              80% circle) so Android's adaptive-icon mask cannot clip it.
 *
 * logo.svg has to keep the shape this parse expects: a square viewBox, one flat
 * backdrop group `<g clip-path="url(#iconMask)">...</g>` holding the rounded
 * background, and the artwork after it. Anything else throws, rather than
 * quietly writing a wrong icon.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = 'public/logo.svg'

/** Android masks an adaptive icon down to the inner 80% circle. */
const SAFE_ZONE = 0.8
/** Sitting exactly on that boundary looks cramped, so leave a little air. */
const BREATHING_ROOM = 0.9

const logo = await readFile(join(root, SOURCE), 'utf8')

const viewBox = logo.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
if (!viewBox || viewBox[1] !== viewBox[2]) {
  throw new Error(`${SOURCE}: expected a square viewBox starting at "0 0".`)
}
/** The logo's own user-space size. Every measurement below is in these units. */
const CANVAS = Number(viewBox[1])

const backdrop = logo.match(/<g\s+clip-path="url\(#iconMask\)"\s*>([\s\S]*?)<\/g>/)
if (!backdrop || backdrop[1].includes('<g')) {
  throw new Error(`${SOURCE}: expected one flat <g clip-path="url(#iconMask)"> backdrop group.`)
}

/** The <svg> tag and <defs> — every variant needs them. */
const head = logo.slice(0, backdrop.index)
/** The artwork below the backdrop. This is what the maskable safe zone applies to. */
const art = logo.slice(backdrop.index + backdrop[0].length).replace(/<\/svg>\s*$/, '')
if (!art.trim()) {
  throw new Error(`${SOURCE}: found no artwork after the backdrop group.`)
}

/** Dropping the clip paints the same background full-bleed. */
const fullBleed = `<g>${backdrop[1]}</g>`

const compose = (...layers) => Buffer.from(`${head}${layers.join('')}</svg>`)

/** Render at least at the target size, so no output is upscaled from a smaller raster. */
const densityFor = (size) => Math.max(72, Math.ceil((72 * size) / CANVAS))

// Measure the artwork rather than relying on coordinates from the current logo.
// Its rectangular bounds are not a good optical centre: the narrow speech-tail
// and diffuse shadow reach much farther down than the dominant bubble body.
const probe = await sharp(compose(art), { density: densityFor(CANVAS) })
  .resize(CANVAS, CANVAS)
  .png()
  .toBuffer()
const { info: bounds } = await sharp(probe)
  .trim({ threshold: 1 })
  .toBuffer({ resolveWithObject: true })

// Use the alpha-weighted centroid of the substantially opaque pixels. This
// follows the visual mass of the mark while excluding the soft drop shadow.
const { data: pixels, info: pixelInfo } = await sharp(probe)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })
const ALPHA_CUTOFF = 128
let totalWeight = 0
let weightedX = 0
let weightedY = 0
for (let y = 0; y < pixelInfo.height; y += 1) {
  for (let x = 0; x < pixelInfo.width; x += 1) {
    const alpha = pixels[(y * pixelInfo.width + x) * pixelInfo.channels + 3]
    if (alpha < ALPHA_CUTOFF) continue
    totalWeight += alpha
    weightedX += (x + 0.5) * alpha
    weightedY += (y + 0.5) * alpha
  }
}
if (totalWeight === 0) {
  throw new Error(`${SOURCE}: found no opaque artwork to centre.`)
}
const opticalCentreX = weightedX / totalWeight
const opticalCentreY = weightedY / totalWeight

// A rectangle fits inside a circle when its diagonal does, so the diagonal is
// what the safe zone has to hold.
const scale = Math.min(1, (CANVAS * SAFE_ZONE * BREATHING_ROOM) / Math.hypot(bounds.width, bounds.height))
const placeAtCentre = (artScale) =>
  `<g transform="translate(${CANVAS / 2},${CANVAS / 2}) scale(${artScale.toFixed(4)}) ` +
  `translate(${-opticalCentreX},${-opticalCentreY})">${art}</g>`

const variant = {
  rounded: compose(backdrop[0], placeAtCentre(1)),
  square: compose(fullBleed, placeAtCentre(1)),
  maskable: compose(fullBleed, placeAtCentre(scale)),
}

async function render(kind, size, outPath) {
  const absolute = join(root, outPath)
  await mkdir(dirname(absolute), { recursive: true })
  const png = await sharp(variant[kind], { density: densityFor(size) })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer()
  await writeFile(absolute, png)
  console.log(`  ${String(size).padStart(4)}px  ${kind.padEnd(8)}  ${outPath}`)
}

// Android launcher densities: mdpi is the 1x baseline, the rest scale from it.
const LAUNCHER = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
const MASKABLE = { mdpi: 82, hdpi: 123, xhdpi: 164, xxhdpi: 246, xxxhdpi: 328 }
const SPLASH = { mdpi: 300, hdpi: 450, xhdpi: 600, xxhdpi: 900, xxxhdpi: 1200 }

const twaRes = 'android-twa/app/src/main/res'

console.log(
  `Source: ${SOURCE} — ${CANVAS}px canvas, artwork ${Math.round(bounds.width)}x${Math.round(bounds.height)}, ` +
    `optical centre ${opticalCentreX.toFixed(1)},${opticalCentreY.toFixed(1)}, maskable scale ${scale.toFixed(2)}x\n`
)

console.log('Web app (PWA):')
await render('rounded', 192, 'public/icons/icon-192.png')
await render('rounded', 512, 'public/icons/icon-512.png')
await render('maskable', 512, 'public/icons/icon-maskable-512.png')

console.log('\nPlay Store listing:')
await render('square', 512, 'android-twa/store_icon.png')

console.log('\nAndroid launcher:')
for (const [density, size] of Object.entries(LAUNCHER)) {
  await render('rounded', size, `${twaRes}/mipmap-${density}/ic_launcher.png`)
}
for (const [density, size] of Object.entries(MASKABLE)) {
  await render('maskable', size, `${twaRes}/mipmap-${density}/ic_maskable.png`)
}

console.log('\nAndroid splash:')
for (const [density, size] of Object.entries(SPLASH)) {
  await render('rounded', size, `${twaRes}/drawable-${density}/splash.png`)
}

console.log('\nDone.')
