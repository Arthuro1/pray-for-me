# Changelog

This project follows Keep a Changelog. Every production release gets an
immutable signed tag and records user-visible, security, migration, compatibility,
and rollback notes. Unreleased entries are moved into a dated version at release.

## Unreleased

### Changed — Today as one altar card; a warmer FAQ; two lines removed

- **Today** drops the "Your altar today" eyebrow: the deep-violet card says it.
  The card now has a soft gold glow rising from beneath, a gold context line,
  the prayer's circle (or plan) mark beside its title, an incense line that
  rises once into place, and a faint violet edge that holds it apart from the
  dark theme.
- **A prayed day rests in the same card**: "{n} prayers today", then
  "Your prayers for today are before God." (was "You have prayed through what
  you planned for today", which read like a to-do list), Remain with God, Pray
  again and the next reminder.
- **"Prayed today" and "Return to prayer"** sit in one soft panel, a row each
  with an icon and a count pill; opened rows show each prayer's mark. The
  `Disclosure` primitive takes an optional `icon` for this row form.
- **The verse of the day** is a Scripture card: a gold quotation mark, larger
  serif text, the reference and Share in one footer row.
- **Landing FAQ**: each question has its own icon tile; on wide screens the
  heading and a new intro line sit beside the list; answers open with a short
  rise.
- **Removed:** the landing hero's "No account needed…" line (`heroReassurance`)
  and the About page's "What Qetoret will never do" section with its privacy
  line (`aboutPromisesTitle`, `aboutPromiseVoice|Outcome|Rank|Ai|Private`), and
  `altarTodayTitle`.
- Keys: `todayCompleteTitle` reworded, `todayPrayedCount_one|other` new (app
  ×16); `content.faqIntro` new (landing ×16). New wording is AI-drafted in 15
  languages and needs a native pass. No SQL, no server change.

### Changed — the landing page tells Zechariah's story (`docs/QETORET_IDENTITY.md` §2)

- **One story, top to bottom**, beside the app that serves each step: the
  Hebrew name קְטֹרֶת and "Let your prayers rise." with the real Today; **Come**
  (the name and access through Christ, as on About); **Bring**; **Carry** (the
  seven circles, now on circle-tone tiles); **Together** (a group wall with the
  real Carry gesture); **Return · Listen** (rhythms, a plan, Remain with God);
  **Remember · Respond** (carried since…, a testimony, a faithful next step).
  It closes on the seven movements.
- **The author's letter** is on the public page, folded after its first
  paragraph, in the About page's exact words (a guard test keeps them equal;
  the brand guard exempts the letter there too, since it names the old app).
- **Removed:** the four-movement row and "How it works" (they said the same
  thing twice), "Why Qetoret?" (now the Come cards), the folded feature grid
  (now an always-visible facts strip) and the AI Scripture-suggestion band
  (now one FAQ answer: AI never speaks for God). FAQ adds "Is Qetoret a social
  network?" and "Which churches is Qetoret for?".
- Landing locales rebuilt ×16 (`movements`, `come`, `bring`, `together`,
  `rhythm`, `remember`, `letter`, `facts`); strings the app already had are
  reused verbatim. New wording is AI-drafted in 15 languages and needs a native
  pass. No SQL, no server change.

### Changed — a quieter altar: prayer first, circles as a quiet layer (`docs/INTERCESSION_CIRCLES.md`)

- **Today** no longer lists your circles with prayer counts, and no longer names
  a circle on the hero or the rows. It shows what to pray today; the Journal's
  "By circle" view is where prayers are found by circle.
- **Writing a prayer** no longer shows seven circle chips under the prayer. One
  quiet row — "Intercession circle · Not set" — opens onto the circles when
  tapped and folds again after a choice. Coming from a circle still preselects
  it. New keys `circleFieldLabel` (was `journalCircle`) and `circleNotSet`;
  removed `circleQuestion`, `circleQuestionHint`, `placeOnAltarHint`.
- **Journal** has one circle-oriented way to find prayers: "By circle". The
  Circle selector in Journal filters is gone, and "By circle" now also works on
  Answered prayers (without the add button), so answered prayers are still
  remembered by circle.
- **Plans** are browsed by what they are for. The seven circle doors moved
  from the top of the catalogue into one folded "Explore plans by circle" row
  after it; catalogue rows no longer name a circle; a plan's details say only
  "Forms prayer in …" (key `planAlsoConnects` removed; `exploreByCircle`
  reworded in all 16 languages).
- **Carry this prayer** is one action. The quiet "Place on your altar" link
  beside Carry on group walls and request pages is gone; instead the "Added to
  the prayers you're carrying" confirmation offers "Choose a circle" (new key
  `carryChooseCircle`). The group's wall never shows the carrier's circle.
  Privacy is unchanged: the circle is still written only to the carrier's own
  encrypted copy. Removed keys `carryPlacedIn`, `placeOnAltarLabel`.
- **Prayers you're carrying**: the source switch and the circle chips moved
  behind one "Filter" (new key `filterLabel`), so praying needs no setup.
