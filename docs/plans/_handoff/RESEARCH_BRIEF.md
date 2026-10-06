# Resource research brief — Praystead "Go deeper" candidates, 2026-09-23

You are researching trustworthy external Christian resources for ONE new guided
plan in Praystead, a Christian prayer app. The repo is at
`C:/Users/T480s/Desktop/Ministry/projets/pray_for_me` (Windows; the Bash tool is
Git Bash — use forward slashes). Twelve other agents research the other plans in
parallel; **touch only your own two output files**.

**Nothing you add is approved.** Every entry is `status: 'needs_review'` with NO
`contentReview` / `safetyReview` fields. A human curator approves later. Your job
is discovery + rigorous verification + honest notes.

## Work economically and write incrementally (IMPORTANT)

A shared usage limit stopped a previous attempt before anything was written.
So:

- FIRST check whether your two output files already exist from an interrupted
  run; if so, continue from them.
- Create both output files early (valid, possibly short) and APPEND each
  verified candidate as soon as it is verified — never hold more than ~3
  verified candidates unwritten.
- Prefer fetching the one canonical page per edition over broad crawling; use
  search results to find the page, then open it once to verify.

## The plan now exists — match its real day topics

The curriculum for your plan is finished. Before searching, list the
`resourceTopics` its days actually use (`src/content/plans/<file>Days.js`, or
print it with `node docs/plans/_handoff/scripts/show-plan.mjs . <file>Days en`
after setting the env var `SP` to any scratch folder) and read
`docs/plans/<id>.md` §resource topics. A candidate reaches a day only if it
shares at least one of that day's topics AND the plan's domain. Tag
candidates with those topics (never with topics the plan deliberately avoids,
e.g. `wisdom-literature`/`david` on psalms42, or adult-couple topics on
children21/unborn21). If the Bash tool reports "command not found", use
PowerShell.

## Read first (only these)

- `docs/RESOURCES.md` lines 130–160 (entry model) and 240–290 (multilingual
  rules, never fabricate an edition)
- `src/content/resources/topics.js` — `RESOURCE_TOPICS`, `RESOURCE_DOMAINS`,
  `RESOURCE_PERSPECTIVES`, `RESOURCE_TYPES`, `LIFE_STAGES` (the only allowed values)
- `src/lib/resources.js` lines 35–60 — `SENSITIVE_RESOURCE_TOPICS`
- `src/content/resources/wisdomResources.js` for style (short)

## Deliverables — ONLY these two files

1. `src/content/resources/newPlans/<id>.js`:
   ```js
   // Candidates for <id>, researched 2026-09-23. NONE is approved: every entry is
   // needs_review with no sign-off, so the resolver never shows it. See
   // docs/resources/candidates/<id>.md for the verification worksheet.
   export const <CONST>_CANDIDATES = [ { …entry }, … ];
   ```
2. `docs/resources/candidates/<id>.md` — the worksheet (see below).

Do NOT edit `catalogue.js`, `topics.js` or anything else. If a topic you need is
missing, use the closest existing one and say so in the worksheet.

## Entry shape

```js
{
  id: 'keller-prayer',            // '<author-surname>-<short-title-slug>' or
                                  // '<ministry>-<slug>'; lowercase ASCII, hyphens.
                                  // Same work = same id across plans, so use the
                                  // most obvious author surname + first title words.
  type: 'book',                   // RESOURCE_TYPES
  originalLanguage: 'en',
  domains: ['christian-living'],  // your plan's domain (given in your task)
  topics: ['prayer', 'lords-prayer'],   // RESOURCE_TOPICS only, 1–5, precise
  lifeStages: [],                 // omit unless genuinely stage-specific
  perspective: ['evangelical'],   // RESOURCE_PERSPECTIVES, when clear
  status: 'needs_review',
  reviewLevel: 'sensitive',       // ONLY when sensitive (see below); omit otherwise
  description: {                  // Praystead's OWN one sentence: why it fits this plan.
    en: '…', fr: '…',             // Never a publisher blurb; no overstated certainty.
  },
  editions: {
    en: { title, author, publisher, url, available: true, lastVerifiedAt: '2026-09-23' },
    de: { … only if YOU verified this German edition on its own canonical page … },
  },
}
```
French descriptions use natural French ("tu" is not needed — descriptions are
neutral, e.g. « Un court livre qui… »).

## Verification (hard rules)

- OPEN EVERY URL you record (WebFetch, or the firecrawl scrape tool if a site
  blocks WebFetch). On the page itself confirm: title, author/teacher,
  publisher/ministry, resource type, language, availability.
- Canonical pages only: publisher, author, ministry, church, seminary/university,
  Bible society, recognised Christian organisation. NEVER retailers (Amazon,
  Fnac, Thalia, Christianbook…), affiliate links, pirated copies, scraped
  mirrors, random uploads. A ministry's own page for a specific video/podcast
  episode is fine; YouTube only if it is the ministry's official channel AND no
  page on their own site exists — prefer their site.
- **Never fabricate an edition.** Never translate a title and claim it exists;
  never invent an ISBN, author, publisher or URL; never construct a "probable"
  URL; never infer an edition exists because another does. A language key exists
  ONLY for an edition you opened and confirmed. If you believe a translation
  exists but could not verify its page, list it in the worksheet's
  "unverified leads" table — not in `editions`.
