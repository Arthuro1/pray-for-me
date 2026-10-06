# Changelog

This project follows Keep a Changelog. Every production release gets an
immutable signed tag and records user-visible, security, migration, compatibility,
and rollback notes. Unreleased entries are moved into a dated version at release.

## Unreleased

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
