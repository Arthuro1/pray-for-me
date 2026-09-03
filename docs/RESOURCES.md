# The curated resource catalogue ("Go deeper")

A plan day may offer any number of relevant external resources — a book, an
article, a podcast, a teaching, a video, a study, a prayer guide. They sit at
the very bottom of the day in their own folded shelf. The collapsed header
carries the real total, and opening it reveals **the complete matched set** —
one tap, nothing held back.

**Nothing in this catalogue reaches a user until a human has verified and
approved it. Sensitive material also needs explicit content and safety
sign-offs.** These are resolver gates, not policy notes.

---

## An entry shows nothing until a human has approved it

`src/content/resources/catalogue.js` started as a **curation worksheet**. Some
standard entries had already passed editorial review before the relationship
plans were extended. Their editions use canonical publisher or ministry pages.
The English links were re-verified on 2026-08-26; eleven localized editions were
verified on 2026-08-28. A verified link is not a theological endorsement and
does not change review status.

Material involving marriage roles, submission/authority, purity, or sexuality
was moved back to `needs_review` and marked `sensitive`. Such entries remain
invisible until both named reviews below exist. Paul's 2026-09-03 approval of
resources associated with the four pending plans is documented below.
No localized title, edition, ISBN, author,
or URL was fabricated to fill a language gap.

The publication gate has not moved; entries pass through it one at a time. Until a curator
verifies an entry and flips it to `approved` (and supplies both sign-offs when
the entry is sensitive), the app shows **no "Go deeper"
section at all** — not an apology, not an empty state. `src/lib/resources.test.js`
asserts that an unreviewed entry resolves to nothing no matter what its editions
claim, and that every approved edition carries a verified URL.

Content approval and edition availability are separate checks. Three sensitive entries
(`piper-momentary-marriage`, `keller-meaning-of-marriage`,
`elliot-passion-and-purity`) once carried `approved` with no sign-offs, which
made them permanently invisible under an approval that was not true. Both
reviews now exist for each of them, so they publish. Tests reject sensitive
`approved` entries without both sign-offs. A verified available edition is
also required; approval by itself never creates a usable link.

That mistake has a mirror image, and it is just as quiet: an entry whose
sign-offs are recorded but whose `status` is missing entirely is dropped too, so
the curator's work reaches nobody and nothing says so. A second test requires
every entry to state one of `RESOURCE_STATUSES`.

### What actually reaches a reader today

As of **2026-09-03**, **89 entries are displayable**, subject to topic, domain,
life-stage and language matching. The catalogue contains 102 entries in total:
91 approved, ten awaiting review and one retired. Two previously approved
deliverance entries still lack verified URLs and therefore do not display.

Paul explicitly approved 36 additional associated resources, including the nine
David-study sources. Five more associated contents received both sign-offs but
retain `needs_review` because their current editions are unavailable. Existing
approvals, unrelated candidates and the retired entry are unchanged. See
`docs/CONTENT_APPROVAL_2026-09-03.md` for the exact scope and audit record.

Displayable editions now cover fifteen app languages: Amharic, Arabic, Chinese,
English, French, German, Hindi, Indonesian, Japanese, Korean, Portuguese,
Russian, Spanish, Swahili and Tagalog. Farsi still has no displayable edition.

The following table is the **historical relationship-language coverage snapshot
from the 2026-08-28 translation pass**, before these approvals, not today's
coverage totals. It counts days resolving at least one resource with only the
specified language enabled:

| Plan | days | ar | de | en | es | fr | id | ja | ko | pt | ru | zh |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `preparing21` | 21 | 3 | 17 | 17 | 16 | 14 | 5 | 10 | 5 | 15 | 5 | 6 |
| `covenant21` | 21 | 6 | 15 | 17 | 15 | 11 | 9 | 11 | 9 | 11 | 9 | 2 |
| `marriage30` | 30 | 21 | 27 | 29 | 23 | 25 | 22 | 22 | 22 | 23 | 23 | 0 |

The 2026-08-28 translation pass added eight verified editions, all of them of
titles the catalogue already carried in English: Gary Chapman's *The 5 Love
Languages* (German, Spanish, Portuguese) and its Singles edition (German,
Spanish, Portuguese), *Things I Wish I'd Known Before We Got Married*
(Spanish), and Cloud & Townsend's *Boundaries* (German). Each was checked on
the publisher's own product page — Francke, Editorial Unilit, Editora Mundo
Cristão, Editorial Portavoz and SCM Hänssler. Nothing was translated by us: a
language key exists only where a real edition was found.

Six legacy plans declare no `resourceTopics` on any day, so they never show a
"Go deeper" shelf in any language.