- **A prayer's page** names its circle once: one quiet row under the prayer
  ("◉ My people ›" or "Intercession circle · Not set ›") that opens the picker,
  which also leads to "About My people". The circle eyebrow above the title and
  the separate "Change circle" / "Place in a circle" link are gone (keys
  `changeCircle`, `placeInCircle` removed, with the now-unused
  `altarCirclesLabel` and `altarTodaySub`).
- **Circle teaching (drafts, EN + FR source; 14 overlays re-drafted):**
  - My heart: "As we carry others in prayer, God also forms us…" replaces
    "Before we carry the world in prayer, God forms the one who carries it",
    which implied one must be formed enough before interceding. Galatians 4:19
    leads its references. The deep layer reads "God's gracious work in you,
    received by faith and lived out in obedience".
  - His Church: "Pray for her unity, holiness, leaders, healing and mission,
    and bring what is wrong into the light with truth and love." Prayer is no
    longer set against criticism, which could silence people harmed in a church.
  - Authorities: "Pray for leaders across political lines… rather than partisan
    victory" replaces "never for a party or a candidate" (praying for a
    candidate as a person is fine).
  - Kingdom: "Is there a faithful step you can take…?" replaces "Could God be
    inviting you…?" — the app never presumes to know what God is saying.
  - Policy sentences ("Qetoret never…", "no app can confirm…") moved out of
    devotional prose; a contract test now keeps them out.
  - Calls to pray use ordinary verbs: "Pray for my household", "Pray for a
    nation", "Pray for someone".
- **Altar / carry / circle vocabulary** in all 16 languages: "Pray for
  everything on my altar" (was "Pray through my altar" / "Prier mon autel
  cercle par cercle" / "Meinen Altar Kreis für Kreis beten"), "You have brought
  everything on your altar before God", "What would you like to keep praying
  about?", "Where would you like to place this prayer on your altar?", "Your
  prayer altar is taking shape", "What would you like to do with this prayer
  now?". German: "Meine Nächsten" for the third circle. The vocabulary
  hierarchy is documented in `docs/content/CHRISTIAN_TERMINOLOGY.md`.
- The "Where does this prayer belong on your altar?" card opens the composer
  with the circle row already open (someone who came to organize sees the
  circles at once). A group request's author line is a `div`, not a `p`, so
  its avatar no longer nests a block inside a paragraph.
