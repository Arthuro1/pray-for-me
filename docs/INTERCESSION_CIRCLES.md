# Intercession Circles

The seven circles are the widening breadth of a life of prayer: **My heart → My
house → My people → His Church → Authorities → Nations → Kingdom & Mission**
(theology: `docs/QETORET_IDENTITY.md` §5). They are reminders of breadth, never
levels, scores, achievements or progress. Nothing in the app counts how many
circles someone "has", ranks them, or nudges because one is empty.

This document is the map of how the circles are built. Read it before adding a
circle to a new screen.

## Concepts kept apart

| Concept | Question it answers | Where it lives |
|---|---|---|
| **Circle** | Who or what sphere am I carrying before God? | `prayer.circle`, inside the encrypted payload |
| **Category / label** | What is this prayer about, in my own words? | `prayer_categories`, user-made |
| **Person** | Who specifically? | `person_name` (encrypted) |
| **Rhythm** | When do I return to it? | `schedule` |
| **Plan** | How am I being guided? | `schedule.plan` + `src/content/prayerPlans.js` |

A circle never replaces a category, and categories are never turned into
circles. Circles are canonical; labels belong to the person.

## The canonical model — `src/lib/circles.js`

- `CIRCLES` — the seven stable ids, inner to outer. They are persisted inside
  encrypted prayers: renaming one is a data migration.
- `CIRCLE_DEFINITIONS` — id, order and i18n keys (`circle_*`, `circleDesc_*`,
  `circlePrompt_*`), derived from `CIRCLES`.
- `circleOf(prayer)` / `normalizeCircle(value)` — read-time normalization. A value
  this build does not know is read as "unplaced" (`null`) and never rewritten.
- `groupByCircle(prayers)` — canonical order, unplaced prayers last under `null`.
- `circlesWithin(circle)` — the reach the ring art lights (Nations = heart … nations).
- `planCircles(plan)` — a plan's optional `primaryCircle` / `circles`, read
  defensively (missing or unknown metadata = no circle, never an error).

Visuals are separate: `components/shared/CircleGlyph.jsx`, `circleGeometry.js`,
`circleIcons.js`.

## Privacy

- `circle` is in `PAYLOAD_ONLY_FIELDS` (`lib/crypto/prayerCrypto.js`): it exists
  only inside the ciphertext, on the server and in the on-device cache. There is
  no column. A column write would be rejected and the offline queue would drop
  the whole prayer.
- A prayer that cannot be encrypted (account key unavailable, a saved community
  copy) cannot hold a circle; the store drops it rather than leaking it.
- The app never classifies prayer text, never sends prayer text to AI to choose a
  circle, and never assigns a circle on the person's behalf.
