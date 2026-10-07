# Intercession Circles

The seven circles are the widening breadth of a life of prayer: **My heart → My
house → My people → His Church → Authorities → Nations → Kingdom & Mission**
(theology: `docs/QETORET_IDENTITY.md` §5). They are reminders of breadth, never
levels, scores, achievements or progress. Nothing in the app counts how many
circles someone "has", ranks them, or nudges because one is empty.

This document is the map of how the circles are built. Read it before adding a
circle to a new screen.

**Prayer is primary; circles are a quiet organizing and formation layer.** Ask
of every screen: what did the person come here to do? If it is to pray, write
a prayer, remember a request, join someone in prayer, record an update or
choose a plan, a circle is at most a glyph and a short name, or one quiet
row, never a block of its own. The circle page is the one place where a
circle is fully taught. No counts that read like progress, no grids of
circles, no explanation repeated on task screens.

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
- A prayer that cannot be encrypted (account key unavailable, or a row this
  device could not decrypt) cannot hold a circle; the store drops it rather than
  leaking it.
- A **carried** group request (`community_origin_id`) is a copy in the carrier's
  own list, stored under the carrier's account key like any prayer of theirs, so
  it can hold the carrier's circle. That circle is the carrier's relationship to
  the prayer, independent of anything the author chose: it is never copied from
  the author, never written to a community table or RPC, and never visible to the
  group or the author.
- The app never classifies prayer text, never sends prayer text to AI to choose a
  circle, and never assigns a circle on the person's behalf.
