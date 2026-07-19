/**
 * Regenerates every raster icon from the single vector source (public/logo.svg).
 *
 * Run after any change to the logo:  npm run build:icons
 *
 * Three variants come out of the same artwork:
 *   rounded  - the logo as designed (rx=22). Used for PWA "any" icons and the
 *              Android launcher, where no extra mask is applied.
 *   square   - full-bleed, no rounded corners. Used for the Play Store listing
 *              icon, because Play applies its own corner mask and would
 *              otherwise round an already-rounded icon.
 *   maskable - full-bleed background with the artwork shrunk into the safe zone
 *              (inner 80% circle) so Android's adaptive-icon mask cannot clip it.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const BRAND = '#6d28d9'

/** The artwork itself, without a background, in a 0 0 100 100 viewBox. */
const ART = `
  <path d="M26 28 C22 28 18 32 18 36 L18 66 C18 70 22 74 26 74 L46 74 L46 86 L58 74 L74 74 C78 74 82 70 82 66 L82 36 C82 32 78 28 74 28 Z" fill="white" opacity="0.95"/>
  <line x1="50" y1="40" x2="50" y2="62" stroke="${BRAND}" stroke-width="7" stroke-linecap="round"/>
  <line x1="39" y1="49" x2="61" y2="49" stroke="${BRAND}" stroke-width="7" stroke-linecap="round"/>
`

// The artwork's bounding box is x 18..82, y 28..86 — so its centre sits at
// (50, 57), not (50, 50). The maskable variant has to correct for that offset
// before scaling, otherwise the result looks bottom-heavy inside the mask.
const ART_CENTRE_Y = 57
const MASKABLE_SCALE = 0.75

const variant = {
  rounded: `<rect width="100" height="100" rx="22" fill="${BRAND}"/>${ART}`,
  square: `<rect width="100" height="100" fill="${BRAND}"/>${ART}`,
  maskable:
    `<rect width="100" height="100" fill="${BRAND}"/>` +
    `<g transform="translate(50,50) scale(${MASKABLE_SCALE}) translate(-50,-${ART_CENTRE_Y})">${ART}</g>`,
}

const svg = (kind) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${variant[kind]}</svg>`
  )

async function render(kind, size, outPath) {
  const absolute = join(root, outPath)
  await mkdir(dirname(absolute), { recursive: true })
  const png = await sharp(svg(kind), { density: 384 })
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