- **AI consent says it once.** The consent dialog had four overlapping texts
  (a posture paragraph, "What we send…", "To suggest… we send…", and "Your
  prayers remain private" — misleading, since the title is sent). It now has
  one posture line (a study aid, not Scripture; the AI cannot know God's will
  or speak for Him), one accurate data line (the title goes to Claude by
  Anthropic; details and the latest update only if included; the exact text
  is shown before the first request), and "You can withdraw this anytime in
  Settings." Key `aiConsentNoticePrayer` removed; `aiPostureFull`,
  `aiConsentBodyPrayer`, `aiConsentFooter` rewritten in 16 languages.
- **Short-layer translations are marked as drafts.** The 14 AI-drafted
  languages of the circle teaching now carry a visible "Draft translation"
  label (landing panel and circle pages) until a named native reviewer signs
  `CIRCLE_TRANSLATION_REVIEWS` (`content/intercessionCircles/review.js`). All
  14 are `machine-draft`; nothing was marked reviewed.

### Added — Intercession Circles, Milestone C: carry onto your altar (`docs/INTERCESSION_CIRCLES.md`)

- **After "Carry this prayer"**, a quiet "Place on your altar" follows the
  button — on a group wall right after carrying, on the request's own page
  whenever it is carried. It opens "Where would you like to carry this on your
  altar?" with the seven circles, and says only the carrier ever sees it.
  Carrying itself stays one tap and never waits on it; once placed, the link
  names the carrier's circle. The circle is the carrier's relationship to the
  prayer — the author's mother may be the carrier's "My people" — so it lives
  on the carrier's own encrypted copy and is never copied from the author or
  shown to the group.
- A carried request's own page in the Journal can now be placed or moved like
  any other prayer.
- **Prayers you're carrying** gains a quiet circle filter once carried prayers
  sit in different circles; it narrows only what the time of prayer walks.
  Group walls are not filtered by circle.
- Remember: answered prayers and testimonies keep their circle in the
  Journal, and the circle filter works on answered prayers. Tend your altar
  already led with the circle.
- 3 new keys × 16 languages (14 AI-drafted, need a native pass):
  `carryCircleQuestion`, `carryCircleHint`, `carryPlacedIn`.

### Security — carried group requests are encrypted (`docs/ENCRYPTION.md`)

- "Carry this prayer" used to save the carrier's copy of a group request with
  its title, description and prayer points in **plaintext**, even when the
  group's original is end-to-end encrypted. The copy is now stored under the
  carrier's account key, like their own prayers, with fresh point ids. No
  schema change.
- The vault migration (Privacy center) now also counts and encrypts copies
  carried before this release, so the "still unprotected" count may rise once
  for people who carry group prayers.
- A row a device cannot decrypt is never re-encrypted from its redacted
  placeholders — not by an edit, saved Scripture guidance or the device cache —
  and a locked carried copy no longer receives the group's text in memory.
- Compatibility: older clients read encrypted copies the same way they read any
  encrypted prayer. Rollback: a previous build would show encrypted copies but
  write new carries in plaintext again; no data needs reverting.

### Added — Intercession Circles, Milestone B (`docs/INTERCESSION_CIRCLES.md`)

- **A page for each circle inside the app** (`/circles/:circleId`,
  `src/pages/CirclePage.jsx`): the circle's teaching as a doorway into prayer,
  the seven circles as a switcher, and "Go deeper": the plans that shape prayer
  in that circle, from authored metadata only (`plansForCircle`). Opened from
  the Plans page, the Journal's circle headings (coming back reopens "By
  circle") and a prayer's circle. "Pray this" opens the composer in the circle
  with the prompt shown above the empty field — never written into it, never
  saved.
- **Plans: "Explore by circle"** beside the journey types; each plan row names
  its primary circle in one quiet line, and a plan's details say where it forms
  prayer ("Also connects with …" for the others).
- **Every plan now has a circle**: fast3, altar7, gratitude7, breakthrough21,
  discernment28, psalms42 → My heart; preparing21 → My heart (+ My house);
  work21 → My heart (+ My people, Kingdom); upperRoom10 → His Church
  (+ Kingdom). Metadata only, no plan text changed.
- 5 new app keys × 16 languages (14 AI-drafted, need a native pass).
- **Deep teaching for the other six circles** (`deep/household.js`, `people`,
  `church`, `authorities`, `nations`, `kingdom`): meaning, each theme with a
  short teaching, Scripture references and "Pray this" prompts, and reflection
  questions — English and French, English elsewhere. All seven are drafts
  behind the review gate (visible only in development or `?planPreview=1`) until
  a named human signs theology, safety, English and French. Each circle's
  guardrails are pinned by the contract test (forgiveness never requires staying
  in harm's way; nonpartisan Authorities; no nationalism; no domination; revival
  never promised).
- `loadCircleDeep` no longer resolves an inherited key such as `toString` as a
  circle.

### Changed — a finished plan asks "What do you want to keep carrying?"

- The completion card no longer creates prayers with pre-written titles from a
  checklist. It offers themes — the plan's own, or its circle's — and choosing
  one opens the composer in that circle with the theme above an empty field;
  the person writes the lasting prayer. They can come back for another.
- 2 new keys × 16 languages (14 AI-drafted); `planContinueHeading`,
  `planContinueCta` and `planContinueAdded` removed (no longer used).

### Added — "Pray through my altar"

- An optional order for a time of prayer, under the prayer formats: today's
  prayers circle by circle, from My heart out to Kingdom & Mission, then
  "Also on your heart". Off by default, remembered on the device; works with
  every format. A guided plan run without its own circle is prayed in its
  plan's circle (shown only, never saved). Each circle opens with a quiet
  threshold — its name and its call — without an extra step, and the time of
  prayer ends "You have carried your altar before God.", never with a count.
- 5 new keys × 16 languages (14 AI-drafted).

### Added — Intercession Circles, Milestone A (`docs/INTERCESSION_CIRCLES.md`)

- **One canonical circle model** (`src/lib/circles.js`): definitions derived
  from the seven stable ids, read-time `normalizeCircle` (an unknown value is
  read as unplaced and never rewritten), `circlesWithin` for the ring art, and
  `planCircles` for optional plan metadata.
- **Circle teaching as content, not components**
  (`src/content/intercessionCircles/`): a short layer per circle (formation
  statement, heading, summary, themes, Scripture anchors, call to pray) and
  My heart's deep layer (meaning, Qetoret's seven foundations, the fruit of the
  Spirit, prayer prompts, reflection). References only; the contract test
  rejects quoted Scripture.
- **Review gate for deep teaching** (`src/lib/circleReview.js`): a deep layer
  is a draft, visible only in development or review mode (`?planPreview=1`),
  until a named human signs theology, safety, English and French.
- **Plans carry optional circles** (`primaryCircle`, `circles`) beside their
  category; 18 journeys mapped, the rest deliberately left for a human call.
- **Suggestions only from authored themes** (`src/lib/circleContext.js`); a
  person's own labels are never interpreted.
- **Privacy guards** extended: the circle survives the load path, the device
  cache and offline replay without ever becoming a column, and changes
  independently of labels and rhythm.
- **Landing: the circles become a doorway into prayer**
  (`src/pages/landing/LandingCircles.jsx`). The rings and the list are one
  control: hover or focus previews a circle's reach (Nations lights My heart …
  Nations), choosing one opens its teaching beneath — heading, formation
  statement, summary, themes, three Scripture anchors and a call to pray —
  with a short fade between circles and a one-time outward ring reveal
  (reduced motion: none). Generous invisible hit bands on the rings; the list
  stays the accessible control. Teaching in all 16 languages (14 AI-drafted
  overlays, needs a native pass); `components/circles/CircleTeaching.jsx` is
  shell-independent for later reuse in the app.