- `available: false` if the canonical page says out of print / unavailable
  (Shopify stores may show a bogus "sold out" to fetchers: `<shop>/products/<handle>.js`
  gives the real `available`).
- If you cannot verify ANY edition of a candidate, it goes only into the
  worksheet (unverified leads), not the JS file.

## Search scope

- **Target: 15+ verified candidates for your plan**, spread across types (books,
  articles, Bible studies, prayer guides, sermons/teachings, podcasts, videos,
  courses). Prefer free, high-quality resources where available. Praystead is
  not a bookstore.
- **All 16 app languages**: en, fr, de, es, pt, ru, zh (Simplified), ja, ko, ar,
  fa, hi, id, sw, tl, am. Localization is NOT "translate the English shelf":
  a German reader may get a German-authored resource, a Swahili reader an
  African-authored one, a Spanish reader a Latin American one — preferred over
  translations. Aim for at least one verified resource in as many languages as
  honestly possible; record which languages you searched and found nothing.
- Search several traditions where relevant (Pentecostal, charismatic, evangelical,
  Reformed, Anglican; Catholic/Orthodox only where clearly helpful and labelled),
  serious scholarship alongside accessible devotional material where the plan
  calls for it.
- Useful starting points (verify everything; these are leads, not approvals):
  BibleProject (many languages at bibleproject.com), Desiring God (EN + ES/PT
  pages), The Gospel Coalition and its international editions (Évangile21 FR,
  Coalición por el Evangelio ES, Coalizão pelo Evangelho PT), Ligonier (EN/ES/PT
  and others), Crossway, IVP, Zondervan, Baker, B&H, Lausanne Movement,
  Shepherds Global Classroom (many languages), Bible societies, Open Doors
  national sites, ERF / Evangelium21 / SCM Hänssler / Brunnen / Gerth Medien /
  Livenet / Jesus.ch (DE), TopChrétien / BLF / Éditions Clé / Farel / Excelsis
  (FR), Mundo Cristão / Editora Fiel / Voltemos ao Evangelho (PT), Portavoz /
  Unilit / Poiema / B&H Español (ES), Assemblies of God / Foursquare / Vineyard /
  Pentecostal seminaries for Pentecostal-charismatic material, African ministries
  and publishers (e.g. Hippo Books / Langham, Africa Bible Commentary), Asian
  and Middle-Eastern Christian publishers and ministries.
- Existing catalogue: before adding a work, grep `src/content/resources/` for its
  title/author. Do NOT re-add an existing id. List existing entries that fit your
  plan in the worksheet, with a proposal: "add domain `<x>` because …" or "fits
  already via domain `<y>`" — a curator decides; do not edit them.

## Sensitivity

Set `reviewLevel: 'sensitive'` (and use the matching sensitive topic where one
exists) for: pregnancy loss, infertility, severe pregnancy complications, abuse,
spiritual abuse, trauma, coercive leadership, sexuality, pornography, gender
authority / marriage authority / submission (topic `marriage-roles`), serious
family crisis, prophecy or guidance practices that could create coercion (topic
`prophecy`), severe spiritual-warfare claims, mental health. Sensitive topics in
`SENSITIVE_RESOURCE_TOPICS` raise the level on their own anyway.

## Reject (record in the worksheet with the reason)

Prosperity-gospel teaching; guaranteed healing, conversion or outcomes;
manipulative or pressure evangelism; fear-based spiritual warfare; commercialised
impartation or "seed" giving; unaccountable revelation claims; teaching that
disagreement with a leader equals resisting God; material that silences or blames
victims, discourages reporting abuse, or demands reconciliation/access with
unsafe people; teaching that reduces every departure from faith to rebellion;
generic positive affirmation disconnected from the gospel; sensationalism.
Also flag (don't necessarily reject) resources that present one side of a
disputed question (gender roles, Spirit baptism subsequence, tongues as initial
evidence, election) as settled — note it in theological notes.

## Worksheet — `docs/resources/candidates/<id>.md`

1. Header: plan, domain, date, "Researched with AI assistance. Nothing here is
   approved; every entry is needs_review."
2. Summary: counts (researched / entered / rejected / unverified leads),
   languages represented, sensitive count, languages searched with no result.
3. Main table, one row per entered candidate:
   `id | plan(s) | type | topics | domains | life stages | original language |
   title | author/teacher | publisher/ministry | canonical URL | verified
   languages | verification date | standard/sensitive | theological notes |
   safety notes | reason for inclusion | review status | outstanding human-review
   requirements`
4. Existing catalogue entries that fit (id, why, domain proposal).
5. Rejected candidates (title, author, URL if any, reason).
6. Unverified leads (title, author, suspected URL/edition, why unverified).
7. Gaps: languages/topics where nothing trustworthy was found.

## Sanity check before finishing

Run `node -e "import('file:///C:/Users/T480s/Desktop/Ministry/projets/pray_for_me/src/content/resources/newPlans/<id>.js').then(m=>console.log(Object.values(m)[0].length))"`
— it must print your entry count (the file must be valid standalone ESM with no
imports). Then check every topic/domain/type/perspective against topics.js and
every URL starts with https://.

## Final message to the integrator

≤ 200 words: counts, languages represented, sensitive entries, notable
rejections, existing catalogue entries you propose for this plan, gaps.