- Analytics never carry a circle (`lib/analytics.js` has no such key).
- Guards: `src/store/noPlaintextLeak.test.js` ("the Intercession Circle never
  reaches Supabase in plaintext") covers add, edit, place/clear, no-key, invalid
  values, the load path, the device cache, offline replay, unknown values and
  independence from categories and rhythm; "a carried group request stays private
  to the carrier" covers the carried copy, its points and the carrier's circle
  (spec §154, a release blocker).

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

Every circle has a deep layer (Milestone B), all through the same contract and
the same UI (`CircleDeepTeaching`): no circle gets an architecture of its own.

Contract test: `intercessionCircles.test.js` (every circle present in order,
every field authored, unique theme ids, at least one valid Scripture anchor,
deep layer aligned with the short layer, no quoted Scripture, and each circle's
guardrails below pinned to its wording).

### Scripture

References only, with English book names that exist in `BOOK_NAMES`, one chapter
per reference (split `Ephesians 5:21–6:4` into two). Text is resolved at render
time by the Scripture pipeline. No quotation marks appear in circle content, so a
pasted verse fails the contract test.

### Theological guardrails for authors

- **Principle, not policy.** Devotional teaching states the spiritual
  principle positively ("Pray for leaders across political lines…"). What the
  app does or never does ("Qetoret never…") belongs in About, Privacy and Help.
  The only exception is the framework note below. Never presume to know what
  God is saying ("Could God be inviting you…"): ask about a faithful step
  instead. Guarded by "speaks the principle, not app policy" in the contract
  test.
- **Framework vs Scripture.** My heart's seven foundations are *Qetoret's*
  grouping of biblical practices. Say "Qetoret groups…", never "the Bible
  teaches seven…".
- **My heart is grace, not a precondition.** God forms us *as* we pray for
  others ("As we carry others in prayer, God also forms us"), never first, as
  if one had to be formed enough to intercede. Galatians 4:19 leads its
  references.
- **Hearing God.** Always pair listening with testing impressions against
  Scripture (and with wise believers); the app never confirms that God said
  something.
- **My house is formation, not fear.** A household is any home (a couple, a
  family, one person living alone). Forgiveness never requires staying in harm's
  way: where trust was broken by abuse, safety comes first.
- **My people: prayer does not remove responsibility.** It often leads to a
  practical act of love; reconciliation is sought where possible and wise,
  never by pretending harm did not happen.
- **His Church: pray, and never silence harm.** Praying for the Church brings
  what is wrong into the light with truth and love, before Christ. Prayer is
  never set against honest criticism ("pray more readily than you criticize"
  silences people harmed in a church).
- **Authorities and Nations are nonpartisan.** Prayer for leaders across
  political lines, seeking wisdom, justice, integrity and peace rather than
  partisan victory or a political outcome (praying for a candidate as a person
  is fine); no "taking authority" over a government; prayer for leaders we
  disagree with; no Christian nationalism; a person always chooses the nation
  they carry.
- **Kingdom is not domination.** Participation through prayer, witness,
  discipleship, mercy, justice, reconciliation and service; gospel and mercy held
  together; revival longed for, never promised or manufactured.
- **Grace, not performance.** Fruit is grown, not earned; no scores, no
  "completed" circles; reflection stays qualitative and is never stored.

### Review gate (deep layer)

`content/intercessionCircles/review.js` holds one record per deep layer;
`lib/circleReview.js` decides visibility. A deep layer is shown when its record
is `approved` with dated, named sign-offs for theology, safety and each authored
language (`en`, `fr`), or in a development build / review mode (`?planPreview=1`,
the same switch as plans), where it carries a "review pending" label. **Only a
named human writes a sign-off.**

### Review records (short layer translations)

The short layer ships in all 16 languages (the landing page must never mix
languages), but only English and French are authored. The other 14 are AI
drafts: `CIRCLE_TRANSLATION_REVIEWS` in the same `review.js` holds one record
per language, all `machine-draft`, and `CircleTeaching` shows a visible "Draft
translation" label (`ui.draftTranslation`, in every overlay) wherever
`isCircleTranslationDraft(lang)` is true — on the landing panel and on circle
pages. A native reviewer's dated, named sign-off
(`{ status: 'approved', reviewer, reviewedAt }`) removes the label for that
language. **Only a named human writes it**; `lib/circleReview.test.js` rejects
an "approved" record without a reviewer and a real date.

All seven deep layers are AI-drafted and `pending`. In the content audit
(`check:content`) their bundles are `needs-review` and their English fallback in
the other 14 languages is baselined as known `missing-copy` — findings, not
approvals.

## Surfaces

- **Landing** (`src/pages/landing/LandingCircles.jsx`): rings and list share one
  state (`selected`, `preview`; `active = preview ?? selected`). The list is the
  accessible control (buttons with `aria-expanded`); the SVG is `aria-hidden`
  with invisible hit bands. The panel is `components/circles/CircleTeaching.jsx`
  fed by `hooks/useCircleTeaching.js`. Scripture references load the app's
  reader on demand (`components/circles/ScriptureRefButton.jsx`). The call to
  pray opens the guest flow with `{ circle, prompt }` (`lib/guestPrayerContext.js`);
  the circle is kept in the encrypted guest draft and placed on the imported
  prayer.
- **Circle page** (`pages/CirclePage.jsx`, route `/circles/:circleId`): the same
  `CircleTeaching` (short layer; deep layer behind its review gate) with the
  circle's name as the page's `h1`, the seven circles as a switcher
  (`components/circles/CircleLinks.jsx`), and "Go deeper": the circle's plans from
  authored metadata (`plansForCircle`, primary circle first). Praying calls
  `openAddInCircle(circle, { prompt })`. The back link returns to the path in
  router state `{ from, fromState }` (Plans by default; only in-app paths).
  Opened from Plans ("Explore plans by circle"), the Journal's circle headings
  (which reopen "By circle" on return) and the prayer detail's circle sheet.
- **Prayer composer** (`PrayerForm.jsx`): `CirclePicker compact` is ONE quiet
  row beside "Add a note" and "Organize" — "Intercession circle · Not set" (or
  the chosen circle) — that opens in place onto the seven chips and folds again
  after a choice, returning focus to the row. Writing a prayer never means
  reading seven circles. Offered only when the prayer can be encrypted.
  `context={ circle, prompt }` (from `openAddInCircle` in `AuthenticatedApp.jsx`)
  preselects the circle and swaps the field label for the circle's question; a
  `prompt` shows above the EMPTY field as a starting point and is never saved or
  written into it.
- **Journal** (`PrayersTab.jsx`): "By circle" is the Journal's ONE
  circle-oriented way to find prayers — there is no circle selector in the
  filter sheet (`lib/journalSearch.js` has no circle filter). Offered once a
  prayer in the current segment (Active or Answered) has a circle; grouped via
  `groupByCircle`; per-group add (Active only) calls `onAddInCircle`; rows hide
  the circle (`PrayerListItem showCircle={false}`); the count beside each
  heading stays quiet meta text.
- **Prayer detail**: the prayer is the hero; its circle is ONE quiet row under
  it — "◉ My people ›", or "Intercession circle · Not set ›" — that opens
  `components/circles/PlaceCircleModal.jsx` (the full `CirclePicker` in a
  `Modal` portalled to `<body>`, saving `updatePrayer(id, { circle })`). Where
  the host can show circle pages (`onOpenCircle`), the dialog adds "About My
  people", the one way from a prayer to its circle's teaching. Where the
  circle cannot stay encrypted, a placed circle is plain text and an unplaced
  prayer shows nothing. A carried copy is placeable too, with the carrier's own
  question and "Only you see this — never the group or the person who asked."
- **Carry a group request** (`GroupPrayerRow`, `PrayTogetherCard`): carrying is
  ONE action, and the wall row and the request's page show only the Carry
  button — never the carrier's circle and never a second control. Right after
  carrying, the "Added to the prayers you're carrying" toast offers "Choose a
  circle" (`useCommunityPrayerActions`, 10 s), which opens the app-wide
  `components/circles/CarryPlacementHost.jsx` (`store/carryPlacementStore.js`,
  like ConfirmHost). It writes `updatePrayer(copy.id, { circle })` on the
  carrier's encrypted copy and nothing else; the author's circle is never
  copied (`communityToPersonalInsert`) and no community table, RPC or action
  sees it. Offered only when the copy can hold private metadata and is readable
  on this device (`canPlaceCarried`). Later, the copy's own page in the Journal
  places or moves it like any prayer.
- **Prayers you're carrying** (`components/IntercessionQueue.jsx`): praying
  needs no setup. One folded "Filter" (offered only when there is something to
  choose between) holds the source control and, once carried prayers sit in
  more than one circle (or one circle beside unplaced ones), the circle chips
  (`queueCircles`, `filterQueueByCircle` in `lib/intercession.js`); folded, its
  label names what narrows the walk. Group walls are never filtered by circle.
- **Remember**: an answered prayer keeps its circle — the row in the Journal's
  Answered segment names it beside "Testimony", the detail names it, and
  "By circle" works on the Answered segment. Nothing interprets
  why a prayer was answered, and a testimony shared to a group never carries a
  circle.
- **Plans** (`PlansTab.jsx`): plans are browsed by what they are for (the
  categories). After them, one folded row — "Explore plans by circle" — opens
  onto the seven doors to the circle pages, which list each circle's plans.
  Catalogue rows (`PlanCard`) name no circle; `PlanDetailModal` says once,
  quietly, "Forms prayer in …" (the primary circle only — the other circles a
  plan touches stay in its metadata, where they place it on those pages).
- **Plan completion** (`PlanCompletionCard.jsx`): "What would you like to keep
  praying about?" — the plan's own `continueThemes` if it has them, otherwise its
  primary circle's short-layer themes (so no plan needs new prose). Choosing one
  calls `onKeepCarrying({ circle, prompt })` → `PrayerDetail onPrayInCircle` →
  `openAddInCircle`: the composer opens in the circle with the theme above an
  EMPTY field. Nothing is created on the person's behalf (the old flow saved
  prayers with pre-written titles); they can come back for another theme.