Only languages with a displayable edition are offered as additional Resource
languages. The app language is always tried automatically; English is selected
as an additional language for new readers and can be turned off.

Two multilingual studies now have both of Paul's sign-offs dated 2026-09-03:
Family Discipleship Ministries' *Marriage Is a Ministry* (English,
Spanish, Hindi, Swahili and Amharic), and Shepherds Global Classroom's
*Christian Family* (Simplified Chinese, Hindi and Tagalog). Both cover sensitive
subjects such as sexuality, intimacy or marriage roles and remain classified
as sensitive. Their verified editions add Amharic, Swahili and Tagalog coverage
and Hindi resources for relationship plans.

---

## The model

```js
{
  id: 'keller-meaning-of-marriage',   // stable; referenced by replacementResourceId
  type: 'book',                       // RESOURCE_TYPES
  originalLanguage: 'en',             // the language it was written/produced in
  topics: ['marriage', 'covenant'],   // RESOURCE_TOPICS
  lifeStages: ['single', 'engaged'],  // LIFE_STAGES
  status: 'needs_review',             // draft | needs_review | approved | retired
  reviewLevel: 'standard',            // standard | sensitive (standard if omitted)
  contentReview: { status: 'approved', reviewedBy: '…', reviewedAt: 'YYYY-MM-DD' },
  safetyReview: { status: 'approved', reviewedBy: '…', reviewedAt: 'YYYY-MM-DD' },
                                       // both required when sensitive; omit while pending
  replacementResourceId: null,        // set when retiring something with a successor
  description: { en: '…', fr: '…' },  // OUR one sentence on why it fits — localized
  editions: {
    en: { title, author, publisher, url, available: true, lastVerifiedAt: '2026-08-26',
          thumbnail: '/resources/covers/keller-meaning-of-marriage.webp' },  // optional
    de: { …a verified German edition, or the key is simply absent… },
  },
}
```

Taxonomy, types, life stages, statuses and review levels live in
`src/content/resources/topics.js`. Keep the taxonomy small and flat — a tag
nobody uses is worse than no tag.

### Relationships and family taxonomy

The shared flat taxonomy now supports the engaged and married plans. Reuse an
existing tag when it expresses the subject; do not create per-plan variants.

- Stages and relationships: `premarital`, `marriage`, `covenant`, `friendship`
- Relating well: `communication`, `listening`, `conflict`, `forgiveness`, `trust`
- Life together: `finances`, `work`, `family-of-origin`, `boundaries`,
  `hospitality`, `generosity`, `mission`
- Faith and community: `spiritual-formation`, `spiritual-rhythms`,
  `prayer-together`, `community`, `church`
- Family: `family`, `children`, `parenting`, `family-discipleship`
- Difficult seasons and safety: `suffering`, `grief`, `infertility`,
  `miscarriage`, `marriage-crisis`, `abuse-safety`, `trauma`, `divorce`,
  `pornography`, `addiction`, `infidelity`, `illness`, `marriage-roles`

The nearby tags above are deliberate distinctions: `community` is broader than
`church`; `family` is broader than child-specific content; `sexuality` is broad,
while `sexual-intimacy` is specifically couple-facing; and
`spiritual-formation` is broader than shared spiritual rhythms. Prefer the
narrower tag only when it materially improves matching.

### Thumbnails

Every card carries a small cover tile. It has two states, and the second is the
normal one:

1. **A curated cover file**, when an edition names a `thumbnail`. It must be a
   path to a file we host ourselves under `public/resources/covers/` — see the
   README there for sizing, naming and the licensing question.
2. **A generated tile**, otherwise: the resource's type glyph on a tint seeded
   from its id, so three books read as three distinct covers. Costs no bytes,
   fakes no artwork, and is also what a card falls back to when a cover file is
   missing or the reader is offline.

**A thumbnail may never be hot-linked** from a publisher, a retailer or any other
third party — `src/lib/resourceThumbnail.js` rejects anything that is not a
same-origin path. See §Privacy below: the request itself would leak the reader's
IP and their subject to that host before they tapped anything.

Under the reader's **Low data mode**, cover files are skipped entirely and every
card uses the generated tile. A cover is decoration; that setting exists exactly
for nonessential fetches.

#### Freezing a real cover: `npm run build:covers`