- **Scripture on the landing page** opens in place: the app's reader is loaded
  only on the first tap (no Supabase before it) and resolves text through the
  usual pipeline, else links to the reader's Bible. Chapter and verse are kept
  left-to-right inside Arabic and Persian. `VerseAccordion` gained
  `defaultExpanded`, and a lookup abandoned on a StrictMode re-mount now runs
  again instead of leaving the panel idle.
- **The circle travels into the guest prayer**: the composer asks the circle's
  own question (`circlePrompt_*` ×16), shows a "Pray this" prompt above an empty
  field, and keeps the circle inside the encrypted guest draft so the imported
  prayer lands in that circle after sign-up. Analytics record only that a
  circle was opened or prayed from (`source`), never which.
- My heart's deep layer (seven foundations, the fruit of the Spirit, reflection)
  shows in development and review mode with a "review pending" label, and
  nowhere else until signed. `check:content` now audits circle content; its
  deliberate English fallback for the deep layer is baselined.
- **Prayer creation asks "Where are you carrying this?"** right under the
  prayer's own words — a quiet row of the seven circles (shared chips),
  optional, pressed again to clear — instead of inside Organize. Opened from a
  circle, the circle is preselected and its question frames the empty field.
- **Journal "By circle"**: once a circle is in use, the active prayers can be
  grouped inner to outer (unplaced last as "Your prayers"), each group with a
  plain count and a way to bring a prayer straight into it; rows under a
  circle heading don't repeat it. Combines with the circle filter from Today.
- **Prayer detail**: the circle leads the hero in gold with its glyph, before
  who the prayer is for; "Place in a circle" / "Change circle" changes only the
  circle (rhythm, labels and history untouched). Labels become one quiet line
  ("Marriage · Healing") instead of coloured pills.
- New strings ×16 (`circleQuestion`, `circleQuestionHint`, `journalByCircle`,
  `addToCircle`, `changeCircle`, `placeInCircle`), AI-drafted beyond en/fr/de.

### Changed — Qetoret design system ("Modern Royal Priesthood")

- **One token layer** (`src/styles/tokens.css`): alabaster, royal violet,
  temple gold and ink, with a dark theme of its own (not an inversion). Every
  legacy colour token (`--plum`, `--accent`, `--text-1…3`, the night theme, the
  constellation and landing palettes) now resolves to purpose tokens (`--q-*`);
  purple used as text gets an AA-safe twin in dark mode. Gold `#B68A45` and
  the quietest gray fail AA as text, so each has a darker text token.
- **Primitives** (`src/styles/components.css`, `components/shared/Primitives.jsx`):
  three button kinds only (primary / secondary / quiet), page and section
  headers, prayer rows, status labels, one modal, sheets, fields, circle
  options, Scripture blocks. Four radii (10 / 14 / 20 / pill), one elevation
  for overlays only, no gradients, no blur, a 4px spacing scale and one rise
  motion that respects reduced motion.
- **Two type voices:** the multilingual sans for software, and **Newsreader**
  (SIL OFL, self-hosted in `public/fonts/newsreader/`, precached) for prayer
  titles, Scripture and reflective copy.
- **Constellation removed:** the sky images (`public/assets/constellation/`),
  star glows and blurred skies are gone; the landing page wears the product
  tokens. Navigation is flat (hairline, no floating bar), the active item is
  purple with a 2px gold line, and counts are royal purple, not alarm red.
- **Fixes found on the way:** signing out no longer throws before clearing
  local data (a merge dropped `clearAiEphemeralState`); AI prayer points are
  cached again; the "review what's sent to the AI" step renders again, with its
  strings restored in all 16 languages.
- **New logo** (`docs/BRAND.md`): an elegant serif Q, open at the top, with
  gold incense rising through it, redrawn as plain vector strokes from the
  approved reference; Cormorant-based wordmark, lockups, monochrome and a
  small-size cut, all generated from one master geometry (`npm run
  build:brand`). App icon on `#3A2D5C`; favicon, PWA, Android launcher, splash
  and store icons regenerated; theme colours updated (manifest, page, TWA). In
  the app the mark is drawn inline and recolours for dark mode; loaders show
  the incense rising. **Android:** the new launcher icon ships with the next AAB.
- **The four core prayer screens as one book** (`src/styles/prayer.css`):
  - *Today* — date and greeting, "Your altar today" in gold, then one
    deep-violet focus surface (one prayer, "Begin prayer", a faint Rise line);
    the other prayers as flat rows; "Prayed today · N" folded; the circles
    carried as a quiet list; a completed day is a calm status, not a green
    card; an empty day is one Rise Mark and "Begin with what is on your heart."
  - *Prayer session* — an immersive deep-violet space (`.q-immersive` remaps
    the tokens, so plan days, notes and Scripture inside it just work): close,
    sound, prayer mode and progress on one gold line; each prayer rises in;
    no emoji, no chips; it ends with the Rise Mark, Amen, "You have prayed
    through today's altar", Remain with God and Finish.
  - *Journal* — editorial rows (title, rhythm or "Carried since…", circle,
    a green "Answered"/"Testimony" mark — never struck through); people view
    and Tend entry as rows; quiet labelled tools.
  - *A prayer's page* — reads like a document: context line, large serif
    title, carried-since, Pray now, then sections divided by hairlines; ways
    to pray, updates and testimonies are no longer boxed; a testimony keeps
    a gold rule.
