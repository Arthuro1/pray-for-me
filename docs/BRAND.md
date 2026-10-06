# Qetoret brand assets

The mark is an elegant serif **Q**, open at the top, with gold **incense rising**
through its centre: first impression *Q*, second impression *something is
rising*. It was redrawn on 2026-10-06 from the approved reference board.

## Sources — edit these, never the outputs

| File | What it is |
| --- | --- |
| `scripts/brand/geometry.mjs` | The master geometry. The Q is two calligraphic strokes (left arc; right arc flowing into the tail) plus two incense strokes, each a centreline with a width profile, measured in units of the bowl radius. `small` is the optical cut for 16–48px (one sturdier wisp); `closed` + `swash` is the plain Q of the wordmark. |
| `scripts/brand/letters.json` | "etoret" and the caption "PRAYER RISES", outlined once from **Cormorant Garamond** SemiBold / Medium (SIL Open Font License 1.1). No runtime font and no font tooling is needed to rebuild. |
| `scripts/build-brand.mjs` | Composes every variant from the two sources. |

```bash
npm run build:brand
```

```bash
npm run build:icons
```

`build:brand` writes the SVGs below and `src/brand/marks.js`; `build:icons`
then rasterises `public/logo.svg` into the PWA icons, the Android launcher
icons, the splash and the Play Store icon. A changed launcher icon only reaches
Android users with a new AAB (bump `versionCode`).

## Outputs

| File | Use |
| --- | --- |
| `public/brand/qetoret-lockup-vertical.svg` | A · primary lockup: symbol above wordmark, caption beneath |
| `public/brand/qetoret-lockup-vertical-plain.svg` | A without the caption |
| `public/brand/qetoret-lockup-horizontal.svg` (+ `-dark`) | B · symbol beside wordmark |
| `public/brand/qetoret-icon.svg` = `public/logo.svg` | C · app icon, the raster source |
| `public/brand/qetoret-lockup-vertical-dark.svg` | D · alabaster and gold on deep royal violet |
| `public/brand/qetoret-symbol-mono.svg` | E · one colour (recolour freely: black, white, royal) |
| `public/brand/qetoret-symbol.svg` (+ `-dark`) | F · symbol only |
| `public/brand/qetoret-symbol-small.svg`, `public/favicon.svg` | G · small-size cut, favicon |
| `public/brand/qetoret-wordmark.svg` | the wordmark alone |

In the app, never use an `<img>` of the logo: use `BrandMark`, `Wordmark`,
`BrandLockup` or `BrandLoader` from `src/components/shared/Brand.jsx`. They draw
the mark inline from `src/brand/marks.js` and take their colours from the theme
(`--q-mark`, `--q-mark-incense`), so the Q is purple on light and alabaster on
dark. The Rise Mark (`RiseMark.jsx`) is the logo's own incense stroke.

## Colour

| | Light | On deep violet |
| --- | --- | --- |
| Q | Royal `#4B3A78` | Alabaster `#F7F5EF` |
| Incense | Temple gold `#B68A45` | Gold `#C6A15C` |
| Ground | Alabaster `#F7F5EF` | `#29213F` (icon: `#3A2D5C`) |

The app icon sits on `#3A2D5C`, halfway between royal and royal-deep: at phone
size `#29213F` reads as near-black and disappears into dark wallpapers.

## Rules

- Flat colour only in the digital mark: no gradients, metallic effects, glow,
  bevels or shadows. Foil and embossing belong to print mockups.
- The caption "PRAYER RISES" appears only under the vertical lockup — never in
  navigation, headers or the app icon. The marketing line is "Let your prayers rise."
- The wordmark carries the plain Q; the incense lives in the symbol.
- Below 48px use the small cut (`BrandMark` switches automatically).
- Keep clear space of at least half the bowl's width around the mark.
