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

Before adding a file:

- **Check you may use it.** A cover is the publisher's artwork. Use it only where
  the licence, the publisher's press kit, or a written permission allows it. When
  in doubt, add no file — the generated tile is a perfectly good cover, and is
  what every entry uses today.
- Name it after the entry id (`<resource-id>.webp`), so a retired entry's file is
  obvious.
- Portrait, around 132×180 (3× the 44×60 tile). Keep it under ~30 KB.
- Prefer `.webp` or `.jpg` over `.png`: the service worker precaches `**/*.png`
  at install time, so a PNG here would be downloaded by every user on every
  deploy, whether or not they ever open a plan.

A missing or broken file is not a bug — the card falls back to the generated
tile on its own.