- **The altar and intercession** (`src/styles/altar.css`):
  - *Circle picker* — the pill wall becomes seven deliberate choices (one
    column on phones, two on wider screens): a circle glyph, the circle's
    name and what it holds ("Family and household"…). The glyph is a gold
    point for the heart and one ring that widens a step from "My heart" to
    "Kingdom & Mission" — breadth, never rank; chosen, it fills with violet
    around the gold point. The same glyph marks the circles on Today.
  - *Bring a prayer* — the prayer form uses the shared fields and buttons:
    serif title field, quiet "Add a note" / "Organize" rows, no tinted box.
  - *Tend your altar* — one prayer at a time instead of a list of buttons:
    its circle, a large title, "Carried since…", the question "How would you
    like to carry this now?", then Continue carrying, Something has changed,
    Record a testimony and a quiet Release from my rhythm; then the next.
  - *Carry this prayer* — one Qetoret gesture: the Rise Mark lifts once and
    the button settles on "Carrying" (no heart, no burst). On a group
    prayer's page it sits in an open section with a few faces and the count,
    kept secondary; Follow became a quiet bell beside it.
  - New strings ×16 (flagged for native review): seven circle descriptions,
    `tendSub`, `tendQuestion`, `carryingLabel`; `tendIntro` and
    `carryingThisPrayer` removed.