Because a cover may only be served from our own origin, real publisher artwork
has to be fetched **once, at build time, on a developer's machine** and
committed. `scripts/build-covers.mjs` does that from the worksheet in
`scripts/resource-covers.json`: it downloads the publisher's own product image,
crops it to 216×324 (3× the 72×108 shelf tile, at a paperback's 2:3), writes a
webp under `public/resources/covers/`, and prints the `thumbnail:` line and the
README provenance row to paste in. The catalogue is still edited by hand — a
build script never writes to `src/`.

The third-party URLs live in that manifest and **never in `src/`**, so nothing
shipped to a browser knows a publisher's hostname.

Licensing is a human gate, in the same spirit as `status` on an entry:

| `licence` | meaning |
|---|---|
| `unreviewed` | nobody has checked whether we may use this artwork — **skipped** |
| `cleared` | a person confirmed the licence, press kit, or written permission |
| `declined` | checked, and we may not use it; kept so nobody re-checks it |

`npm run build:covers` fetches **only** `cleared` entries, so a run can never
quietly publish artwork nobody has cleared. `-- --list` shows the worksheet
without changing anything; `-- --force` re-fetches a cover that already exists.
An entry with no cleared cover is not a defect — its card draws the generated
tile, which is what most of the catalogue uses today.

### `description` is ours, not the publisher's

One short sentence, written by us, saying why this fits *this* subject. Never a
copied publisher blurb. It is a localized field like the rest of our content
(`{ en, fr, … }`) and resolves through `pick()`.

---

## Multilingual: locales are not translations of each other

The goal is **not** "translate the English list". It is: give a reader a
trustworthy resource on this subject *in a language they can actually use*.

A German reader may be offered a completely different, German-authored book by a
different author than an English reader gets on the same topic — and that is
**preferred** over a translation.

### Language selection and ordering (`src/lib/resources.js`)

1. The app language is always enabled, ranks first and cannot be removed.
2. Every additional language selected by the reader is eligible on the same
   shelf. For each resource, the resolver chooses the first verified edition in
   `[app language, ...selected languages]`, so a work never appears twice.
3. App-language resources sort first, followed by additional languages in the
   reader's selection order. Within one language, an originally authored work
   ranks before a verified translation.
4. If no approved resource has a relevant edition in any enabled language, show
   no "Go deeper" shelf.

English is preselected as an additional language for a new reader. It can add a
relevant English-only title even when the day also has app-language resources;
it is visible and removable. Readers may add any other language with at least
one approved, renderable catalogue edition. `availableResourceLanguages()` uses
the same approval and edition gates as the resolver to keep zero-coverage
languages out of Settings. Availability somewhere in the catalogue does not
promise a match for every plan domain or day.

The preference is stored on the device under `pfm_resource_langs`; an explicitly
saved empty list means app language only. Every card names its **type and its
language**, so an additional-language recommendation is obvious before it is
opened.

### Never fabricate an edition

If a book has no verified German, Arabic, Korean or Swahili edition, **do not
add one**. Do not translate a title, invent an ISBN, guess a publisher, or
construct a URL. Leave the language key out; the resolver will simply not offer
that resource to that reader.

AI may help a curator *discover candidates*. Publication always requires a human.

---

## What the resolver guarantees

`resolveResources({ topics, lifeStage, languages, boostTopics, limit, catalogue })`

- only `status: 'approved'` entries;
- sensitive entries only after both explicit content and safety sign-offs;
- only editions with a `lastVerifiedAt` date and not marked `available: false`;
- only editions with a usable HTTPS URL and verified localized title;
- only entries whose topics overlap the day's `resourceTopics`;
- only entries whose `lifeStages` include the plan's `lifeStage` (when declared);
- chooses at most one edition per resource, using app language before selected
  additional languages;
- ranked by language order, then perspective, original-language authorship and
  topic fit;
- the reader's **growth areas** boost ranking only — they can never pull an
  off-topic resource in;
- returns the complete matching mixed-language set by default, which is what the
  shelf renders (callers may still pass an explicit cap);
- `[]` when nothing qualifies, so the caller omits the section.

### Why the shelf opens complete

It used to preview three cards behind a second “load more” tap. That put two
gates in front of a book the resolver had *already* judged relevant to today,
and it hid the shape of the shelf: a day matching fifteen titles looked exactly
like a day matching three. The count sits on the collapsed header, so a reader
who expands has asked for the whole set — and gets it. Cards run one column on a
phone and two-up from `sm` upward; each card is a single link, cover included,
so the tap target is the card rather than a line of 11px text.

---

## Review workflow

```
draft ──► needs_review ──► approved ──► retired
                              ▲            │
                              └── re-verify┘
```

**To approve an entry**

1. Read enough of it to stand behind it pastorally and theologically.
2. Confirm the title, author and publisher against the actual edition.
3. Find the **canonical** URL — publisher, author, or ministry page. Not a
   retailer. Praystead is not a bookstore. (Purchase links, if ever added, stay
   secondary and region-aware.)
4. Write the one-sentence `description` in en + fr.
5. Set `lastVerifiedAt` on that edition and `status: 'approved'`.
6. If it is sensitive, complete the two reviews below before publication.

### Sensitive-resource review

Set `reviewLevel: 'sensitive'` for resources involving intimacy, infertility,
abuse, divorce or separation, submission or authority, pornography, severe
marriage crisis, trauma, coercion, addiction, infidelity, miscarriage, or
serious illness. The resolver also treats the corresponding sensitive taxonomy
tags as sensitive even if an entry incorrectly says `reviewLevel: 'standard'`.
This prevents a metadata downgrade from bypassing review.

Sensitive publication requires both fields, with `status: 'approved'`, a
non-empty reviewer identifier, and an ISO review date:

```js
contentReview: {
  status: 'approved',
  reviewedBy: 'content-reviewer-id',
  reviewedAt: 'YYYY-MM-DD',
},
safetyReview: {
  status: 'approved',
  reviewedBy: 'safety-reviewer-id',
  reviewedAt: 'YYYY-MM-DD',
},
```

Content review covers theology, pastoral framing, language, and whether the
resource supports rather than replaces prayer and Scripture. Safety review
covers coercion, abuse, trauma, crisis language, confidentiality, and whether it
appropriately permits outside pastoral, clinical, medical, legal, or
safeguarding help. A catalogue `status` alone is never a sensitive sign-off.
Leave either field absent while review is pending; the resource will not render.

#### Deliverance material

Every taxonomy tag added for the 30-day deliverance plan — `deliverance`,
`spiritual-warfare`, `renunciation`, `covenants`, `curses`, `altars`, `occult`,
`idolatry`, `secret-societies`, `dedications`, `family-line`,
`generational-patterns`, `strongholds` — is in `SENSITIVE_RESOURCE_TOPICS`, so it
raises the review level on its own. Alongside the checks above, review such a
resource for:

- biblical grounding, and whether the teaching is **fear-based**;
- **unsupported certainty** — naming demons, diagnosing a curse from symptoms,
  telling a reader what a dream proves;
- dangerous medical claims, or anything discouraging medical or psychiatric care;
- encouragement of violence, or of accusing named people, families or groups;
- **commercialisation** of deliverance, and coercive ministry practices.

Recommending a book on this subject is a pastoral act with a real risk of harm.
An empty shelf is the correct outcome when nothing has been approved — the plan
is complete without it. See `docs/FREEDOM_DELIVERANCE.md` § Resource mappings.

### `perspective` — theological context, never a verdict

An entry may declare `perspective: ['african-pentecostal', 'pentecostal']` from
`RESOURCE_PERSPECTIVES`. It explains where a resource's teaching sits; it never
says one tradition is better than another, and it is never shown as a judgement.

A plan may declare `resourcePerspectives: [...]`, which `usePlanDay` passes to
the resolver as `perspectiveOrder`. It **orders** resources within their selected
language after every approval gate has passed — it can never add a resource,
remove one, or override topic relevance or language priority. An entry with no
perspective, or one the plan did not rank, sorts after those it did rather than
being dropped.

**To add a locale**

Add only a language key you have personally verified exists. It may be a
translated edition of an existing entry, or — better — a separate entry created
in that language.

**To retire an entry**

Set `status: 'retired'`. If there is a successor, set `replacementResourceId`.
Retired entries never render; `replacementFor()` follows the successor only
when the successor passes the same publication, sensitive-review, and verified
edition gates. Replacement metadata cannot bypass review.

**Link maintenance**

`lastVerifiedAt` is the re-check clock. Re-verify periodically; anything that has
gone dead should be retired rather than left to 404. A broken resource must
never block the prayer plan — it simply disappears from the day.

The 2026-08-26 relationship-plan audit replaced Amazon and YouTube playlist
links with official Crossway, Penguin Random House, Zondervan, New Growth Press,
P&R Publishing, Baker Publishing Group, and Desiring God pages. Availability,
edition identity, and review status remain separate checks.

---

## Role-specific and disputed material

Resources attached to husband/wife reflections need the same theological review
as the reflections themselves (see `docs/PRAYER_PLANS.md`). Where Christian
traditions differ on marriage roles, do not approve a resource that presents one
disputed interpretation as the settled Christian position.

---

## Privacy

Resource recommendations are resolved **entirely on the device** from a bundled
catalogue. No topic, no plan day, no preference and no reader identifier is sent
anywhere to produce them. Opening one emits `resource_opened` with **no
properties** — not the id, the title, the topic, or the language.

Cover thumbnails are held to the same rule, which is why they are self-hosted
only. A `<img>` pointing at a publisher's or a retailer's CDN is a request the
reader never made: it would carry their IP and, by the filename, the subject they
are praying about, to a third party who could log it — all before they decided
whether to open the resource at all. Nothing about "Go deeper" should reach the
network until the reader taps the link.