- **Today**: no circles. Today answers "what am I bringing before God today?";
  the hero names who a prayer is for, never its circle, and the rows hide it
  (`PrayerListItem showCircle={false}`). The former "On your altar" list of
  circles with prayer counts was removed (2026-10-07): it duplicated the
  Journal's "By circle" view and read like a dashboard.
- **Pray through my altar** (`PrayerSession.jsx`, `lib/altarSession.js`): an
  optional ORDER for the session's requests, a switch under the prayer formats
  (composes with requests / guided / ACTS), off by default and remembered on the
  device (`pfm_prayer_order`). Offered only when there is more than one prayer
  and one belongs to a circle. Order: `groupByCircle(prayers, sessionCircle)` —
  inner to outer, each circle keeping the given order, unplaced prayers last
  under "Also on your heart". `sessionCircle` is the placed circle, else a plan
  run's plan `primaryCircle` (display only, never saved). The first prayer of
  each circle crosses a quiet threshold (Rise Mark, the circle's name, its
  short-layer heading) — no card, no extra step. A walk keeps the order it began
  with; a change after the first step applies next time. The switch reads "Pray
  for everything on my altar" and the end "You have brought everything on your
  altar before God." — never a count of circles.

## Themes and categories

Circles are suggested only from **authored** themes (`circlesForTheme`) and a
plan's `primaryCircle` — `lib/circleContext.js` `suggestedCircle({ circle,
themeId, plan })`. A person's own labels are never interpreted. A suggestion only
preselects; the person can change or clear it, and nothing saves until they do.

## Plans

`primaryCircle` and `circles` are optional on a `PLANS` entry; the category stays
(category = what kind of journey; circle = where it shapes prayer). Every plan
is mapped (asserted by `lib/circles.test.js`):

| Circle | Plans |
|---|---|
| My heart | identity21, fruit10, holySpirit21, freedom30, david12, wisdom42, zechariah10 (+ people, household, kingdom), manOfGod21, womanOfGod21, fast3, altar7, gratitude7, breakthrough21, discernment28, psalms42, preparing21 (+ household), work21 (+ people, kingdom) |
| My house | marriage30, covenant21, children21, unborn21, prodigal30 (+ people) |
| My people | unbelievers30 (+ kingdom), others30 (+ household, nations) |
| His Church | churchHurt21 (+ self), upperRoom10 (+ kingdom) |
| Kingdom & Mission | kingdomCome14 (+ church, nations) |

No plan has Authorities or Nations as its primary circle, and none touches
Authorities at all. That is deliberate: no plan is written only to fill a
circle. The Nations page lists the plans that touch it; the Authorities page
simply has no "Go deeper" section yet.

## Roadmap

| Milestone | Contents | Status |
|---|---|---|
| A — circles become real | Foundation; interactive landing circles with the short panel and a CTA into the guest prayer; circle row in prayer creation; Journal "By circle"; change circle on prayer detail; light Today | Done 2026-10-07 |
| + | My heart's deep layer as a gated draft | Done 2026-10-07 — awaiting human sign-off |
| B — circles become formation | Circle pages in the app; deep layers for the other six; Plans "Explore by circle"; plan completion → "What do you want to keep carrying?"; "Pray through my altar" | Done 2026-10-07 — all seven deep layers await human sign-off |
| C — circles become intercession | Carried copies encrypted under the carrier's key; carry a community prayer into the carrier's own circle; circle filter on "Prayers you're carrying"; circle context in Tend (since the redesign) and testimonies | Done 2026-10-07 |
| Declutter | Prayer is primary, circles a quiet layer: no circles on Today; one composer row; one circle view in the Journal; plans browsed by need; carry is one action (circle via the toast); one circle row on a prayer's page; teaching copy and altar/carry/circle vocabulary revised; short-layer translations labelled as drafts | Done 2026-10-07 — copy awaits native and theological review |
| P4 | Your Altar overview; optional weekly intercession rhythm; Grow → Intercession hub; monthly reflection | Later |

Explicitly never: circle scores or percentages, circle streaks or badges,
automatic or AI classification, mandatory circle selection, automatic migration
of old prayers.