- **Together — a shared place of intercession, not a feed** (`src/styles/together.css`):
  - *Hub* — no hero card: "Together", then only what needs a decision
    (requests and invitations as rows with Reject / Accept), "Prayers you're
    carrying" as an open section (one Pray shared requests, a quiet line
    once prayed, the full list behind a disclosure), groups and people as
    rows. An empty Together is one invitation (Rise Mark, Join, Create, Add a
    friend) — the old white-on-light "Add friend" text is gone.
  - *A group's page* — back link and ⋮ as quiet controls, group name in the
    serif, plans "praying together" as rows, Requests / Testimonies as a
    segmented control, status filters as quiet toggles.
  - *Requests* (`GroupPrayerRow`) — who asked, the request in the serif, two
    lines of context, then **Carry this prayer** right on the row (the same
    act as on the prayer's page, it joins "Prayers you're carrying") and the
    count kept secondary ("8 carrying"); answered requests say "Answered" and
    are no longer struck through; no star beside every title; member text
    keeps its own direction in RTL.
  - *Testimonies* — remembrance with a gold rule: the prayer it answers, the
    testimony in the serif, who and when; no 🎉, no 📎 emoji, no coloured
    category chips.
  - *Testimony on a prayer's page* — a gold "Remember" label over "What
    happened?" in the serif; the composer writes in the serif too; "Add a
    word of thanks" lost its 🙏.
  - *Sharing* — the share dialog, its preview and the group dialogs (create,
    join, add a friend, members, manage) use the shared dialog, fields,
    buttons and a new `Checkbox` primitive; member lists are rows; share
    targets are one neutral family of round buttons with accessible names
    (no brand colours); the ⋮ menu is a quiet surface with 44px items.
  - New key `rememberLabel` ×16 (from each locale's existing "Remember"
    movement). `community/ui.js` style constants removed with their last use.
- **Formation — plans, Grow and Scripture read like a book** (`src/styles/formation.css`):
  - *Scripture* — one gold reference style and one opened-passage panel (gold
    rule, serif text, edition, link to the chapter) everywhere; "Begin with
    God's Word" lost its Sparkles.
  - *Plans* — the catalogue is editorial rows (serif title, duration, a thin
    gold line for progress) instead of emoji tiles; a plan before it begins
    reads as a page (serif introduction, its days as rows); "plan begun" is a
    calm status, not a green card.
  - *A plan day on its prayer page* — no longer a card: the day opens on a
    hairline with "Day 4 of 21", round arrows and the day's theme in the
    serif; past days show what was prayed and written as a quiet rule;
    "Make this plan your own" and the pace sit with the day; the pace editor
    opens in place with no box inside a box.
  - *Grow* — Pray / Learn as a segmented control, rows instead of emoji cards;
    the readers share one layout, and pray-through guides open in the
    deep-violet prayer space and end on the Rise Mark.
  - *Plan guides and completion* — boxes became inline-start rules, choices
    use the circle option.
  - *Sharing a plan or a verse* — the share sheet, the invitation panel, the
    image panel and the verse dialog use the shared dialog, rows, checkboxes,
    fields and three buttons; the link is one copyable line; the QR code
    stays dark on white in both themes; "Make this plan your own" asks its
    questions as choice rows, growth areas as chips.
  - *Share art* — verse and plan cards and plan link previews drop the
    starry sky for flat deep violet and the Rise Mark (`cardRise.js`);
    `public/og/plans` regenerated; the public shared-plan page lost the
    constellation.
  - Scheduler rows (`RadioRow`, `DisclosureRow`) and the shared `Disclosure`
    now come from the system (tokens and classes, no inline colours), so the
    rhythm question looks the same in every form.
  - No new strings.
- **Utility screens — software that still belongs to the prayer book** (`src/styles/utility.css`):
  - *More* — four destinations as rows (icon, name, what is behind it); the
    duplicated eyebrow is gone.
  - *About Qetoret* — sections divided by hairlines with serif headings;
    references are gold Scripture links to the reader's own Bible; the seven
    circles are listed with their circle glyph instead of pills.
  - *Settings* — the profile as a plain line (photo, name, email, member
    since); five collapsible sections as hairline rows with serif titles
    (each heading now wraps its button, as an accordion should); the cards
    inside became flat groups; theme and "a few per day" are segmented
    controls; notification previews use the shared choice rows; every button
    is one of the three kinds, and deleting the account is a quiet red
    outline instead of a filled slab. Donate is no longer green (green is
    kept for answered prayer).
  - *The verse under Settings* — the footer used to quote James 5:16 from
    our own translation files in 16 languages; it now shows the reference,
    and opening it fetches the words from the reader's Bible through the
    verse pipeline. The `motto` string is removed from every locale.
  - *Notifications* — the inbox and the bell's panel are rows, not tinted
    cards: unread is a weight and a royal dot; the empty inbox is the shared
    calm empty state; the panel is the shared sheet. The bell is a 44px
    control (it was 32–36px) and its count sits at the inline end in RTL.
    Notification preferences use the shared switch (the old one had no
    switch semantics), fields and rows.
  - *Shared controls* — `Switch` draws from classes and now moves its knob
    the right way in Arabic and Persian; navigation items, tabs and counts
    in the app shell moved from inline styles to classes.
  - *Sign in* — the logo, one line — "Come before God. Carry what matters."
    (replacing a quoted verse, 1 Thess. 5:17, written into our translation
    files; drafted in all 16 languages, needs a native read) — then one clean
    sheet: Log in / Sign up as a segmented control, Google as a secondary
    button, fields with their icon inside, one primary action, quiet text
    links. About 250 lines of `constellation-auth` styling are gone.
  - *Emoji* — the decorative 🙏 / 🔒 at the end of 15 messages (toasts, the
    privacy line, the test notification) are removed in every language.
  - *The vault and the account key* — the locked vault, "we can't unlock your
    prayers here" and "can't check right now" share one calm full-screen
    layout (`AccountGate`): the mark, a serif heading, why the prayers are
    still safe, the one way forward, and the way out. The vault dialog uses
    the shared fields (passphrase fields now have names for screen readers),
    buttons and notices; inside the lock screen it no longer repeats the
    screen's own heading. The recovery-code reminder is the shared nudge;
    encrypted content this device can't open is said plainly with a rule,
    not a card.
  - *Dialogs* — Privacy Center, Feedback, Support the app and AI consent are
    the shared modal with a serif title; Feedback's and the inbox's
    hand-made toggles became the real switch; the PayPal option is plain
    text (no brand colours); the AI is introduced with a quiet royal rule
    and a message icon instead of sparkles; confirmation dialogs share the
    same title, text and actions.
  - *Toasts and errors* — toasts are a plain surface with the overlay
    elevation and rise in; an ordinary success is royal, not green; the
    error fallback uses the shared buttons.
  - *First prayer* — onboarding and the pray-first guest journey keep their
    alabaster page but now come from one set of styles (the leftover
    "constellation" overrides are gone); the save decision shows the Rise
    Mark instead of a feather in a bubble; "later" is a quiet button.
  - *Calendar* — the month sits between hairlines with the month name in the
    serif; arrows are named by the month they lead to; today is outlined and
    the chosen day is royal. Day marks no longer use amber, slate and cyan:
    a royal dot (a rhythm), a royal ring (once), gold (a Scripture plan) and
    a small square (a group day) — different shapes, not colour alone. The
    day's prayers are rows with a 44px "prayed" control that fills royal;
    the 🕊️ is gone. The prayer-chain calendar on a group request uses the
    same pieces and buttons.
  - *Answered* — the unused "gallery" behind the Journal's Answered view (it
    only ever showed its empty state) is replaced by that empty state alone.
  - *Forms and small surfaces* — the rhythm editor's fields, weekday toggles
    (filled and bold when chosen, not colour alone) and its one-sentence
    summary (a royal rule, not a tinted box); labels (the reader's own
    colours and emoji kept as chosen, around them rows, pickers and the
    three buttons); the photo crop; "your prayer is saved" (the Rise Mark
    for every save — the green check is gone); the AI "review what's sent"
    step (the outgoing text quoted on a rule, the include toggles as
    settings rows); the follow-up on a prayer's page (a quiet rule that
    turns royal when due, quiet actions); the iPhone install help.
