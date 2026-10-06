# Resource cover thumbnails

Cover files for the "Go deeper" catalogue (`src/content/resources/catalogue.js`).
Referenced from an edition as:

```js
editions: {
  en: { title: '…', …, thumbnail: '/resources/covers/keller-meaning-of-marriage.webp' },
}
```

**Self-hosted only.** `src/lib/resourceThumbnail.js` refuses anything that is not
a same-origin path with an image extension, and the reason is not tidiness: a
request to a publisher's or a retailer's CDN would hand that host the reader's IP
and the subject they are praying about — marriage, healing, purity — before they
tap a thing. `docs/RESOURCES.md` promises recommendations are resolved entirely
on the device, and a hot-linked image would quietly break it.

## Adding one: `npm run build:covers`

Don't download and crop by hand. Add the edition to `scripts/resource-covers.json`
with the publisher's own product-image URL, get the licence checked, flip its
`licence` to `cleared`, and run:

```bash
npm run build:covers
```

It fetches, crops to 216×324, writes the webp here, and prints both the
`thumbnail:` line to paste into the catalogue and the provenance row for the
table below. `-- --list` shows the worksheet without changing anything;
`-- --force` re-fetches a file that already exists.

The script fetches **only** entries marked `cleared`, so a run can never quietly
publish artwork nobody has approved.

The rules it enforces, and why:

- **Check you may use it.** A cover is the publisher's artwork. Use it only where
  the licence, the publisher's press kit, or a written permission allows it. When
  in doubt, add no file — the generated tile is a perfectly good cover, and is
  what almost every entry uses today.
- Named after the entry id and edition language (`<resource-id>-<lang>.webp`), so
  translated editions can carry their actual cover — a German jacket is usually
  not the English one — and a retired entry's files remain obvious.
- Portrait, 216×324: 3× the 72×108 shelf tile, at a paperback's 2:3. Expect
  3–20 KB; the script warns past 40 KB.
- `.webp`, never `.png`: the service worker precaches `**/*.png` at install time,
  so a PNG here would be downloaded by every user on every deploy, whether or not
  they ever open a plan.

A missing or broken file is not a bug — the card falls back to the generated
tile on its own.

## Frozen cover sources

Every URL a cover came from lives in `scripts/resource-covers.json`, never in
`src/`. This table is the human-readable version of it.

| File | Edition | Official source | Retrieved | Size |
|---|---|---|---|---|
| `ortlund-gentle-and-lowly-en.webp` | Crossway hardcover, ISBN 9781433566134 | [Crossway product page](https://www.crossway.org/books/gentle-and-lowly-hcj/) and its official product image; Crossway publishes a media pack for this title | 2026-08-28 | 132×180 |

Each local file is a thumbnail-sized crop of the publisher's own product image,
and is never reused for another language edition whose jacket may differ.

`ortlund-gentle-and-lowly-en.webp` predates the larger shelf tile, so it is
132×180 rather than 216×324 — it still renders correctly (`object-fit: cover`
crops it), just with less headroom on a high-DPI screen. Its manifest entry is
already `cleared`, so `npm run build:covers -- --force` will re-freeze it.

Seven candidate covers for the German, Spanish and Portuguese editions added on
2026-08-28 are recorded in the manifest as `unreviewed`. They are **not**
downloaded and **not** shipped until somebody checks each publisher's licence
and flips the flag.