- Analytics never carry a circle (`lib/analytics.js` has no such key).
- Guards: `src/store/noPlaintextLeak.test.js` ("the Intercession Circle never
  reaches Supabase in plaintext") covers add, edit, place/clear, no-key, invalid
  values, the load path, the device cache, offline replay, unknown values and
  independence from categories and rhythm.

**Open (Milestone C):** carried community copies (`community_origin_id`) are
plaintext mirrors and are never re-encrypted under the account key, so the
carrier's own circle for a carried prayer has no encrypted home yet. Decide that
before letting "Carry this prayer" choose a circle.

## Teaching content — `src/content/intercessionCircles/`

Components render this content; they never author it.

- `<circle>.js` — the **short layer**: `formation`, `heading`, `summary`,
  `themes[{ id, title }]`, `refs` (most central first; the panel shows the first
  `KEY_REF_COUNT`), `cta`. English + French in source.
- `translations/<lang>.json` — the other 14 languages, loaded on demand, keyed by
  circle id plus `ui`, mirroring the source shape (arrays by position). The short
  layer must be complete in all 16 languages: the landing page swaps whole
  language files and must never mix languages.
- `deep/<circle>.js` — the **deep layer**, loaded only when opened: `meaning`,
  an optional `framework` (My heart's seven foundations), `themes` (same ids and
  order as the short layer, each with `body`, `refs`, `prompts`, optional
  `facets`), `reflection`. English + French only; other languages read English.
- `index.js` — registry (`CIRCLE_CONTENT`, `circleContent`), panel words
  (`CIRCLE_UI`), loaders (`loadCircleOverlay`, `loadCircleDeep`),
  `withOverlay(source, overlay, lang)` and `circlesForTheme(themeId)`.

Contract test: `intercessionCircles.test.js` (every circle present in order,
every field authored, unique theme ids, at least one valid Scripture anchor,
deep layer aligned with the short layer, no quoted Scripture).

### Scripture

References only, with English book names that exist in `BOOK_NAMES`, one chapter
per reference (split `Ephesians 5:21–6:4` into two). Text is resolved at render
time by the Scripture pipeline. No quotation marks appear in circle content, so a
pasted verse fails the contract test.

### Theological guardrails for authors

- **Framework vs Scripture.** My heart's seven foundations are *Qetoret's*
  grouping of biblical practices. Say "Qetoret groups…", never "the Bible
  teaches seven…".
- **Hearing God.** Always pair listening with testing impressions against
  Scripture; the app never confirms that God said something.
- **Authorities and Nations are nonpartisan.** No party, candidate or political
  outcome; prayer for leaders we disagree with; no Christian nationalism.
- **Kingdom is not domination.** Participation through prayer, witness,
  discipleship, mercy, justice, reconciliation and service; gospel and mercy held
  together.
- **Grace, not performance.** Fruit is grown, not earned; no scores, no
  "completed" circles; reflection stays qualitative and is never stored.

### Review gate (deep layer)

`content/intercessionCircles/review.js` holds one record per deep layer;
`lib/circleReview.js` decides visibility. A deep layer is shown when its record
is `approved` with dated, named sign-offs for theology, safety and each authored
language (`en`, `fr`), or in a development build / review mode (`?planPreview=1`,
the same switch as plans), where it carries a "review pending" label. **Only a
named human writes a sign-off.**

The short layer ships without this gate; its 14 non-authored languages are
AI-drafted and need a native review like the rest of the app copy.

## Themes and categories

Circles are suggested only from **authored** themes (`circlesForTheme`) and a
plan's `primaryCircle` — `lib/circleContext.js` `suggestedCircle({ circle,
themeId, plan })`. A person's own labels are never interpreted. A suggestion only
preselects; the person can change or clear it, and nothing saves until they do.

## Plans

`primaryCircle` and `circles` are optional on a `PLANS` entry; the category stays
(category = what kind of journey; circle = where it shapes prayer). Mapped today:

| Circle | Plans |
|---|---|
| My heart | identity21, fruit10, holySpirit21, freedom30, david12, wisdom42, zechariah10 (+ people, household, kingdom), manOfGod21, womanOfGod21 |
| My house | marriage30, covenant21, children21, unborn21, prodigal30 (+ people) |
| My people | unbelievers30 (+ kingdom), others30 (+ household, nations) |
| His Church | churchHurt21 (+ self) |
| Kingdom & Mission | kingdomCome14 (+ church, nations) |

Not mapped yet (a human call): fast3, altar7, gratitude7, upperRoom10,
breakthrough21, preparing21, discernment28, work21, psalms42.

## Roadmap

| Milestone | Contents | Status |
|---|---|---|
| A — circles become real | Foundation; interactive landing circles with the short panel and a CTA into the guest prayer; circle row in prayer creation; Journal "By circle"; change circle on prayer detail; light Today | In progress (2026-10-07) |
| + | My heart's deep layer as a gated draft | In progress |
| B — circles become formation | Deep layers for the other six; Plans "Browse by circle"; plan completion → "What do you want to keep carrying?"; "Pray through my altar" | Later |
| C — circles become intercession | Carry a community prayer into a personal circle (needs the privacy decision above); circle context in Tend and testimonies | Later |
| P4 | Your Altar overview; optional weekly intercession rhythm; Grow → Intercession hub; monthly reflection | Later |

Explicitly never: circle scores or percentages, circle streaks or badges,
automatic or AI classification, mandatory circle selection, automatic migration
of old prayers.