- **The landing page on the same system as the app** (`src/styles/landing.css`):
  one brand from the first visit to the signed-in app — the page's private
  colour map and ~170 lines of `constellation-landing` styling are gone.
  Mostly alabaster with one deep-violet band (praying with Scripture); the
  header is the mark, theme, language and Sign in; the hero is "QETORET",
  the serif promise, Begin with a prayer / Sign in, and beside it the app's
  real Today — "Your altar today", one prayer in the deep-violet focus,
  Pray now, two rows — drawn with the app's own classes, not a phone
  mock-up. Bring · Carry · Return · Remember form one editorial row with
  hairlines and a line icon each (no tinted bubbles); the seven circles are a
  widening ring model in violet with the gold point and rising incense, and
  their list uses the app's circle glyph; the three steps are numbered in
  the serif; "Why Qetoret?" has room to breathe — gold eyebrow, the name
  explained in the serif, one Rise Mark, references beneath; the features
  are a quiet list (the per-feature colours are no longer used); the FAQ is
  rows. No new strings; the unused `stepLabel` is removed from the 16
  landing files.
- Nudges are quiet surfaces instead of gold cards; small-caps tracking is off
  for Arabic, Persian, Hindi, Amharic and CJK, where spacing breaks the words;
  the session's progress stays "1 / 3" in right-to-left languages.
- Dev builds only: `/__design` renders every primitive in light, dark and RTL;
  `/__design/today|journal|detail|session|bring|circles|tend|carry|together|group|plans|plan|plan-day|plan-share|plan-tailor|grow|guide`
  render the real screens with sample prayers and every store write (and the
  plan-share RPCs) stubbed out.

### Changed — Praystead becomes Qetoret

- **New name and identity.** The app is now **Qetoret** — *Let your prayers
  rise. Build a life of prayer before God.* New mark (superseded by the
  redrawn logo above), one "rise" motion that respects reduced motion.
  Product constitution:
  `docs/QETORET_IDENTITY.md`. Rename map: `docs/QETORET_MIGRATION.md`.
  **Compatibility:** internal identifiers are unchanged on purpose — `pfm_*`
  storage keys, the `praystead.com` domain and the Android package
  `space.praystead.twa` (a new package id would ship a new app, not an update).
  Only the Android launcher label changes.
- **Landing page** rebuilt around the movements Bring · Carry · Return ·
  Remember, the seven Intercession Circles and a short "Why Qetoret?" with
  Scripture references only (the quoted verses the old landing carried are gone).
  Guest-first is unchanged: no account before the first prayer.
- **Entry:** "What is on your heart? Bring it before God." The first saved
  prayer says "Your prayer altar has begun" and offers one step: choose a prayer
  rhythm.
- **Today is "your altar today":** "Begin prayer", a completed day without
  task language, "Return to prayer" instead of catch-up, and an optional
  "On your altar" row once circles are used.
- **Carry this prayer** replaces "I'm praying" (same permissions and data: the
  request joins "Prayers you're carrying"); the count is information, never a
  rank.
- **Answered prayer → testimony:** "What happened?", "Record a testimony", then
  one optional "Is there a faithful next step?" — private by default. The app
  never declares that God answered; it records that you did.
- **AI guardrails** extended in `api/anthropic.js` (never speaks for God, never
  promises outcomes, non-partisan prayer for leaders, authority under Christ).
  **Scripture fix:** the AI tasks no longer return verse wording, and the client
  discards any that arrives — Bible text only ever comes from the authoritative
  verse pipeline.

### Added

- **Intercession Circles** (My heart · My house · My people · His Church ·
  Authorities · Nations · Kingdom & Mission): optional "Place on your altar" in
  the prayer form and a Journal filter. Stored **inside the encrypted prayer
  payload** only — no schema change, never a plaintext column; old prayers stay
  under "Your prayers" and are never classified automatically.
- **Remain with God** — an optional quiet ending (30 s / 1 min / Finish) after a
  session and from a completed Today; no text, metrics or recommendations.
- **Carried since …** on a prayer's page, with a plain count of the days it was
  prayed (memory, never merit).
- **Tend your altar** — a gentle review of prayers that have rested 30+ days:
  continue carrying, something has changed, record a testimony, or release from
  my rhythm. Answers are device-local (`pfm_altar_tended_v1`, ids and dates only).
- **"Who else would you like to carry before God?"** — a last, once-only
  activation step after repeated use, for someone whose prayers are all their own.
- **A royal priesthood** prayer guide (first in Grow) and **About Qetoret**
  (More → About), both reference-only.
- **At the Altar: Learning to Carry Prayer** (`zechariah10`), a 10-day plan on
  Luke 1 — a **draft** awaiting a named reviewer's theology, safety and locale
  sign-offs (visible only in dev or with `?planPreview=1`).
- All new copy in 16 languages (EN/FR authored; 14 AI-drafted and flagged for
  native review — see the vocabulary table in
  `docs/content/CHRISTIAN_TERMINOLOGY.md`).

