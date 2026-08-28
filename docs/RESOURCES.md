# The curated resource catalogue ("Go deeper")

A plan day may offer one to three external resources — a book, an article, a
podcast, a teaching, a video, a study, a prayer guide. They sit at the very
bottom of the day, folded away, and the plan is complete without them.

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
was moved back to `needs_review` and marked `sensitive`. It remains invisible
until both named reviews below exist. No localized title, edition, ISBN, author,
or URL was fabricated to fill a language gap.

The publication gate has not moved; entries pass through it one at a time. Until a curator
verifies an entry and flips it to `approved` (and supplies both sign-offs when
the entry is sensitive), the app shows **no "Go deeper"
section at all** — not an apology, not an empty state. `src/lib/resources.test.js`
asserts that an unreviewed entry resolves to nothing no matter what its editions
claim, and that every approved edition carries a verified URL.

`approved` is a promise that the entry is live, so it must never be set on
something the resolver would drop. Three sensitive entries
(`piper-momentary-marriage`, `keller-meaning-of-marriage`,
`elliot-passion-and-purity`) once carried `approved` with no sign-offs, which
made them permanently invisible under an approval that was not true. Both
reviews now exist for each of them, so they publish. A test rejects any
`approved` entry the resolver refuses to display.

That mistake has a mirror image, and it is just as quiet: an entry whose
sign-offs are recorded but whose `status` is missing entirely is dropped too, so
the curator's work reaches nobody and nothing says so. A second test requires
every entry to state one of `RESOURCE_STATUSES`.

### What actually reaches a reader today

Ten entries are displayable. Three of them now carry eleven verified localized
editions in French, German, Portuguese, Spanish and Japanese. Counting the days
of each relationship plan that resolve to at least one resource in that exact
language (without fallback):

| Plan | days | en | fr | de | pt | es | ja |
|---|---:|---:|---:|---:|---:|---:|---:|
| `preparing21` | 21 | 17 | 11 | 10 | 10 | 15 | 10 |
| `covenant21` | 21 | 13 | 9 | 11 | 11 | 11 | 11 |
| `marriage30` | 30 | 24 | 22 | 22 | 22 | 22 | 22 |

The six other plans declare no `resourceTopics` on any day, so they never show a
"Go deeper" shelf in any language.

The other ten app languages currently have no displayable edition. English is
therefore the default fallback for those readers, but it is used only when their
app language has no relevant match and can be turned off in Resource languages.

Two newly discovered multilingual studies are recorded as `needs_review`, not
published: Family Discipleship Ministries' *Marriage Is a Ministry* (English,
Spanish, Hindi, Swahili and Amharic), and Shepherds Global Classroom's
*Christian Family* (Simplified Chinese, Hindi and Tagalog). Both cover sensitive
subjects such as sexuality, intimacy or marriage roles and remain invisible
until both pastoral/content and safety reviews are signed.

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

### The fallback hierarchy (`src/lib/resources.js`)

1. Try the app language as a complete tier: approved resources **originally in
   that language** rank before verified translations.
2. Only when that tier has no relevant result, try configured fallback languages
   one at a time in the reader's chosen order.
3. If every tier is empty, show no "Go deeper" shelf.

English is preselected as a fallback for a new reader, matching the product rule
"English if none is found". It never supplements a smaller local-language list:
one relevant local result is enough to keep the whole shelf local. English is a
visible, removable option, and readers may add any other language they can read.
The preference is stored on the device under `pfm_resource_langs`; an explicitly
saved empty list means no fallback. The app language is always first and cannot
be removed.

Every card names its **type and its language**, so a fallback-language
recommendation is obvious before it is opened.

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
- ranked by the language hierarchy above, then by topic fit;
- the reader's **growth areas** boost ranking only — they can never pull an
  off-topic resource in;
- capped at 3, and usually one is enough;
- `[]` when nothing qualifies, so the caller omits the section.

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
   retailer. Pray4Me is not a bookstore. (Purchase links, if ever added, stay
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
