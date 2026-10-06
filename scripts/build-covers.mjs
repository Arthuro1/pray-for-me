/**
 * Freezes publisher cover artwork into public/resources/covers/ as small webp
 * files we serve ourselves.
 *
 *   npm run build:covers            fetch every `cleared` cover that is missing
 *   npm run build:covers -- --force re-fetch even if the file already exists
 *   npm run build:covers -- --list  show the worksheet and change nothing
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY A BUILD STEP AND NOT AN <img src>
 * ───────────────────────────────────────────────────────────────────────────
 * docs/RESOURCES.md promises a recommendation is resolved entirely on the
 * device. Pointing a card at a publisher's CDN would break that silently: the
 * request itself hands that host the reader's IP and, by the filename, the
 * subject they are praying about — marriage, healing, purity — before they tap
 * anything. src/lib/resourceThumbnail.js refuses any off-origin path, so the
 * only way to show real artwork is to fetch it ONCE here, at build time, on a
 * developer's machine, and commit the result.
 *
 * The third-party URLs therefore live in scripts/resource-covers.json and never
 * in src/: nothing shipped to a browser knows a publisher's hostname.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * THE LICENCE GATE
 * ───────────────────────────────────────────────────────────────────────────
 * A cover is the publisher's artwork, so `licence: 'cleared'` is a person
 * saying they checked the licence, the press kit, or a written permission —
 * exactly like `status: 'approved'` on a catalogue entry. Anything else is
 * skipped. A missing cover is not a defect: the card draws its generated tile.
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'resources', 'covers')
const manifestPath = join(root, 'scripts', 'resource-covers.json')

// 3× the 72×108 shelf tile, at the 2:3 of a trade paperback. Big enough for a
// high-DPI phone, small enough that a shelf of them is a rounding error.
const WIDTH = 216
const HEIGHT = 324
const QUALITY = 72
// A cover is decoration on a page that must stay cheap; anything this far over
// budget is the wrong image (a full poster, a PDF, an error page).
const MAX_SOURCE_BYTES = 12 * 1024 * 1024
const WARN_OUTPUT_BYTES = 40 * 1024

const args = new Set(process.argv.slice(2))
const force = args.has('--force')
const listOnly = args.has('--list')

const fileFor = ({ id, lang }) => `${id}-${lang}.webp`
const publicPathFor = (cover) => `/resources/covers/${fileFor(cover)}`

async function fetchCover({ source }) {
  const response = await fetch(source, { redirect: 'follow' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const type = response.headers.get('content-type') || ''
  if (!type.startsWith('image/')) throw new Error(`not an image (${type || 'no content-type'})`)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.byteLength > MAX_SOURCE_BYTES) throw new Error(`${bytes.byteLength} bytes is too large`)
  return bytes
}

async function freeze(cover) {
  const target = join(outDir, fileFor(cover))
  if (existsSync(target) && !force) return { ...cover, skipped: 'already frozen' }

  const source = await fetchCover(cover)
  const webp = await sharp(source)
    // `cover` crops rather than distorts: a jacket that is not exactly 2:3 is
    // trimmed at the edges, never squashed into the wrong proportions.
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' })
    .webp({ quality: QUALITY })
    .toBuffer()

  await mkdir(outDir, { recursive: true })
  await writeFile(target, webp)
  return { ...cover, bytes: webp.byteLength }
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const covers = manifest.covers || []
const cleared = covers.filter((cover) => cover.licence === 'cleared')
const held = covers.filter((cover) => cover.licence !== 'cleared')

if (listOnly) {
  for (const cover of covers) {
    const state = existsSync(join(outDir, fileFor(cover))) ? 'frozen' : '—'
    console.log(`  ${cover.licence.padEnd(11)} ${state.padEnd(7)} ${fileFor(cover)}`)
  }
  process.exit(0)
}

if (!cleared.length) {
  console.log('Nothing to do: no cover is marked `licence: "cleared"`.')
  console.log(`${held.length} entr${held.length === 1 ? 'y is' : 'ies are'} waiting on a licence check.`)
  console.log(`Review them in scripts/resource-covers.json, then re-run.`)
  process.exit(0)
}

const frozen = []
let failed = 0
for (const cover of cleared) {
  try {
    const result = await freeze(cover)
    frozen.push(result)
    const note = result.skipped || `${(result.bytes / 1024).toFixed(1)} KB`
    console.log(`  ok    ${fileFor(cover).padEnd(52)} ${note}`)
    if (result.bytes > WARN_OUTPUT_BYTES) {
      console.log(`        ⚠ over ${WARN_OUTPUT_BYTES / 1024} KB — check the source image`)
    }
  } catch (error) {
    failed += 1
    console.log(`  FAIL  ${fileFor(cover).padEnd(52)} ${error.message}`)
  }
}

if (held.length) {
  console.log(`\n${held.length} cover(s) skipped, awaiting a licence decision:`)
  for (const cover of held) console.log(`  ${cover.licence.padEnd(11)} ${fileFor(cover)}`)
}

// The catalogue is edited by hand on purpose, so this prints what to paste
// rather than rewriting src/ from a build script.
const written = frozen.filter((cover) => !cover.skipped)
if (written.length) {
  console.log('\nAdd `thumbnail` to each edition in src/content/resources/:')
  for (const cover of written) {
    console.log(`  ${cover.id}.${cover.lang}  thumbnail: '${publicPathFor(cover)}'`)
  }
  console.log('\nAnd record provenance in public/resources/covers/README.md:')
  const today = new Date().toISOString().slice(0, 10)
  for (const cover of written) {
    console.log(`  | \`${fileFor(cover)}\` | ${cover.id} (${cover.lang}) | [publisher page](${cover.page}) | ${today} |`)
  }
}

if (failed) process.exit(1)