### Deploy notes

No migration. After the web deploy: redeploy `send-event-notifications` (push
title), rebuild the Android bundle with a bumped `versionCode`, run
`npm run build:plan-og`, and update store listing text and screenshots by hand.

- Drafted thirteen new guided plans, all held behind content review (visible
  only with `?planPreview=1` until a named human signs theology, safety and
  every locale): Identity in Christ, The Fruit of the Spirit, Intimacy with the
  Holy Spirit, Your Kingdom Come, Work, Calling & Faithfulness, Man of God and
  Woman of God under a new "Growing in Christ" category; Praying for Those Who
  Don't Yet Believe and Praying for a Prodigal; Praying for Children & the Next
  Generation and Praying for Your Unborn Child; Healing from Church Hurt; and a
  42-day study, Psalms: Learning to Pray Everything. Prose is authored in
  English and French, day and plan titles in all 16 languages (native review
  pending). Each plan has its own safety guardrail tests. New resource domains
  (`intercession`, `care`) and topics, study-day safety notes, and localized
  names for nine more Bible books. No schema change. See
  `docs/NEW_PLANS_2026-09-23.md`.

- Added "Preparing in Prayer", a 21-day guided prayer plan for single believers,
  under a new "Relationships & family" category on the Plan tab. It runs on the
  existing plan engine (one recurring prayer capped after 21 days), so Pray now,
  the prayer session, prayer notes and voice notes, completion, history,
  scheduling, reminders and offline all behave exactly as for any other prayer.
  Days carry a reflection, prayer prompts, an "also pray for yourself" mirror, an
  optional practice, related passages and — where a curator has approved any — a
  collapsed "Go deeper" shelf. Scripture is referenced, never authored or
  generated. The plan never promises marriage and stays valuable if the reader
  never marries. Optional, device-local onboarding (season, emphasis, an
  explicitly asked husband/wife question defaulting to "keep the plan general",
  and growth areas) only adds emphasis; the 21 days are identical for everyone.
  No schema change. See `docs/PRAYER_PLANS.md`.
- Added a curated external-resource catalogue and an on-device resolver behind
  "Go deeper", with a draft → needs_review → approved → retired review gate.
  Only approved entries with a verified edition in a language the reader
  actually reads are ever shown, locales are curated independently rather than
  translated from English, and no edition, URL or title is ever fabricated. The
  catalogue started as a curation worksheet and entries pass the gate one at a
  time; a day with nothing approved for it simply has no "Go deeper" section —
  the plan is complete without it. A new device-local "Resource languages"
  preference (Settings → Appearance & language) is the only way a resource in
  another language is ever offered. See `docs/RESOURCES.md`.
- Added cover thumbnails to "Go deeper" cards. An entry may name a cover file we
  host ourselves; where none exists — the normal case — the card draws a calm
  tile instead: the resource's type glyph on a tint seeded from its id, so a
  shelf reads as several covers rather than a list of lines. A thumbnail may
  never be hot-linked from a publisher or a retailer, because the request itself
  would tell that host the reader's IP and the subject they are praying about
  before they tapped anything; the resolver refuses anything that is not a
  same-origin path. Cover files are skipped entirely under Low data mode, and a
  missing or broken one falls back to the drawn tile rather than a hole.
- Added localized book names for Micah (`MIC`), so plan and teaching references
  to it render in all 16 languages instead of falling back to English.
- Added optional prayer-session notes: while praying for a request, a collapsed
  "Add a prayer note" action captures formatted text and/or a voice note for
  that request. Next commits the note as an ordinary entry in that prayer's
  update history (same encryption, offline mutation queue, rendering and
  edit/delete behaviour) and records the completion; Previous preserves the
  draft without committing it or marking the prayer prayed. Drafts are held on
  device as AES-GCM ciphertext under a non-extractable key, and a recording made
  offline is retried on reconnect. No schema change.

### Security

- Removed authenticated Supabase Workbox caching and purge legacy user caches.
- Added 128-bit versioned recovery codes and version 2 AES-GCM context binding.
- Made group key creation and removal/rotation transactional and retry-safe.
- Restricted AI to structured tasks with daily/global quotas and a kill switch.
- Unified development/production AI handling and redacted provider failures.
- Made community writes fail closed without a group key and retry incomplete
  member-key distribution.
- Added resumable migration of member-owned legacy community rows to AAD-bound v2.
- Prevented account-key generation when server encryption state is unavailable.
- Added community report/block/RLS controls and database write limits.
- Hardened profile ownership policies and replaced the owner-rights public-key
  view with an RLS-aware, authenticated-read-only projection.

### Operations

- Added deterministic Supabase migrations, schema tests, strict CI, governance,
  migration, rollback, backup, incident, and community-safety documentation.
- Repaired clean-install dependency ordering in the consolidated legacy baseline
  and expanded the database security suite to 16 pgTAP assertions.
- Pinned CI actions and Supabase CLI versions and added CodeQL analysis.
